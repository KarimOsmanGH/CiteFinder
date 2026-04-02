import assert from 'node:assert/strict'

import { extractStatements } from '../lib/citation-processing'
import { searchRelatedPapers } from '../lib/api-search'
import type { Citation, RelatedPaper } from '../types'

function makePaper(title: string): RelatedPaper {
  return {
    id: title.toLowerCase().replace(/\s+/g, '-'),
    title,
    authors: ['Author One'],
    year: '2024',
    abstract: `${title} abstract`,
    similarity: 0,
    url: `https://example.com/${encodeURIComponent(title)}`
  }
}

export async function run(): Promise<void> {
  const normalizedText = [
    'Background context line.',
    '',
    'Research shows drones improve crop monitoring accuracy by 20%.',
    '',
    'Closing sentence.'
  ].join('\n')

  const extracted = extractStatements(normalizedText)
  const target = extracted.find((statement) => statement.text.includes('drones improve crop monitoring accuracy'))

  assert.ok(target, 'expected factual statement to be extracted')
  assert.notEqual(target.startIndex, 0, 'statement should keep its original start index after normalization')
  assert.match(target.contextBefore ?? '', /Background context line/, 'contextBefore should come from the original source location')
  assert.match(target.contextAfter ?? '', /Closing sentence/, 'contextAfter should come from the original source location')

  const fallbackText = [
    'This background paragraph provides context without obvious factual triggers',
    'Another research summary discusses methodology and data collection in detail',
    'The final analysis section reviews method selection and evaluation strategy carefully'
  ].join('\n')

  const fallbackStatements = extractStatements(fallbackText)
  assert.equal(fallbackStatements.length, 3, 'fallback extractor should not skip matches due to regex state')

  const citations: Citation[] = [
    { id: 'citation-1', text: 'First Citation', title: 'First Citation', confidence: 0.9 },
    { id: 'citation-2', text: 'Second Citation', title: 'Second Citation', confidence: 0.9 }
  ]

  const related = await searchRelatedPapers(citations, [], {
    searchArxiv: async (query: string) => [makePaper(`${query} arxiv 1`), makePaper(`${query} arxiv 2`)],
    searchOpenAlex: async (query: string) => [makePaper(`${query} openalex 1`), makePaper(`${query} openalex 2`)],
    searchCrossRef: async (query: string) => [makePaper(`${query} crossref 1`)],
    searchPubMed: async (query: string) => [makePaper(`${query} pubmed 1`)],
    calculateSimilarityScore: async () => 80,
    getSemanticSimilarity: async () => 0.8
  })

  assert.equal(related.length, 8, 'search should respect total cap while allowing papers from later citations')
  assert.ok(
    related.some((paper) => paper.title.toLowerCase().includes('second citation')),
    'later citations should still contribute papers instead of being truncated by the first citation'
  )
}
