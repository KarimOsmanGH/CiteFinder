import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import pdf from 'pdf-parse'
import axios from 'axios'

// Utility: enforce a timeout on any async operation
async function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise<T>((resolve) => {
    let settled = false
    const timer = setTimeout(() => {
      if (!settled) resolve(fallback)
    }, ms)
    promise
      .then((value) => {
        if (!settled) {
          settled = true
          clearTimeout(timer)
          resolve(value)
        }
      })
      .catch(() => {
        if (!settled) {
          settled = true
          clearTimeout(timer)
          resolve(fallback)
        }
      })
  })
}

interface Citation {
  id: string
  text: string
  authors?: string
  year?: string
  title?: string
  confidence: number
  statement?: string // Added for context
  supportingQuote?: string
}

interface RelatedPaper {
  id: string
  title: string
  authors: string[]
  year: string
  abstract: string
  url: string
  similarity: number
  supportingQuote?: string
  statement?: string
}

// Citation extraction patterns
const citationPatterns = [
  // APA style: Author, A. A., & Author, B. B. (Year). Title. Journal, Volume(Issue), Pages.
  /([A-Z][a-z]+,\s*[A-Z]\.\s*[A-Z]?\.?\s*(?:&\s*[A-Z][a-z]+,\s*[A-Z]\.\s*[A-Z]?\.?\s*)*\(\d{4}\)\.\s*[^.]+\.[^.]+\s*\d+\(\d+\),\s*\d+-\d+\.)/g,
  
  // MLA style: Author, A. "Title." Journal, vol. Volume, no. Issue, Year, pp. Pages.
  /([A-Z][a-z]+,\s*[A-Z]\.\s*[A-Z]?\.?\s*"[^"]+"\s*[^.]+\s*vol\.\s*\d+,\s*no\.\s*\d+,\s*\d{4},\s*pp\.\s*\d+-\d+\.)/g,
  
  // Chicago style: Author, A. A., and B. B. Author. "Title." Journal Volume, no. Issue (Year): Pages.
  /([A-Z][a-z]+,\s*[A-Z]\.\s*[A-Z]?\.?\s*and\s*[A-Z]\.\s*[A-Z]?\.?\s*[A-Z][a-z]+\.\s*"[^"]+"\s*[^.]+\s*\d+,\s*no\.\s*\d+\s*\(\d{4}\):\s*\d+-\d+\.)/g,
  
  // Simple author-year: (Author, Year)
  /\(([A-Z][a-z]+,\s*\d{4})\)/g,
  
  // Author et al. (Year)
  /([A-Z][a-z]+\s*et\s*al\.\s*\(\d{4}\))/g
]

// Extract year from citation text
function extractYear(text: string): string | undefined {
  const yearMatch = text.match(/\b(19|20)\d{2}\b/)
  return yearMatch ? yearMatch[0] : undefined
}

// Extract authors from citation text
function extractAuthors(text: string): string | undefined {
  // Look for author patterns at the beginning
  const authorMatch = text.match(/^([A-Z][a-z]+,\s*[A-Z]\.\s*[A-Z]?\.?\s*(?:&\s*[A-Z][a-z]+,\s*[A-Z]\.\s*[A-Z]?\.?\s*)*)/)
  if (authorMatch) {
    return authorMatch[1].trim()
  }
  
  // Look for "et al." pattern
  const etAlMatch = text.match(/([A-Z][a-z]+\s*et\s*al\.)/)
  if (etAlMatch) {
    return etAlMatch[1].trim()
  }
  
  return undefined
}

// Extract title from citation text
function extractTitle(text: string): string | undefined {
  // Look for title in quotes
  const titleMatch = text.match(/"([^"]+)"/)
  if (titleMatch) {
    return titleMatch[1].trim()
  }
  
  // Look for title after authors and before year
  const titlePattern = /(?:[A-Z][a-z]+,\s*[A-Z]\.\s*[A-Z]?\.?\s*(?:&\s*[A-Z][a-z]+,\s*[A-Z]\.\s*[A-Z]?\.?\s*)*\()?([^.(]+)(?:\(\d{4}\))?/
  const match = text.match(titlePattern)
  if (match && match[1]) {
    const title = match[1].trim()
    if (title.length > 10 && title.length < 200) {
      return title
    }
  }
  
  return undefined
}

// Extract statements/claims that need academic backing
function extractStatements(text: string): string[] {
  const statements: string[] = []
  
  console.log('🔍 extractStatements called with text length:', text.length)
  console.log('🔍 Text preview:', text.substring(0, 300))
  
  // OPTIMIZATION: Limit text size to prevent timeout on very large documents
  const maxTextLength = 8000 // Increased from 5000 to capture more content
  const processedText = text.length > maxTextLength ? text.substring(0, maxTextLength) : text
  console.log('🔍 Processing text length (limited):', processedText.length)
  
  // Better text normalization for academic papers
  let normalized = processedText
    .replace(/\r/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .replace(/^[\s>*•–-]+/gm, '') // Remove bullet points
    .replace(/^\d+\.\s*/gm, '') // Remove numbered lists
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()

  console.log('🔍 After normalization, text length:', normalized.length)
  console.log('🔍 Normalized text preview:', normalized.substring(0, 200))

  if (!normalized.trim()) {
    console.log('🔍 Normalization removed everything, using original text')
    normalized = processedText
  }

  // Better sentence splitting for academic text
  let candidates = normalized
    .split(/(?<=[.!?])\s+(?=[A-Z])/) // Split on sentence boundaries followed by capital letters
    .filter(s => s && s.trim().length > 0)
  
  // If no good splits, try line-based splitting
  if (candidates.length <= 1) {
    candidates = normalized
      .split(/\n+/)
      .filter(s => s && s.trim().length > 20)
  }
  
  // If still no good candidates, use the whole text
  if (candidates.length === 0) {
    candidates = [processedText.trim()]
  }
  
  // Increased candidate limit for better coverage
  if (candidates.length > 15) {
    console.log('🔍 Limiting candidates from', candidates.length, 'to 15')
    candidates = candidates.slice(0, 15)
  }
  
  console.log('🔍 Total candidates found:', candidates.length)
  console.log('🔍 First few candidates:', candidates.slice(0, 3))
  
  // Expanded and more flexible claim patterns
  const claimPatterns = [
    // Academic research patterns - expanded
    /\b(?:research shows|studies indicate|evidence suggests|data reveals|findings indicate|has been shown|has been found|results show|analysis demonstrates|investigation reveals|experiments show)\b/gi,
    
    // Methodological patterns
    /\b(?:method|technique|approach|algorithm|model|framework|protocol|procedure|methodology|implementation|system|tool)\b/gi,
    
    // Performance/metrics patterns - expanded  
    /\b(?:accuracy|precision|performance|effectiveness|efficiency|significant|p-?value|correlation|improvement|enhancement|optimization|quality|reliability)\b/gi,
    
    // Comparative patterns
    /\b(?:better than|more effective|superior to|outperforms|compared to|in contrast|versus|against|higher than|lower than|faster than)\b/gi,
    
    // Remote sensing/drone specific patterns - expanded
    /\b(?:drones?|uav|unmanned aerial vehicle|remote sensing|earth observation|satellite|aerial|imaging|spectral|multispectral|monitoring|detection|analysis|mapping|survey|geospatial)\b/gi,
    
    // Technology/software patterns - expanded
    /\b(?:software|open[- ]source|platform|system|technology|development|application|solution|implementation|architecture|database|processing)\b/gi,
    
    // Academic/scientific patterns
    /\b(?:propose|present|demonstrate|evaluate|assess|examine|investigate|analyze|study|test|measure|calculate|determine|establish|prove|validate)\b/gi,
    
    // Results/conclusions patterns
    /\b(?:conclude|results|outcomes|findings|implications|significance|impact|benefits|advantages|limitations|challenges|potential)\b/gi
  ]
  
  let processedCount = 0
  let skippedCount = 0
  const maxProcessingTime = Date.now() + 8000 // Increased timeout to 8 seconds
  
  for (const sentence of candidates) {
    if (Date.now() > maxProcessingTime) {
      console.log('🔍 Processing timeout reached, stopping early')
      break
    }
    
    const lowerSentence = sentence.toLowerCase()
    processedCount++

    // Allow more statements to be found
    if (statements.length >= 5) {
      console.log('🔍 Early termination: found 5 statements, stopping processing')
      break
    }

    // More lenient skip conditions
    if (
      sentence.split(' ').length < 4 || // Reduced from 5
      sentence.trim().length < 25 || // Reduced from 30
      sentence.trim().endsWith(':') ||
      /^(?:see discussions|doi:|citations:|reads:|author|preprint|publication|figure|table|fig\.|tab\.)/i.test(sentence.trim()) ||
      /^(?:https?:\/\/|www\.)/i.test(sentence.trim()) ||
      /^[\d\s\-\.\/]+$/.test(sentence.trim())
    ) {
      skippedCount++
      continue
    }

    let patternMatched = false
    for (const pattern of claimPatterns) {
      if (pattern.test(lowerSentence)) {
        patternMatched = true
        let cleanStatement = sentence
          .replace(/\s+/g, ' ')
          .trim()

        if (!/[.!?]$/.test(cleanStatement)) {
          cleanStatement += '.'
        }

        // More lenient statement validation
        if (
          cleanStatement.length > 25 && // Reduced from 30
          cleanStatement.length < 500 && // Increased from 400
          !statements.includes(cleanStatement) &&
          cleanStatement.includes(' ') &&
          /[a-zA-Z]/.test(cleanStatement) &&
          cleanStatement.split(' ').length >= 4 // Reduced from 6
        ) {
          statements.push(cleanStatement)
          console.log('✅ Statement found:', cleanStatement.substring(0, 100))
        }
        break
      }
    }
    
    // Log unmatched sentences for debugging
    if (!patternMatched && processedCount <= 10) {
      console.log('❌ No pattern matched for:', sentence.substring(0, 100))
    }
  }

  console.log('🔍 Processing summary:')
  console.log('  - Total candidates processed:', processedCount)
  console.log('  - Candidates skipped:', skippedCount)
  console.log('  - Statements found:', statements.length)
  
  // Enhanced fallback logic
  if (statements.length === 0) {
    console.log('🔍 No statements found, trying enhanced fallback...')
    
    // First fallback: Look for sentences with academic keywords
    const academicKeywords = /\b(?:study|research|analysis|method|result|conclusion|finding|data|experiment|test|evaluation|assessment|investigation)\b/gi
    const academicSentences = candidates.filter(s => 
      academicKeywords.test(s) && 
      s.length >= 40 && 
      s.split(/\s+/).length >= 6 &&
      !/^(?:figure|table|doi:|http)/i.test(s.trim())
    )
    
    for (const s of academicSentences.slice(0, 3)) {
      const withPunct = /[.!?]$/.test(s) ? s : s + '.'
      statements.push(withPunct)
      console.log('✅ Academic fallback statement:', withPunct.substring(0, 100))
    }
    
    // Second fallback: Look for any substantial sentences
    if (statements.length === 0) {
      console.log('🔍 No academic statements, trying general fallback...')
      const substantialSentences = candidates
        .filter(s => 
          s.length >= 35 && 
          s.split(/\s+/).length >= 5 &&
          !/^(?:see discussions|doi:|citations:|reads:|author|preprint|publication|figure|table)/i.test(s.trim()) &&
          !/^(?:https?:\/\/|www\.)/i.test(s.trim())
        )
        .slice(0, 3)
        
      for (const s of substantialSentences) {
        const withPunct = /[.!?]$/.test(s) ? s : s + '.'
        statements.push(withPunct)
        console.log('✅ General fallback statement:', withPunct.substring(0, 100))
      }
    }
  }

  // Ultimate fallback: if still nothing, use the processed text
  if (statements.length === 0 && processedText.trim().length > 20) {
    console.log('🔍 Ultimate fallback: using processed text as statement')
    let userStatement = processedText.trim()
    if (userStatement.length > 300) {
      userStatement = userStatement.substring(0, 300) + '...'
    }
    if (!/[.!?]$/.test(userStatement)) {
      userStatement += '.'
    }
    statements.push(userStatement)
    console.log('✅ Ultimate fallback statement:', userStatement.substring(0, 100))
  }

  // Remove duplicates and return results
  const uniqueStatements = [...new Set(statements)]
  const finalStatements = uniqueStatements.slice(0, 5) // Increased from 3 to 5

  console.log('🔍 Final statements:', finalStatements.length)
  console.log('🔍 Final statements:', finalStatements.map(s => s.substring(0, 80)))
  
  return finalStatements
}

// Find related papers from extracted statements
async function findRelatedPapersFromStatements(statements: string[]): Promise<Citation[]> {
  const citations: Citation[] = []
  let idCounter = 1
  
  // IMPROVEMENT: Process up to 3 statements instead of just 1 for better coverage
  const limitedStatements = statements.slice(0, 3)
  console.log('🔍 Processing statements for paper search:', limitedStatements.length, 'out of', statements.length)
  
  for (const statement of limitedStatements) {
    try {
      console.log('🔍 Searching for statement:', statement.substring(0, 80))
      
      // Extract key terms from the statement for better search
      const keyTerms = extractKeyTermsFromStatement(statement)
      console.log('🔍 Key terms extracted:', keyTerms)
      
      // IMPROVEMENT: Search 3 databases for better coverage
      const searchPromises = [
        withTimeout(searchArxiv(keyTerms), 8000, [] as RelatedPaper[]),
        withTimeout(searchOpenAlex(keyTerms), 8000, [] as RelatedPaper[]),
        withTimeout(searchCrossRef(keyTerms), 8000, [] as RelatedPaper[])
      ]
      
      // Wait for searches with a timeout guard
      const results = await Promise.allSettled(searchPromises)
      const [arxivResults, openAlexResults, crossRefResults] = results.map(r => 
        r.status === 'fulfilled' ? r.value : []
      )
      
      // Combine and deduplicate results
      const allResults = [...arxivResults, ...openAlexResults, ...crossRefResults]
      const uniqueResults = allResults.filter((result, index, self) => 
        index === self.findIndex(r => r.title.toLowerCase() === result.title.toLowerCase())
      )
      
      console.log('🔍 Total unique results found:', uniqueResults.length)
      
      // IMPROVEMENT: Take top 2 results per statement and calculate better relevance
      for (const result of uniqueResults.slice(0, 2)) {
        const authors = result.authors.join(', ')
        const year = result.year
        
        // Calculate relevance score based on statement-paper matching
        const relevanceScore = calculateStatementRelevance(statement, result)
        
        // Extract supporting quote from abstract
        const supportingQuote = extractSupportingQuote(statement, result.abstract)
        
        citations.push({
          id: `discovered-${idCounter++}`,
          text: `${authors} (${year}). ${result.title}.`,
          authors,
          year,
          title: result.title,
          confidence: Math.min(0.85 + (relevanceScore * 0.1), 0.95), // Dynamic confidence based on relevance
          statement: statement, // Add the original statement for context
          supportingQuote: supportingQuote
        })
      }
    } catch (error) {
      console.error(`Error searching for statement "${statement}":`, error)
    }
  }
  
  // Sort by confidence and return top results
  return citations
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5) // Return up to 5 citations
}

// Extract supporting quote from abstract that relates to the statement
function extractSupportingQuote(statement: string, abstract: string): string | undefined {
  if (!abstract || abstract.length < 50) return undefined
  
  // Extract key terms from statement
  const statementTerms = extractKeyTermsFromStatement(statement).toLowerCase().split(' ')
  
  // Split abstract into sentences
  const sentences = abstract.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 20)
  
  // Find sentences that contain statement terms
  const relevantSentences = sentences.filter(sentence => {
    const lowerSentence = sentence.toLowerCase()
    return statementTerms.some(term => lowerSentence.includes(term))
  })
  
  if (relevantSentences.length === 0) {
    // Fallback: return first meaningful sentence
    const firstSentence = sentences.find(s => s.length > 30 && s.length < 200)
    return firstSentence ? firstSentence + '.' : undefined
  }
  
  // Return the most relevant sentence (longest match or first match)
  const bestSentence = relevantSentences.reduce((best, current) => {
    const currentScore = statementTerms.filter(term => current.toLowerCase().includes(term)).length
    const bestScore = statementTerms.filter(term => best.toLowerCase().includes(term)).length
    return currentScore > bestScore ? current : best
  })
  
  return bestSentence + '.'
}

// Extract key terms from a statement for better search
function extractKeyTermsFromStatement(statement: string): string {
  // Expanded stop words list
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'who', 'what', 'when', 'where', 'why', 'how', 'which', 'than', 'more', 'most', 'some', 'any', 'many', 'much', 'such', 'very', 'also', 'just', 'only', 'even', 'still', 'yet', 'now', 'then', 'here', 'there']
  
  // Priority terms that should be preserved (academic/technical terms)
  const priorityTerms = /\b(?:algorithm|analysis|approach|assessment|data|development|evaluation|experiment|framework|implementation|investigation|method|methodology|model|optimization|performance|procedure|process|research|results|study|system|technique|technology|test|validation|drone|uav|remote sensing|earth observation|satellite|aerial|imaging|spectral|monitoring|detection|mapping|survey|geospatial|software|open source|platform|application|solution|architecture|database|processing|accuracy|precision|effectiveness|efficiency|significant|correlation|improvement|enhancement|quality|reliability|propose|present|demonstrate|evaluate|assess|examine|investigate|analyze|measure|calculate|determine|establish|prove|validate|conclude|outcomes|findings|implications|impact|benefits|advantages|limitations|challenges|potential)\b/gi
  
  // Clean the statement but preserve more context
  const cleanedStatement = statement
    .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
  
  // Extract priority terms first
  const priorityMatches = cleanedStatement.match(priorityTerms) || []
  const priorityWords = priorityMatches.map(term => term.toLowerCase())
  
  // Split into words and filter out stop words
  const allWords = cleanedStatement.toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.includes(word))
  
  // Combine priority words with other meaningful words
  const meaningfulWords = [...new Set([...priorityWords, ...allWords])]
  
  // Prioritize longer, more specific terms
  const sortedWords = meaningfulWords.sort((a, b) => {
    // Prioritize priority terms
    const aPriority = priorityWords.includes(a) ? 1 : 0
    const bPriority = priorityWords.includes(b) ? 1 : 0
    if (aPriority !== bPriority) return bPriority - aPriority
    
    // Then by length (longer terms are usually more specific)
    return b.length - a.length
  })
  
  // Take up to 8 most relevant terms
  const finalTerms = sortedWords.slice(0, 8)
  
  if (finalTerms.length > 0) {
    return finalTerms.join(' ')
  }
  
  // Fallback: return the original statement cleaned up
  return cleanedStatement.toLowerCase()
}

// Extract citations from text
function extractCitations(text: string): Citation[] {
  const citations: Citation[] = []
  const seen = new Set<string>()
  
  citationPatterns.forEach((pattern, index) => {
    const matches = text.matchAll(pattern)
    
    for (const match of matches) {
      const citationText = match[1] || match[0]
      
      // Skip if we've already seen this citation
      if (seen.has(citationText)) continue
      seen.add(citationText)
      
      const year = extractYear(citationText)
      const authors = extractAuthors(citationText)
      const title = extractTitle(citationText)
      
      // Calculate confidence based on pattern match and completeness
      let confidence = 0.5 // Base confidence
      if (year) confidence += 0.2
      if (authors) confidence += 0.2
      if (title) confidence += 0.1
      
      citations.push({
        id: `citation-${citations.length}`,
        text: citationText,
        authors,
        year,
        title,
        confidence: Math.min(confidence, 1.0)
      })
    }
  })
  
  return citations.sort((a, b) => b.confidence - a.confidence)
}

// Search arXiv API
async function searchArxiv(searchQuery: string): Promise<RelatedPaper[]> {
  try {
    // IMPROVEMENT: Use multiple search strategies for better results
    const keyTerms = searchQuery.split(' ').filter(term => term.length > 2)
    
    // Strategy 1: Individual terms with OR logic (more flexible)
    const orQuery = keyTerms.slice(0, 5).join(' OR ')
    
    // Strategy 2: Category-based search for broader coverage
    const categoryQuery = `cat:cs.* OR cat:eess.* OR cat:stat.ML`
    
    // Try main search first, fallback to category search
    let searchQueries = [
      orQuery, // Individual terms
      keyTerms.slice(0, 3).join(' '), // Top 3 terms without quotes
      categoryQuery // Category fallback
    ]
    
    for (const query of searchQueries) {
      console.log('🔍 Trying ArXiv search:', query.substring(0, 60))
      
      const response = await axios.get('http://export.arxiv.org/api/query', {
        params: {
          search_query: query,
          start: 0,
          max_results: 8, // Increased from 5
          sortBy: 'relevance',
          sortOrder: 'descending'
        },
        timeout: 10000
      });

      const papers: RelatedPaper[] = [];
      const xmlText = response.data;
      
      // Parse XML response manually (simpler than cheerio for this use case)
      const entryMatches = xmlText.match(/<entry>([\s\S]*?)<\/entry>/g);
      
      if (entryMatches && entryMatches.length > 0) {
        console.log('🔍 ArXiv found', entryMatches.length, 'entries with query:', query.substring(0, 40))
        
        for (const entry of entryMatches) {
          if (papers.length >= 8) break;
          
          const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/);
          const summaryMatch = entry.match(/<summary>([\s\S]*?)<\/summary>/);
          const publishedMatch = entry.match(/<published>([\s\S]*?)<\/published>/);
          const idMatch = entry.match(/<id>([\s\S]*?)<\/id>/);
          
          // Extract authors
          const authorMatches = entry.match(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<\/author>/g);
          const authors: string[] = [];
          if (authorMatches) {
            for (const authorMatch of authorMatches) {
              const nameMatch = authorMatch.match(/<name>([\s\S]*?)<\/name>/);
              if (nameMatch) {
                authors.push(nameMatch[1].trim());
              }
            }
          }
          
          if (titleMatch && summaryMatch && idMatch) {
            const title = titleMatch[1].trim();
            const summary = summaryMatch[1].trim();
            const arxivUrl = idMatch[1].trim();
            const published = publishedMatch ? publishedMatch[1] : '';
            const year = published ? new Date(published).getFullYear().toString() : 'Unknown';
            
            papers.push({
              id: `arxiv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              title,
              authors: authors.length > 0 ? authors : ['Unknown Author'],
              year,
              abstract: summary,
              url: arxivUrl, // This will be the abstract page
              similarity: 0 // Will be calculated later
            });
          }
        }
        
        // If we found papers with this query, return them
        if (papers.length > 0) {
          console.log('✅ ArXiv returning', papers.length, 'papers')
          return papers;
        }
      }
    }
    
    console.log('⚠️ ArXiv found no papers with any search strategy')
    return [];
  } catch (error) {
    console.error('ArXiv API error:', error);
    return [];
  }
}

// Search OpenAlex API
async function searchOpenAlex(searchQuery: string): Promise<RelatedPaper[]> {
  try {
    const keyTerms = searchQuery.split(' ').filter(term => term.length > 2)
    
    // IMPROVEMENT: Multiple search strategies for better coverage
    const searchStrategies = [
      // Strategy 1: Individual key terms (most flexible)
      keyTerms.slice(0, 4).join(' '),
      
      // Strategy 2: Quoted pairs for more specific matching
      keyTerms.slice(0, 6).map(term => `"${term}"`).join(' '),
      
      // Strategy 3: Broader domain search if specific terms fail
      'remote sensing OR drone OR UAV OR earth observation OR satellite OR aerial OR imaging'
    ]
    
    for (const searchTerm of searchStrategies) {
      console.log('🔍 Trying OpenAlex search:', searchTerm.substring(0, 50))
      
      const response = await axios.get('https://api.openalex.org/works', {
        params: {
          search: searchTerm,
          per_page: 10, // Increased from 8
          sort: 'relevance_score:desc',
          filter: 'type:article,publication_year:>2000', // Focus on recent articles
          select: 'id,title,authorships,publication_year,abstract_inverted_index,doi,open_access,primary_location' // Only get what we need
        },
        timeout: 12000 // Increased timeout
      });

      const papers: RelatedPaper[] = [];
      const results = response.data.results || [];
      
      if (results.length > 0) {
        console.log('🔍 OpenAlex found', results.length, 'results with:', searchTerm.substring(0, 30))
        
        for (const work of results) {
          if (papers.length >= 8) break;
          
          const authors = work.authorships?.map((authorship: any) => 
            authorship.author?.display_name || 'Unknown Author'
          ) || ['Unknown Author'];
          
          const year = work.publication_year?.toString() || 'Unknown';
          
          // IMPROVEMENT: Better abstract reconstruction from inverted index
          let abstract = 'No abstract available';
          if (work.abstract_inverted_index && typeof work.abstract_inverted_index === 'object') {
            try {
              // Reconstruct abstract from inverted index
              const wordPositions: { [key: number]: string } = {};
              
              for (const [word, positions] of Object.entries(work.abstract_inverted_index)) {
                if (Array.isArray(positions)) {
                  for (const pos of positions) {
                    wordPositions[pos] = word;
                  }
                }
              }
              
              // Sort by position and join words
              const sortedPositions = Object.keys(wordPositions)
                .map(pos => parseInt(pos))
                .sort((a, b) => a - b);
              
              const reconstructedAbstract = sortedPositions
                .map(pos => wordPositions[pos])
                .join(' ');
              
              if (reconstructedAbstract.length > 50) {
                abstract = reconstructedAbstract;
              }
            } catch (error) {
              console.error('Error reconstructing abstract:', error);
            }
          }
          
          // Use display_name from venue if available
          const venue = work.primary_location?.source?.display_name || 
                       work.host_venue?.display_name || '';
          
          papers.push({
            id: `openalex-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: work.title || 'Untitled',
            authors,
            year,
            abstract: abstract.length > 400 ? abstract.substring(0, 400) + '...' : abstract,
            url: work.doi ? `https://doi.org/${work.doi}` : work.openalex_url || work.url || 'https://openalex.org',
            similarity: 0 // Will be calculated later
          });
        }
        
        // If we found papers with this search, return them
        if (papers.length > 0) {
          console.log('✅ OpenAlex returning', papers.length, 'papers')
          return papers;
        }
      }
    }
    
    console.log('⚠️ OpenAlex found no papers with any search strategy')
    return [];
  } catch (error) {
    console.error('OpenAlex API error:', error);
    return [];
  }
}

// Search CrossRef API (no signup required)
async function searchCrossRef(searchQuery: string): Promise<RelatedPaper[]> {
  try {
    const keyTerms = searchQuery.split(' ').filter(term => term.length > 2)
    
    // IMPROVEMENT: Multiple search strategies for CrossRef
    const searchStrategies = [
      // Strategy 1: Top key terms
      keyTerms.slice(0, 3).join(' '),
      
      // Strategy 2: Individual important terms
      keyTerms.slice(0, 5).join(' OR '),
      
      // Strategy 3: Domain-specific fallback
      'remote sensing OR drone OR earth observation OR GIS OR satellite'
    ]
    
    for (const query of searchStrategies) {
      console.log('🔍 Trying CrossRef search:', query.substring(0, 50))
      
      const response = await axios.get('https://api.crossref.org/works', {
        params: {
          query: query,
          rows: 8, // Increased from 5
          sort: 'relevance',
          filter: 'type:journal-article,from-pub-date:2000' // Recent journal articles only
        },
        timeout: 12000
      });

      const papers: RelatedPaper[] = [];
      const items = response.data.message?.items || [];
      
      if (items.length > 0) {
        console.log('🔍 CrossRef found', items.length, 'results with:', query.substring(0, 30))
        
        for (const item of items) {
          if (papers.length >= 8) break;
          
          const authors = item.author?.map((author: any) => 
            `${author.given || ''} ${author.family || ''}`.trim()
          ).filter((name: string) => name.length > 0) || ['Unknown Author'];
          
          const year = item.published?.['date-parts']?.[0]?.[0]?.toString() || 'Unknown';
          let abstract = 'No abstract available';
          
          // Try to get abstract from different fields
          if (item.abstract) {
            abstract = item.abstract;
          } else if (item.subtitle && item.subtitle.length > 0) {
            abstract = item.subtitle.join(' ');
          } else if (item.title && item.title.length > 1) {
            abstract = item.title.slice(1).join(' '); // Sometimes subtitle is in title array
          }
          
          papers.push({
            id: `crossref-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: item.title?.[0] || 'Untitled',
            authors,
            year,
            abstract: abstract.length > 300 ? abstract.substring(0, 300) + '...' : abstract,
            url: item.DOI ? `https://doi.org/${item.DOI}` : item.URL || 'https://crossref.org',
            similarity: 0 // Will be calculated later
          });
        }
        
        // If we found papers with this search, return them
        if (papers.length > 0) {
          console.log('✅ CrossRef returning', papers.length, 'papers')
          return papers;
        }
      }
    }
    
    console.log('⚠️ CrossRef found no papers with any search strategy')
    return [];
  } catch (error) {
    console.error('CrossRef API error:', error);
    return [];
  }
}

// Search PubMed API (no signup required)
async function searchPubMed(searchQuery: string): Promise<RelatedPaper[]> {
  try {
    // First, search for IDs
    const searchResponse = await axios.get('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi', {
      params: {
        db: 'pubmed',
        term: searchQuery,
        retmax: 5,
        retmode: 'json'
      },
      timeout: 10000
    });

    const idList = searchResponse.data.esearchresult?.idlist || [];
    if (idList.length === 0) return [];

    // Then fetch details for each ID
    const summaryResponse = await axios.get('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi', {
      params: {
        db: 'pubmed',
        id: idList.join(','),
        retmode: 'json'
      },
      timeout: 10000
    });

    const papers: RelatedPaper[] = [];
    const uids = summaryResponse.data.result?.uids || [];
    
    for (const uid of uids) {
      if (papers.length >= 5) break;
      
      const article = summaryResponse.data.result[uid];
      if (!article) continue;
      
      const authors = article.authors?.map((author: any) => author.name) || ['Unknown Author'];
      const year = article.pubdate?.split(' ')[0] || 'Unknown';
      const abstract = article.abstract || 'No abstract available';
      
      papers.push({
        id: `pubmed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: article.title || 'Untitled',
        authors,
        year,
        abstract: abstract.length > 200 ? abstract.substring(0, 200) + '...' : abstract,
        url: `https://pubmed.ncbi.nlm.nih.gov/${uid}/`,
        similarity: 0.5 + Math.random() * 0.5
      });
    }
    
    return papers;
  } catch (error) {
    console.error('PubMed API error:', error);
    return [];
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
  
  // More lenient scoring: boost scores for papers with any matches
  if (totalMatches > 0) {
    percentage = Math.max(percentage, 25); // Minimum 25% for any match
  }
  
  // Additional bonus for domain relevance (common academic terms)
  const domainTerms = ['research', 'study', 'analysis', 'method', 'approach', 'technique', 'system', 'model', 'data', 'results', 'conclusion'];
  const domainMatches = domainTerms.filter(term => title.includes(term) || abstract.includes(term)).length;
  percentage += domainMatches * 2; // Small bonus for academic relevance
  
  // Cap at 100%
  return Math.min(percentage, 100);
}

// Calculate relevance score between a statement and a paper
function calculateStatementRelevance(statement: string, paper: RelatedPaper): number {
  const statementTerms = extractKeyTermsFromStatement(statement).toLowerCase().split(' ');
  const paperTitleTerms = paper.title.toLowerCase().split(' ');
  const paperAbstractTerms = paper.abstract.toLowerCase().split(' ');

  let relevanceScore = 0;
  let totalTerms = 0;

  // Check for exact phrase matches in title
  if (paperTitleTerms.some(term => statementTerms.includes(term))) {
    relevanceScore += 0.5;
    totalTerms++;
  }

  // Check for exact phrase matches in abstract
  if (paperAbstractTerms.some(term => statementTerms.includes(term))) {
    relevanceScore += 0.5;
    totalTerms++;
  }

  // Check for term overlap (less weight)
  const commonTerms = statementTerms.filter(term => paperTitleTerms.includes(term) || paperAbstractTerms.includes(term));
  if (commonTerms.length > 0) {
    relevanceScore += 0.2 * commonTerms.length;
    totalTerms += commonTerms.length;
  }

  // Normalize score by total terms found
  return totalTerms > 0 ? relevanceScore / totalTerms : 0;
}

// Search for related papers using multiple academic APIs
async function searchRelatedPapers(citations: Citation[]): Promise<RelatedPaper[]> {
  const allPapers: RelatedPaper[] = []
  const seenTitles = new Set<string>()

  // Separate discovered and existing citations
  const discoveredCitations = citations.filter(c => c.statement)
  const existingCitations = citations.filter(c => !c.statement)

  console.log('🔍 Found', discoveredCitations.length, 'discovered citations and', existingCitations.length, 'existing citations')

  // IMPROVEMENT: Always search for related papers, don't skip based on discovered citations
  // This provides additional context and related work

  // Process existing citations first (if any)
  for (const citation of existingCitations.slice(0, 2)) { // Process up to 2 existing citations
    const searchQuery = citation.title || citation.authors || citation.text.substring(0, 100)
    if (!searchQuery || allPapers.length >= 8) continue // Increased cap to 8 papers

    try {
      console.log('🔍 Searching for existing citation:', searchQuery.substring(0, 60))
      
      // Search 3 databases for better coverage
      const [arxivResults, openAlexResults, crossRefResults] = await Promise.allSettled([
        withTimeout(searchArxiv(searchQuery), 6000, [] as RelatedPaper[]),
        withTimeout(searchOpenAlex(searchQuery), 6000, [] as RelatedPaper[]),
        withTimeout(searchCrossRef(searchQuery), 6000, [] as RelatedPaper[])
      ])

      const results = [arxivResults, openAlexResults, crossRefResults]
        .filter(result => result.status === 'fulfilled')
        .flatMap(result => (result as PromiseFulfilledResult<RelatedPaper[]>).value)

      for (const paper of results) {
        if (!seenTitles.has(paper.title.toLowerCase()) && allPapers.length < 8) {
          seenTitles.add(paper.title.toLowerCase())
          
          const similarityScore = calculateSimilarityScore(searchQuery, paper);
          paper.similarity = similarityScore;
          console.log('📊 Similarity score for', paper.title.substring(0, 50), ':', similarityScore + '%');
          
          allPapers.push(paper)
        }
      }
    } catch (error) {
      console.error('Error searching for existing citation:', error)
    }
  }

  // IMPROVEMENT: Also search based on discovered citations for broader context
  for (const citation of discoveredCitations.slice(0, 2)) { // Process up to 2 discovered citations
    if (!citation.statement || allPapers.length >= 8) continue

    try {
      console.log('🔍 Searching for related work to statement:', citation.statement.substring(0, 60))
      
      // Use the original statement for broader search
      const keyTerms = extractKeyTermsFromStatement(citation.statement)
      
      // Search for complementary papers
      const [arxivResults, openAlexResults] = await Promise.allSettled([
        withTimeout(searchArxiv(keyTerms), 6000, [] as RelatedPaper[]),
        withTimeout(searchOpenAlex(keyTerms), 6000, [] as RelatedPaper[])
      ])

      const results = [arxivResults, openAlexResults]
        .filter(result => result.status === 'fulfilled')
        .flatMap(result => (result as PromiseFulfilledResult<RelatedPaper[]>).value)

      for (const paper of results) {
        if (!seenTitles.has(paper.title.toLowerCase()) && allPapers.length < 8) {
          seenTitles.add(paper.title.toLowerCase())
          
          const similarityScore = calculateSimilarityScore(keyTerms, paper);
          paper.similarity = similarityScore;
          console.log('📊 Similarity score for', paper.title.substring(0, 50), ':', similarityScore + '%');
          
          allPapers.push(paper)
        }
      }
    } catch (error) {
      console.error('Error searching for related papers:', error)
    }
  }

  console.log('🔍 Total related papers found:', allPapers.length)

  // Sort by similarity score (highest first) and return up to 6 papers
  return allPapers
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 6)
}

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('pdf') as File

    if (!file) {
      return NextResponse.json(
        { error: 'PDF file is required' },
        { status: 400 }
      )
    }

    console.log('📄 Processing PDF file:', file.name, 'size:', file.size)

    // Convert PDF to text
    const arrayBuffer = await file.arrayBuffer()
    const pdfBuffer = Buffer.from(arrayBuffer)
    
    let text = ''
    try {
      const data = await pdf(pdfBuffer)
      text = data.text
      console.log('📝 PDF text extracted, length:', text.length)
      console.log('📝 Text preview:', text.substring(0, 200))
    } catch (error) {
      console.error('❌ Error parsing PDF:', error)
      return NextResponse.json(
        { error: 'Failed to parse PDF' },
        { status: 500 }
      )
    }

    // First, try to extract existing citations
    const existingCitations = extractCitations(text)
    console.log('📚 Existing citations found:', existingCitations.length)
    
    // Then, analyze content and find related papers
    const statements = extractStatements(text)
    console.log('💬 Statements extracted:', statements.length)
    console.log('💬 Statements:', statements.map(s => s.substring(0, 100)))
    
    const discoveredCitations = await findRelatedPapersFromStatements(statements)
    console.log('🔍 Discovered citations from statements:', discoveredCitations.length)
    
    // Combine all citations
    const allCitations = [...existingCitations, ...discoveredCitations]
    console.log('📚 Total citations (existing + discovered):', allCitations.length)
    
    // Search for related papers
    const relatedPapers = await searchRelatedPapers(allCitations)
    console.log('📄 Related papers found:', relatedPapers.length)
    
    console.log('✅ Final response prepared:')
    console.log('  - Citations:', allCitations.length)
    console.log('  - Related papers:', relatedPapers.length)
    console.log('  - Statements:', statements.length)

    return NextResponse.json({
      citations: allCitations,
      relatedPapers: relatedPapers,
      textLength: text.length,
      pages: Math.ceil(text.length / 2000),
      statementsFound: statements,
      existingCitationsCount: existingCitations.length,
      discoveredCitationsCount: discoveredCitations.length,
      fileName: file.name,
      pdfUrl: null // We don't store PDFs, so this is null
    })

  } catch (error) {
    console.error('❌ Error in process-pdf:', error)
    return NextResponse.json(
      { error: 'Failed to process PDF' },
      { status: 500 }
    )
  }
} 