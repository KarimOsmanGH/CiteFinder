import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

interface Citation {
  id: string
  text: string
  authors?: string
  year?: string
  title?: string
  confidence: number
}

interface RelatedPaper {
  id: string
  title: string
  authors: string[]
  year: string
  abstract: string
  url: string
  similarity: number
}

// Citation extraction patterns
const citationPatterns = [
  // APA Style: Author, A. A., & Author, B. B. (Year). Title. Journal, Volume(Issue), Pages.
  /([A-Z][a-z]+,\s*[A-Z]\.\s*[A-Z]?\.?\s*(?:&\s*[A-Z][a-z]+,\s*[A-Z]\.\s*[A-Z]?\.?\s*)*\(\d{4}\)\.\s*[^.]*\.\s*[^.]*,\s*\d+\(\d+\),\s*\d+-\d+\.)/g,
  
  // MLA Style: Author, A. "Title." Journal, vol. Volume, no. Issue, Year, pp. Pages.
  /([A-Z][a-z]+,\s*[A-Z]\.\s*"([^"]+)"\s*[^.]*,\s*vol\.\s*\d+,\s*no\.\s*\d+,\s*\d{4},\s*pp\.\s*\d+-\d+\.)/g,
  
  // Chicago Style: Author, A. A., and B. B. Author. "Title." Journal Volume, no. Issue (Year): Pages.
  /([A-Z][a-z]+,\s*[A-Z]\.\s*[A-Z]?\.?\s*,\s*and\s*[A-Z]\.\s*[A-Z]?\.?\s*[A-Z][a-z]+\.\s*"([^"]+)"\s*[^.]*,\s*\d+,\s*no\.\s*\d+\s*\(\d{4}\):\s*\d+-\d+\.)/g,
  
  // Simple author-year: (Author, Year) or Author et al. (Year)
  /\(([A-Z][a-z]+(?:\s+et\s+al\.)?,\s*\d{4})\)/g,
  
  // Author et al. (Year) format
  /([A-Z][a-z]+\s+et\s+al\.\s*\(\d{4}\))/g,
  
  // Basic author-year format
  /([A-Z][a-z]+\s+\(\d{4}\))/g
]

function extractYear(text: string): string | undefined {
  const yearMatch = text.match(/\b(19|20)\d{2}\b/)
  return yearMatch ? yearMatch[0] : undefined
}

function extractAuthors(text: string): string | undefined {
  // Extract authors before the year
  const authorMatch = text.match(/^([^(]+?)(?:\s*\(\d{4}\)|,|\.)/)
  if (authorMatch) {
    return authorMatch[1].trim()
  }
  return undefined
}

function extractTitle(text: string): string | undefined {
  // Try to extract title from quotes
  const titleMatch = text.match(/"([^"]+)"/)
  if (titleMatch) {
    return titleMatch[1]
  }
  
  // Try to extract title from period-separated parts
  const parts = text.split('.')
  if (parts.length > 1) {
    return parts[1]?.trim()
  }
  
  return undefined
}

function extractKeyTopics(text: string): string[] {
  // Extract key phrases and concepts that likely have academic papers
  const topics: string[] = []
  
  // Common academic keywords and phrases
  const academicKeywords = [
    'sensors', 'imaging', 'spectral', 'thermal', 'multispectral', 'hyperspectral',
    'monitoring', 'detection', 'analysis', 'assessment', 'evaluation',
    'technology', 'methodology', 'technique', 'approach', 'system',
    'application', 'implementation', 'development', 'research', 'study',
    'investigation', 'examination', 'characterization', 'optimization',
    'performance', 'efficiency', 'accuracy', 'precision', 'reliability',
    'validation', 'verification', 'calibration', 'calibration'
  ]
  
  // Extract sentences and phrases containing academic keywords
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10)
  
  for (const sentence of sentences) {
    const lowerSentence = sentence.toLowerCase()
    
    // Check if sentence contains academic keywords
    for (const keyword of academicKeywords) {
      if (lowerSentence.includes(keyword)) {
        // Extract the full phrase around the keyword
        const keywordIndex = lowerSentence.indexOf(keyword)
        const start = Math.max(0, keywordIndex - 50)
        const end = Math.min(sentence.length, keywordIndex + keyword.length + 50)
        const phrase = sentence.substring(start, end).trim()
        
        if (phrase.length > 20 && !topics.includes(phrase)) {
          topics.push(phrase)
        }
      }
    }
  }
  
  // If no specific topics found, use the main themes from the text
  if (topics.length === 0) {
    const words = text.toLowerCase().split(/\s+/)
    const wordFreq: { [key: string]: number } = {}
    
    words.forEach(word => {
      if (word.length > 4 && !['with', 'that', 'this', 'they', 'have', 'been', 'from', 'their'].includes(word)) {
        wordFreq[word] = (wordFreq[word] || 0) + 1
      }
    })
    
    const topWords = Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word)
    
    topics.push(...topWords)
  }
  
  return topics.slice(0, 10) // Limit to 10 topics
}

async function findRelatedPapersFromTopics(topics: string[]): Promise<Citation[]> {
  const citations: Citation[] = []
  let idCounter = 1
  
  for (const topic of topics) {
    try {
      // Search across all databases for each topic
      const arxivResults = await searchArxiv(topic)
      const openAlexResults = await searchOpenAlex(topic)
      const crossRefResults = await searchCrossRef(topic)
      const pubmedResults = await searchPubMed(topic)
      
      // Combine and deduplicate results
      const allResults = [...arxivResults, ...openAlexResults, ...crossRefResults, ...pubmedResults]
      const uniqueResults = allResults.filter((result, index, self) => 
        index === self.findIndex(r => r.title === result.title)
      )
      
      // Convert to citations with high confidence for content-based discovery
      for (const result of uniqueResults.slice(0, 3)) { // Top 3 results per topic
        const authors = result.authors.join(', ')
        const year = result.year
        
        citations.push({
          id: `discovered-${idCounter++}`,
          text: `${authors} (${year}). ${result.title}.`,
          authors,
          year,
          title: result.title,
          confidence: 0.85 // High confidence for discovered papers
        })
      }
    } catch (error) {
      console.error(`Error searching for topic "${topic}":`, error)
    }
  }
  
  return citations
}

function extractCitations(text: string): Citation[] {
  const citations: Citation[] = []
  const seen = new Set<string>()
  let idCounter = 1

  for (const pattern of citationPatterns) {
    const matches = text.matchAll(pattern)
    
    for (const match of matches) {
      const citationText = match[0]
      
      if (!seen.has(citationText)) {
        seen.add(citationText)
        
        const year = extractYear(citationText)
        const authors = extractAuthors(citationText)
        const title = extractTitle(citationText)
        
        // Calculate confidence based on pattern complexity
        let confidence = 0.7
        if (citationText.includes('"') && citationText.includes('(') && citationText.includes(')')) {
          confidence = 0.9
        } else if (citationText.includes('(') && citationText.includes(')')) {
          confidence = 0.8
        }

        citations.push({
          id: `citation-${idCounter++}`,
          text: citationText,
          authors,
          year,
          title,
          confidence
        })
      }
    }
  }

  return citations
}

// Search arXiv API (manual XML parsing)
async function searchArxiv(searchQuery: string): Promise<RelatedPaper[]> {
  try {
    const response = await axios.get(`http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(searchQuery)}&start=0&max_results=5`)
    const xmlText = response.data
    
    const papers: RelatedPaper[] = []
    const entries = xmlText.match(/<entry>([\s\S]*?)<\/entry>/g)
    
    if (entries) {
      for (const entry of entries.slice(0, 5)) {
        const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/)
        const summaryMatch = entry.match(/<summary>([\s\S]*?)<\/summary>/)
        const publishedMatch = entry.match(/<published>(\d{4}-\d{2}-\d{2})/)
        const idMatch = entry.match(/<id>([\s\S]*?)<\/id>/)
        
        if (titleMatch && idMatch) {
          const title = titleMatch[1].replace(/\s+/g, ' ').trim()
          const abstract = summaryMatch ? summaryMatch[1].replace(/\s+/g, ' ').trim() : ''
          const year = publishedMatch ? publishedMatch[1].split('-')[0] : 'Unknown'
          const url = idMatch[1]
          
          papers.push({
            id: `arxiv-${papers.length + 1}`,
            title,
            authors: ['arXiv Author'], // Simplified for demo
            year,
            abstract,
            url,
            similarity: 0.8
          })
        }
      }
    }
    
    return papers
  } catch (error) {
    console.error('ArXiv search error:', error)
    return []
  }
}

// Search OpenAlex API
async function searchOpenAlex(searchQuery: string): Promise<RelatedPaper[]> {
  try {
    const response = await axios.get(`https://api.openalex.org/works?search=${encodeURIComponent(searchQuery)}&per_page=5`)
    const papers: RelatedPaper[] = []
    
    if (response.data.results) {
      for (const work of response.data.results.slice(0, 5)) {
        papers.push({
          id: `openalex-${papers.length + 1}`,
          title: work.title || 'Unknown Title',
          authors: work.authorships?.map((a: any) => a.author.display_name) || ['Unknown Author'],
          year: work.publication_year?.toString() || 'Unknown',
          abstract: work.abstract_inverted_index ? Object.keys(work.abstract_inverted_index).join(' ') : '',
          url: work.doi ? `https://doi.org/${work.doi}` : work.openalex_url,
          similarity: 0.85
        })
      }
    }
    
    return papers
  } catch (error) {
    console.error('OpenAlex search error:', error)
    return []
  }
}

// Search CrossRef API
async function searchCrossRef(searchQuery: string): Promise<RelatedPaper[]> {
  try {
    const response = await axios.get(`https://api.crossref.org/works?query=${encodeURIComponent(searchQuery)}&rows=5`)
    const papers: RelatedPaper[] = []
    
    if (response.data.message.items) {
      for (const item of response.data.message.items.slice(0, 5)) {
        papers.push({
          id: `crossref-${papers.length + 1}`,
          title: item.title?.[0] || 'Unknown Title',
          authors: item.author?.map((a: any) => `${a.given} ${a.family}`) || ['Unknown Author'],
          year: item.published?.['date-parts']?.[0]?.[0]?.toString() || 'Unknown',
          abstract: item.abstract || '',
          url: item.DOI ? `https://doi.org/${item.DOI}` : item.URL,
          similarity: 0.8
        })
      }
    }
    
    return papers
  } catch (error) {
    console.error('CrossRef search error:', error)
    return []
  }
}

// Search PubMed API
async function searchPubMed(searchQuery: string): Promise<RelatedPaper[]> {
  try {
    const response = await axios.get(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(searchQuery)}&retmode=json&retmax=5`)
    const papers: RelatedPaper[] = []
    
    if (response.data.esearchresult?.idlist) {
      for (const id of response.data.esearchresult.idlist.slice(0, 5)) {
        papers.push({
          id: `pubmed-${papers.length + 1}`,
          title: 'PubMed Article', // Simplified for demo
          authors: ['PubMed Author'],
          year: 'Unknown',
          abstract: 'Abstract available on PubMed',
          url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
          similarity: 0.75
        })
      }
    }
    
    return papers
  } catch (error) {
    console.error('PubMed search error:', error)
    return []
  }
}

// Search for related papers using multiple academic APIs
async function searchRelatedPapers(citations: Citation[]): Promise<RelatedPaper[]> {
  const allPapers: RelatedPaper[] = []
  const seenTitles = new Set<string>()

  for (const citation of citations.slice(0, 3)) { // Limit to top 3 citations for performance
    const searchQuery = citation.title || citation.authors || citation.text.substring(0, 100)
    if (!searchQuery) continue

    try {
      // Search all APIs in parallel
      const [arxivResults, openAlexResults, crossrefResults, pubmedResults] = await Promise.allSettled([
        searchArxiv(searchQuery),
        searchOpenAlex(searchQuery),
        searchCrossRef(searchQuery),
        searchPubMed(searchQuery)
      ])

      // Collect results from successful API calls
      const results = [arxivResults, openAlexResults, crossrefResults, pubmedResults]
        .filter(result => result.status === 'fulfilled')
        .flatMap(result => (result as PromiseFulfilledResult<RelatedPaper[]>).value)

      // Add unique papers
      for (const paper of results) {
        if (!seenTitles.has(paper.title.toLowerCase())) {
          seenTitles.add(paper.title.toLowerCase())
          allPapers.push(paper)
        }
      }
    } catch (error) {
      console.error('Error searching for related papers:', error)
    }
  }

  // Sort by similarity and limit results
  return allPapers
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 15)
}

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text content is required' },
        { status: 400 }
      )
    }

    // First, try to extract existing citations
    const existingCitations = extractCitations(text)
    
    // Then, analyze content and find related papers
    const keyTopics = extractKeyTopics(text)
    const discoveredCitations = await findRelatedPapersFromTopics(keyTopics)
    
    // Combine both types of citations
    const allCitations = [...existingCitations, ...discoveredCitations]
    
    // Get related papers for all citations
    const relatedPapers = await searchRelatedPapers(allCitations)

    return NextResponse.json({
      citations: allCitations,
      relatedPapers,
      textLength: text.length,
      pages: Math.ceil(text.length / 2000),
      topicsFound: keyTopics,
      existingCitationsCount: existingCitations.length,
      discoveredCitationsCount: discoveredCitations.length
    })

  } catch (error) {
    console.error('Error processing text:', error)
    return NextResponse.json(
      { error: 'Failed to process text' },
      { status: 500 }
    )
  }
} 