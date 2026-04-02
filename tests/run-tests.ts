import assert from 'node:assert/strict'
import { extractStatements } from '../lib/citation-processing'
import { searchRelatedPapers } from '../lib/api-search'
import type { Citation, RelatedPaper } from '../types'

async function testStatementPositionsSurviveNormalization() {
  const text = [
    'Intro line with spacing.',
    '',
    'Results show the model improves accuracy by 12% across the benchmark dataset.',
    'Closing context line.'
  ].join('\n')

  const statements = extractStatements(text)
  assert.ok(statements.length > 0, 'expected at least one extracted statement')

  const target = statements.find((statement) => statement.text.includes('improves accuracy by 12%'))
  assert.ok(target, 'expected quantitative statement to be extracted')
  assert.ok(target.startIndex > 0, 'statement should not collapse to index 0 after normalization')
  assert.match(target.contextBefore || '', /Intro line with spacing\./, 'contextBefore should come from surrounding source text')
  assert.match(target.snippet || '', /Results show the model improves accuracy by 12%/, 'snippet should include the original statement text')
}

async function testFallbackExtractionIsStableAcrossMultipleMatches() {
  const text = [
    'Alpha study covers baseline calibration for the field',
    'Beta research examines deployment constraints in practice',
    'Gamma analysis reviews downstream outcomes carefully'
  ].join('\n')

  const statements = extractStatements(text)
  assert.equal(statements.length, 3, 'fallback extraction should keep all academic sentences instead of skipping alternating matches')
  assert.deepEqual(
    statements.map((statement) => statement.text),
    [
      'Alpha study covers baseline calibration for the field.',
      'Beta research examines deployment constraints in practice.',
      'Gamma analysis reviews downstream outcomes carefully.'
    ]
  )
}

async function testExistingCitationSearchUsesPerCitationCap() {
  const citations: Citation[] = [
    { id: 'c1', text: 'Citation One', title: 'Citation One', confidence: 0.8 },
    { id: 'c2', text: 'Citation Two', title: 'Citation Two', confidence: 0.8 }
  ]

  const makePaper = (id: string): RelatedPaper => ({
    id,
    title: `Paper ${id}`,
    authors: ['Test Author'],
    year: '2024',
    abstract: 'Detailed abstract with enough overlap for scoring.',
    similarity: 0
  })

  const result = await searchRelatedPapers(citations, [], {
    searchArxiv: async (query: string) => query === 'Citation One'
      ? Array.from({ length: 6 }, (_, index) => makePaper(`one-${index + 1}`))
      : Array.from({ length: 6 }, (_, index) => makePaper(`two-${index + 1}`)),
    searchOpenAlex: async () => [],
    searchCrossRef: async () => [],
    searchPubMed: async () => [],
    calculateSimilarityScore: async (_query: string, paper: RelatedPaper) => {
      const fromSecondCitation = paper.id.startsWith('two-')
      return fromSecondCitation ? 88 : 92
    }
  })

  assert.equal(result.length, 8, 'search should use the total budget while allowing later citations to contribute results')
  assert.ok(result.some((paper) => paper.id.startsWith('two-')), 'later citations should still contribute papers after earlier ones consume their per-citation budget')
}

async function main() {
  const tests: Array<[string, () => Promise<void>]> = [
    ['statement positions survive normalization', testStatementPositionsSurviveNormalization],
    ['fallback extraction keeps every academic sentence', testFallbackExtractionIsStableAcrossMultipleMatches],
    ['existing citation search uses per-citation cap', testExistingCitationSearchUsesPerCitationCap]
  ]

  for (const [name, test] of tests) {
    await test()
    console.log(`PASS ${name}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
