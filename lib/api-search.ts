// Academic API search functions

import axios from 'axios'
import { RelatedPaper, Citation, StatementWithPosition } from '@/types'
import { 
  API_TIMEOUT, 
  API_RESULT_LIMITS,
  SIMILARITY_THRESHOLDS,
  CONFIDENCE
} from './constants'
import { 
  withTimeout, 
  extractKeyTermsFromStatement, 
  extractSupportingQuote,
  generateId 
} from './utils'
import { embedText, cosineSimilarity } from './embeddings'

/**
 * Search arXiv API
 */
export async function searchArxiv(searchQuery: string): Promise<RelatedPaper[]> {
  try {
    const keyTerms = searchQuery.split(' ').filter(term => term.length > 2)
    const words = keyTerms.slice(0, 8)
    
    // Build phrase query
    const phrases: string[] = []
    for (let i = 0; i < Math.min(words.length - 1, 3); i++) {
      phrases.push(`"${words[i]} ${words[i+1]}"`)
    }
    
    const searchQueries = [
      phrases.length > 0 
        ? `${phrases[0]} AND (${keyTerms.slice(0, 4).join(' OR ')})`
        : keyTerms.slice(0, 5).join(' AND '),
      keyTerms.slice(0, 5).join(' AND '),
      `cat:cs.* OR cat:eess.* OR cat:stat.ML`
    ]
    
    for (const query of searchQueries) {
      const response = await axios.get('http://export.arxiv.org/api/query', {
        params: {
          search_query: query,
          start: 0,
          max_results: API_RESULT_LIMITS.ARXIV,
          sortBy: 'relevance',
          sortOrder: 'descending'
        },
        timeout: API_TIMEOUT.ARXIV
      })

      const papers: RelatedPaper[] = []
      const xmlText = response.data
      const entryMatches = xmlText.match(/<entry>([\s\S]*?)<\/entry>/g)
      
      if (entryMatches && entryMatches.length > 0) {
        for (const entry of entryMatches) {
          if (papers.length >= API_RESULT_LIMITS.ARXIV) break
          
          const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/)
          const summaryMatch = entry.match(/<summary>([\s\S]*?)<\/summary>/)
          const publishedMatch = entry.match(/<published>([\s\S]*?)<\/published>/)
          const idMatch = entry.match(/<id>([\s\S]*?)<\/id>/)
          
          const authorMatches = entry.match(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<\/author>/g)
          const authors: string[] = []
          if (authorMatches) {
            for (const authorMatch of authorMatches) {
              const nameMatch = authorMatch.match(/<name>([\s\S]*?)<\/name>/)
              if (nameMatch) {
                authors.push(nameMatch[1].trim())
              }
            }
          }
          
          if (titleMatch && summaryMatch && idMatch) {
            const title = titleMatch[1].trim()
            const summary = summaryMatch[1].trim()
            const arxivUrl = idMatch[1].trim()
            const published = publishedMatch ? publishedMatch[1] : ''
            const year = published ? new Date(published).getFullYear().toString() : 'Unknown'
            
            papers.push({
              id: generateId('arxiv'),
              title,
              authors: authors.length > 0 ? authors : ['Unknown Author'],
              year,
              abstract: summary,
              url: arxivUrl,
              similarity: 0
            })
          }
        }
        
        if (papers.length > 0) {
          return papers
        }
      }
    }
    
    return []
  } catch (error) {
    console.error('ArXiv API error:', error)
    return []
  }
}

/**
 * Search OpenAlex API
 */
export async function searchOpenAlex(query: string): Promise<RelatedPaper[]> {
  try {
    const response = await axios.get('https://api.openalex.org/works', {
      params: {
        search: query,
        per_page: API_RESULT_LIMITS.OPENALEX,
        sort: 'relevance_score:desc',
        filter: 'type:article,publication_year:>2000',
        select: 'id,title,authorships,publication_year,abstract_inverted_index,doi,open_access,primary_location'
      },
      timeout: API_TIMEOUT.OPENALEX
    })

    const papers: RelatedPaper[] = []
    const results = response.data.results || []

    for (const work of results) {
      const authors = work.authorships 
        ? work.authorships.map((a: any) => a.author?.display_name || 'Unknown Author') 
        : ['Unknown Author']
      const year = work.publication_year ? work.publication_year.toString() : 'Unknown'

      // Reconstruct abstract from inverted index
      let abstract = 'No abstract available.'
      if (work.abstract_inverted_index && typeof work.abstract_inverted_index === 'object') {
        try {
          const wordPositions: { [key: number]: string } = {}
          for (const [word, positions] of Object.entries(work.abstract_inverted_index)) {
            if (Array.isArray(positions)) {
              for (const pos of positions) {
                wordPositions[pos] = word
              }
            }
          }
          const sortedPositions = Object.keys(wordPositions)
            .map(pos => parseInt(pos))
            .sort((a, b) => a - b)
          const reconstructed = sortedPositions.map(pos => wordPositions[pos]).join(' ')
          if (reconstructed.length > 50) {
            abstract = reconstructed.length > 400 
              ? reconstructed.substring(0, 400) + '...' 
              : reconstructed
          }
        } catch {
          // Keep default abstract
        }
      }

      papers.push({
        id: generateId('openalex'),
        title: work.title || 'Untitled',
        authors,
        year,
        abstract,
        url: work.doi ? `https://doi.org/${work.doi}` : work.open_access?.oa_url || work.openalex_url || '#',
        similarity: 0
      })
    }

    return papers
  } catch (error) {
    console.error('OpenAlex API error:', error)
    return []
  }
}

/**
 * Search CrossRef API
 */
export async function searchCrossRef(query: string): Promise<RelatedPaper[]> {
  try {
    const response = await axios.get('https://api.crossref.org/works', {
      params: {
        query: query,
        rows: API_RESULT_LIMITS.CROSSREF,
        sort: 'relevance',
        filter: 'type:journal-article,from-pub-date:2000'
      },
      timeout: API_TIMEOUT.CROSSREF,
      headers: {
        'User-Agent': 'CiteFinder/1.0 (https://citefinder.app; mailto:support@citefinder.app)'
      }
    })

    const papers: RelatedPaper[] = []
    const items = response.data.message?.items || []

    for (const item of items) {
      if (item.title && item.title[0]) {
        const authors = item.author 
          ? item.author.map((a: any) => `${a.given || ''} ${a.family || ''}`.trim()).filter((n: string) => n.length > 0) 
          : ['Unknown Author']
        const year = item.published?.['date-parts']?.[0]?.[0]?.toString() || 'Unknown'
        
        let abstract = 'No abstract available.'
        if (item.abstract) {
          abstract = item.abstract.length > 300 
            ? item.abstract.substring(0, 300) + '...' 
            : item.abstract
        }

        papers.push({
          id: generateId('crossref'),
          title: item.title[0],
          authors,
          year,
          abstract,
          url: item.DOI ? `https://doi.org/${item.DOI}` : item.URL || '#',
          similarity: 0
        })
      }
    }

    return papers
  } catch (error) {
    console.error('CrossRef API error:', error)
    return []
  }
}

/**
 * Search PubMed API
 */
export async function searchPubMed(query: string): Promise<RelatedPaper[]> {
  try {
    const searchResponse = await axios.get('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi', {
      params: {
        db: 'pubmed',
        term: query,
        retmode: 'json',
        retmax: API_RESULT_LIMITS.PUBMED,
        sort: 'relevance'
      },
      timeout: API_TIMEOUT.PUBMED
    })

    const papers: RelatedPaper[] = []
    const idList = searchResponse.data.esearchresult?.idlist || []

    if (idList.length > 0) {
      const ids = idList.slice(0, 10).join(',')
      const detailResponse = await axios.get('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi', {
        params: {
          db: 'pubmed',
          id: ids,
          retmode: 'json'
        },
        timeout: API_TIMEOUT.PUBMED
      })

      const summaries = detailResponse.data.result

      for (const id of idList.slice(0, 10)) {
        const summary = summaries[id]
        if (summary && summary.title) {
          const authors = summary.authors 
            ? summary.authors.map((a: any) => a.name) 
            : ['Unknown Author']
          const year = summary.pubdate ? summary.pubdate.split(' ')[0] : 'Unknown'

          papers.push({
            id: generateId('pubmed'),
            title: summary.title,
            authors,
            year,
            abstract: summary.abstract || 'No abstract available.',
            url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
            similarity: 0
          })
        }
      }
    }

    return papers
  } catch (error) {
    console.error('PubMed API error:', error)
    return []
  }
}

/**
 * Calculate lexical similarity score
 */
export function calculateLexicalSimilarity(searchQuery: string, paper: RelatedPaper): number {
  const query = searchQuery.toLowerCase()
  const title = paper.title.toLowerCase()
  const abstract = paper.abstract.toLowerCase()
  
  const queryWords = query.split(/\s+/).filter(word => word.length > 2)
  const titleWords = title.split(/\s+/).filter(word => word.length > 2)
  const abstractWords = abstract.split(/\s+/).filter(word => word.length > 2)
  
  let score = 0
  let totalMatches = 0
  
  for (const word of queryWords) {
    if (titleWords.includes(word)) {
      score += 3
      totalMatches++
    }
  }
  
  for (const word of queryWords) {
    if (abstractWords.includes(word)) {
      score += 1
      totalMatches++
    }
  }
  
  const maxPossibleScore = queryWords.length * 4
  let percentage = maxPossibleScore > 0 ? (score / maxPossibleScore) * 100 : 0
  
  if (title.includes(query)) {
    percentage += 30
  } else if (abstract.includes(query)) {
    percentage += 20
  }
  
  if (totalMatches === 0) return 0
  if (totalMatches < 2) percentage = Math.min(percentage, 30)
  if (totalMatches >= 3) percentage = Math.max(percentage, 50)
  
  const domainTerms = ['research', 'study', 'analysis', 'method', 'approach', 'technique', 'system', 'model', 'data', 'results', 'conclusion']
  const domainMatches = domainTerms.filter(term => title.includes(term) || abstract.includes(term)).length
  percentage += domainMatches * 2
  
  return Math.min(percentage, 100)
}

/**
 * Get semantic similarity using embeddings
 */
export async function getSemanticSimilarity(text: string, paper: RelatedPaper): Promise<number> {
  if (!text || !paper.title) return 0

  try {
    const abstractText = (paper.abstract || '').trim()
    const useTitleOnly = abstractText.length < 40 || /no abstract available/i.test(abstractText)
    const paperText = useTitleOnly ? paper.title : `${paper.title}. ${abstractText}`

    const [textEmbedding, paperEmbedding] = await Promise.all([
      embedText(text),
      embedText(paperText)
    ])

    if (textEmbedding.length === 0 || paperEmbedding.length === 0) return 0

    const similarity = cosineSimilarity(textEmbedding, paperEmbedding)
    return Number.isFinite(similarity) ? Math.max(similarity, 0) : 0
  } catch (error) {
    console.error('Semantic similarity error:', error)
    return 0
  }
}

/**
 * Calculate combined similarity score
 */
export async function calculateSimilarityScore(searchQuery: string, paper: RelatedPaper): Promise<number> {
  const semanticSimilarity = await getSemanticSimilarity(searchQuery, paper)
  const semanticScore = Math.round(semanticSimilarity * 100)
  const lexicalScore = Math.round(calculateLexicalSimilarity(searchQuery, paper))
  return Math.max(semanticScore, lexicalScore)
}

/**
 * Calculate statement overlap score
 */
export function calculateStatementOverlapScore(statement: string, paper: RelatedPaper): number {
  const statementTerms = extractKeyTermsFromStatement(statement).toLowerCase().split(' ')
  const paperTitleTerms = paper.title.toLowerCase().split(' ')
  const paperAbstractTerms = paper.abstract.toLowerCase().split(' ')

  let relevance = 0
  let totalMatches = 0

  for (const term of statementTerms) {
    if (paperTitleTerms.includes(term)) {
      relevance += 1
      totalMatches++
    }
  }

  for (const term of statementTerms) {
    if (paperAbstractTerms.includes(term)) {
      relevance += 0.5
      totalMatches++
    }
  }

  const maxPossibleRelevance = statementTerms.length * 1.5
  return maxPossibleRelevance > 0 ? (relevance / maxPossibleRelevance) * 100 : 0
}

/**
 * Find related papers from extracted statements
 */
export async function findRelatedPapersFromStatements(
  statements: StatementWithPosition[]
): Promise<Citation[]> {
  const citations: Citation[] = []
  let idCounter = 1
  
  for (const statement of statements) {
    try {
      const keyTerms = extractKeyTermsFromStatement(statement.text)
      
      const searchPromises = [
        withTimeout(searchArxiv(keyTerms), API_TIMEOUT.SEARCH_BATCH, [] as RelatedPaper[]),
        withTimeout(searchOpenAlex(keyTerms), API_TIMEOUT.SEARCH_BATCH, [] as RelatedPaper[]),
        withTimeout(searchCrossRef(keyTerms), API_TIMEOUT.SEARCH_BATCH, [] as RelatedPaper[]),
        withTimeout(searchPubMed(keyTerms), API_TIMEOUT.SEARCH_BATCH, [] as RelatedPaper[])
      ]
      
      const results = await Promise.allSettled(searchPromises)
      const [arxivResults, openAlexResults, crossRefResults, pubmedResults] = results.map(r => 
        r.status === 'fulfilled' ? r.value : []
      )
      
      const allResults = [...arxivResults, ...openAlexResults, ...crossRefResults, ...pubmedResults]
      const uniqueResults = allResults.filter((result, index, self) => 
        index === self.findIndex(r => r.title.toLowerCase() === result.title.toLowerCase())
      )

      const scoredResults = await Promise.all(
        uniqueResults.map(async (result) => {
          const semanticSimilarity = await getSemanticSimilarity(statement.text, result)
          const overlapScore = calculateStatementOverlapScore(statement.text, result)
          const combinedScore = Math.max(Math.round(semanticSimilarity * 100), Math.round(overlapScore))

          return { result, semanticSimilarity, overlapScore, combinedScore }
        })
      )

      const rankedResults = scoredResults.sort((a, b) => {
        if (b.semanticSimilarity !== a.semanticSimilarity) {
          return b.semanticSimilarity - a.semanticSimilarity
        }
        return b.combinedScore - a.combinedScore
      })

      const filteredResults = rankedResults
        .filter((item, index) => {
          if (item.semanticSimilarity >= SIMILARITY_THRESHOLDS.MIN_SEMANTIC) return true
          if (index === 0 && rankedResults.length > 0) return item.combinedScore >= SIMILARITY_THRESHOLDS.ACCEPTABLE
          return item.combinedScore >= SIMILARITY_THRESHOLDS.HIGH_QUALITY
        })
        .slice(0, API_RESULT_LIMITS.MAX_PAPERS_PER_CITATION)

      const selectedResults = filteredResults.length > 0
        ? filteredResults
        : rankedResults.slice(0, Math.min(rankedResults.length, 2))

      for (const { result, semanticSimilarity, overlapScore } of selectedResults) {
        const authors = result.authors.join(', ')
        const year = result.year

        result.similarity = Math.max(Math.round(semanticSimilarity * 100), Math.round(overlapScore))

        const supportingQuote = extractSupportingQuote(statement.text, result.abstract)

        const semanticConfidence = semanticSimilarity > 0 
          ? CONFIDENCE.SEMANTIC_BASE + semanticSimilarity * CONFIDENCE.SEMANTIC_MULTIPLIER 
          : 0
        const overlapConfidence = overlapScore > 0 
          ? CONFIDENCE.OVERLAP_BASE + (overlapScore / 100) * CONFIDENCE.OVERLAP_MULTIPLIER 
          : 0
        const rawConfidence = Math.max(semanticConfidence, overlapConfidence, CONFIDENCE.MIN)
        const confidence = Math.min(rawConfidence, CONFIDENCE.MAX)

        citations.push({
          id: `discovered-${idCounter++}`,
          text: `${authors} (${year}). ${result.title}.`,
          authors,
          year,
          title: result.title,
          confidence,
          statement: statement.text,
          supportingQuote: supportingQuote || result.abstract
        })
      }
    } catch (error) {
      console.error('Error searching for statement:', error)
    }
  }
  
  return citations.sort((a, b) => b.confidence - a.confidence)
}

/**
 * Search for related papers using multiple academic APIs
 */
export async function searchRelatedPapers(
  citations: Citation[], 
  statements: StatementWithPosition[] = []
): Promise<RelatedPaper[]> {
  const allPapers: RelatedPaper[] = []
  const seenTitles = new Set<string>()

  const discoveredCitations = citations.filter(c => c.statement)
  const existingCitations = citations.filter(c => !c.statement)

  // Process discovered citations
  for (const citation of discoveredCitations) {
    if (!citation.statement) continue

    const paper: RelatedPaper = {
      id: citation.id,
      title: citation.title || 'Unknown Title',
      authors: citation.authors ? citation.authors.split(', ') : ['Unknown Author'],
      year: citation.year || 'Unknown',
      abstract: citation.supportingQuote || 'No abstract available.',
      url: citation.title 
        ? `https://scholar.google.com/scholar?q=${encodeURIComponent(citation.title)}` 
        : '#',
      similarity: Math.round((citation.confidence || 0.5) * 100),
      statement: citation.statement,
      supportingQuote: citation.supportingQuote
    }

    if (!seenTitles.has(paper.title.toLowerCase())) {
      seenTitles.add(paper.title.toLowerCase())
      allPapers.push(paper)
    }
  }

  // Process existing citations
  for (const citation of existingCitations) {
    const searchQuery = citation.title || citation.authors || citation.text.substring(0, 100)
    if (!searchQuery || allPapers.length >= API_RESULT_LIMITS.MAX_PAPERS_PER_CITATION) continue

    try {
      const [arxivResults, openAlexResults, crossrefResults, pubmedResults] = await Promise.allSettled([
        withTimeout(searchArxiv(searchQuery), API_TIMEOUT.SEARCH_RELATED, [] as RelatedPaper[]),
        withTimeout(searchOpenAlex(searchQuery), API_TIMEOUT.SEARCH_RELATED, [] as RelatedPaper[]),
        withTimeout(searchCrossRef(searchQuery), API_TIMEOUT.SEARCH_RELATED, [] as RelatedPaper[]),
        withTimeout(searchPubMed(searchQuery), API_TIMEOUT.SEARCH_RELATED, [] as RelatedPaper[])
      ])

      const results = [arxivResults, openAlexResults, crossrefResults, pubmedResults]
        .filter(result => result.status === 'fulfilled')
        .flatMap(result => (result as PromiseFulfilledResult<RelatedPaper[]>).value)

      for (const paper of results) {
        if (!seenTitles.has(paper.title.toLowerCase()) && allPapers.length < API_RESULT_LIMITS.MAX_PAPERS_PER_CITATION) {
          const similarityScore = await calculateSimilarityScore(searchQuery, paper)

          if (similarityScore < SIMILARITY_THRESHOLDS.MIN_COMBINED) continue

          seenTitles.add(paper.title.toLowerCase())
          paper.similarity = similarityScore

          allPapers.push(paper)
        }
      }
    } catch (error) {
      console.error('Error searching for citations:', error)
    }
  }

  return allPapers.sort((a, b) => b.similarity - a.similarity)
}
