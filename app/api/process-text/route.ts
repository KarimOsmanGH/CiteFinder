import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

interface Citation {
  id: string
  text: string
  authors?: string
  year?: string
  title?: string
  confidence: number
  statement?: string // Added for context
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

// Extract statements/claims that need academic backing
function extractStatements(text: string): string[] {
  const statements: string[] = []
  
  // Split text into sentences more intelligently
  const sentences = text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 20 && s.length < 500) // Filter by length
  
  // Patterns that indicate claims or statements needing citations
  const claimPatterns = [
    // Factual statements
    /\b(?:research shows|studies indicate|evidence suggests|data reveals|analysis demonstrates|results show|findings indicate|it has been|it is known|it has been found|it has been shown|according to|previous studies|recent research)\b/gi,
    
    // Comparative statements
    /\b(?:better than|more effective|superior to|outperforms|improves|enhances|increases|reduces|decreases|significantly|substantially|dramatically|compared to|in contrast|however|nevertheless)\b/gi,
    
    // Methodological claims
    /\b(?:method|technique|approach|system|algorithm|model|framework|protocol|procedure|strategy|solution|methodology|process)\b/gi,
    
    // Performance claims
    /\b(?:accuracy|precision|efficiency|performance|reliability|validity|robustness|scalability|effectiveness|quality|speed|cost|results|outcomes|benefits)\b/gi,
    
    // Technical specifications
    /\b(?:sensors|imaging|spectral|thermal|multispectral|hyperspectral|monitoring|detection|analysis|assessment|evaluation|technology|applications)\b/gi,
    
    // Research findings
    /\b(?:discovered|identified|developed|proposed|introduced|implemented|designed|created|built|constructed|established|found|demonstrated|proven)\b/gi
  ]
  
  for (const sentence of sentences) {
    const lowerSentence = sentence.toLowerCase()
    
    // Check if sentence contains claim patterns
    for (const pattern of claimPatterns) {
      if (pattern.test(lowerSentence)) {
        // Use the complete sentence as-is, just clean up whitespace
        const cleanStatement = sentence
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim()
        
        // Ensure it's a complete, readable statement
        if (cleanStatement.length > 30 && 
            cleanStatement.length < 400 && 
            !statements.includes(cleanStatement) &&
            cleanStatement.includes(' ') && // Has multiple words
            /[a-zA-Z]/.test(cleanStatement)) { // Contains letters
          statements.push(cleanStatement)
        }
        break // Only add each sentence once, even if it matches multiple patterns
      }
    }
  }
  
  // If no specific statements found, look for sentences with technical terms
  if (statements.length === 0) {
    const technicalTerms = [
      'sensors', 'imaging', 'spectral', 'thermal', 'multispectral', 'hyperspectral',
      'monitoring', 'detection', 'analysis', 'assessment', 'evaluation',
      'technology', 'methodology', 'technique', 'approach', 'system',
      'application', 'implementation', 'development', 'research', 'study'
    ]
    
    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase()
      
      for (const term of technicalTerms) {
        if (lowerSentence.includes(term)) {
          // Use the complete sentence as-is, just clean up whitespace
          const cleanStatement = sentence
            .replace(/\s+/g, ' ')
            .trim()
          
          if (cleanStatement.length > 30 && 
              cleanStatement.length < 400 && 
              !statements.includes(cleanStatement) &&
              cleanStatement.includes(' ') &&
              /[a-zA-Z]/.test(cleanStatement)) {
            statements.push(cleanStatement)
          }
          break
        }
      }
    }
  }
  
  // Sort statements by length (prefer medium-length, readable statements)
  statements.sort((a, b) => {
    const aLength = a.length
    const bLength = b.length
    // Prefer statements between 50-200 characters
    const aScore = Math.abs(aLength - 125)
    const bScore = Math.abs(bLength - 125)
    return aScore - bScore
  })
  
  return statements.slice(0, 6) // Limit to 6 statements for better quality
}

// Find related papers from extracted statements
async function findRelatedPapersFromStatements(statements: string[]): Promise<Citation[]> {
  const citations: Citation[] = []
  let idCounter = 1
  
  for (const statement of statements) {
    try {
      // Extract key terms from the statement for better search
      const keyTerms = extractKeyTermsFromStatement(statement)
      
      // Search across all databases for each statement
      const arxivResults = await searchArxiv(keyTerms)
      const openAlexResults = await searchOpenAlex(keyTerms)
      const crossRefResults = await searchCrossRef(keyTerms)
      const pubmedResults = await searchPubMed(keyTerms)
      
      // Combine and deduplicate results
      const allResults = [...arxivResults, ...openAlexResults, ...crossRefResults, ...pubmedResults]
      const uniqueResults = allResults.filter((result, index, self) => 
        index === self.findIndex(r => r.title === result.title)
      )
      
      // Convert to citations with high confidence for statement-based discovery
      for (const result of uniqueResults.slice(0, 2)) { // Top 2 results per statement
        const authors = result.authors.join(', ')
        const year = result.year
        
        citations.push({
          id: `discovered-${idCounter++}`,
          text: `${authors} (${year}). ${result.title}.`,
          authors,
          year,
          title: result.title,
          confidence: 0.90, // Higher confidence for statement-based discovery
          statement: statement // Add the original statement for context
        })
      }
    } catch (error) {
      console.error(`Error searching for statement "${statement}":`, error)
    }
  }
  
  return citations
}

// Extract key terms from a statement for better search
function extractKeyTermsFromStatement(statement: string): string {
  // Remove common words but preserve important context
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them']
  
  // Clean the statement but preserve more context
  const cleanedStatement = statement
    .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
  
  // Split into words and filter out stop words
  const words = cleanedStatement.toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.includes(word))
  
  // If we have enough meaningful words, use them all (up to 10)
  if (words.length > 0) {
    return words.slice(0, 10).join(' ')
  }
  
  // Fallback: return the original statement cleaned up
  return cleanedStatement.toLowerCase()
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

// Calculate similarity score between search query and paper content
function calculateSimilarityScore(searchQuery: string, paper: RelatedPaper): number {
  const query = searchQuery.toLowerCase();
  const title = paper.title.toLowerCase();
  const abstract = paper.abstract.toLowerCase();
  
  // Split into words for more detailed matching
  const queryWords = query.split(/\s+/).filter(word => word.length > 2);
  const titleWords = title.split(/\s+/).filter(word => word.length > 2);
  const abstractWords = abstract.split(/\s+/).filter(word => word.length > 2);
  
  let score = 0;
  let totalMatches = 0;
  
  // Check title matches (weighted higher)
  for (const word of queryWords) {
    if (titleWords.includes(word)) {
      score += 3; // Title matches are worth more
      totalMatches++;
    }
  }
  
  // Check abstract matches
  for (const word of queryWords) {
    if (abstractWords.includes(word)) {
      score += 1; // Abstract matches
      totalMatches++;
    }
  }
  
  // Calculate percentage match
  const maxPossibleScore = queryWords.length * 4; // 3 for title + 1 for abstract
  let percentage = maxPossibleScore > 0 ? (score / maxPossibleScore) * 100 : 0;
  
  // Bonus for exact phrase matches
  if (title.includes(query) || abstract.includes(query)) {
    percentage += 20;
  }
  
  // Cap at 100%
  return Math.min(percentage, 100);
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

      // Calculate similarity scores and add unique papers
      for (const paper of results) {
        if (!seenTitles.has(paper.title.toLowerCase()) && allPapers.length < 20) {
          seenTitles.add(paper.title.toLowerCase())
          
          // Calculate actual similarity score
          const similarityScore = calculateSimilarityScore(searchQuery, paper);
          paper.similarity = similarityScore;
          
          allPapers.push(paper)
        }
      }
    } catch (error) {
      console.error('Error searching for related papers:', error)
    }
  }

  // Sort by similarity score (highest first) and return top 15
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
    const statements = extractStatements(text)
    const discoveredCitations = await findRelatedPapersFromStatements(statements)
    
    // Combine both types of citations
    const allCitations = [...existingCitations, ...discoveredCitations]
    
    // Get related papers for all citations
    const relatedPapers = await searchRelatedPapers(allCitations)

    return NextResponse.json({
      citations: allCitations,
      relatedPapers,
      textLength: text.length,
      pages: Math.ceil(text.length / 2000),
      statementsFound: statements,
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