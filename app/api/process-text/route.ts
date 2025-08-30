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

  console.log('🔍 Normalized text preview:', normalized.substring(0, 300))
  
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
  console.log('🔍 First few candidates:', candidates.slice(0, 5))
  
  // Enhanced factual statement patterns - focus on claims that need academic support
  const factualPatterns = [
    // Quantitative claims (specific numbers/percentages)
    /\b(?:achieves|reaches|obtains|attains|achieves.*\d+%|achieves.*\d+\.\d+%|accuracy.*\d+%|precision.*\d+%|performance.*\d+%|improvement.*\d+%|reduction.*\d+%|increase.*\d+%)\b/gi,
    
    // Comparative claims (better than, outperforms, etc.)
    /\b(?:better than|more effective|superior to|outperforms|exceeds|surpasses|compared to|in contrast|versus|against|higher than|lower than|faster than|slower than|more accurate|less accurate)\b/gi,
    
    // Causal relationships (leads to, results in, causes, etc.)
    /\b(?:leads to|results in|causes|enables|facilitates|improves|enhances|reduces|increases|decreases|affects|influences|impacts|determines|predicts)\b/gi,
    
    // Research findings (studies show, evidence suggests, etc.)
    /\b(?:research shows|studies indicate|evidence suggests|data reveals|findings indicate|has been shown|has been found|results show|analysis demonstrates|investigation reveals|experiments show|empirical evidence|statistical analysis)\b/gi,
    
    // Methodological innovations (propose, develop, create, etc.)
    /\b(?:propose.*method|introduce.*approach|develop.*technique|create.*algorithm|design.*framework|implement.*system|establish.*protocol|formulate.*model)\b/gi,
    
    // Significant findings (statistical significance, correlations, etc.)
    /\b(?:significant|statistically significant|p-?value.*<|correlation.*=|correlation.*\d+\.\d+|improvement.*of|enhancement.*by|effect size|confidence interval)\b/gi,
    
    // Results and conclusions (conclude, demonstrate, etc.)
    /\b(?:conclude.*that|results.*demonstrate|findings.*suggest|analysis.*reveals|study.*finds|research.*confirms|data.*supports|evidence.*indicates)\b/gi,
    
    // Performance metrics (efficiency, accuracy, speed, etc.)
    /\b(?:efficiency.*\d+%|accuracy.*\d+%|speed.*\d+%|precision.*\d+%|recall.*\d+%|f1.*score|processing.*time|computational.*cost|memory.*usage|storage.*requirements)\b/gi
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
    for (const pattern of factualPatterns) {
      if (pattern.test(lowerSentence)) {
        patternMatched = true
        let cleanStatement = sentence
          .replace(/\s+/g, ' ')
          .trim()

        if (!/[.!?]$/.test(cleanStatement)) {
          cleanStatement += '.'
        }

        // Enhanced factual statement validation - only statements that need academic support
        if (
          cleanStatement.length > 30 && // Minimum length for meaningful claims
          cleanStatement.length < 400 && // Maximum length to avoid paragraphs
          !statements.includes(cleanStatement) &&
          cleanStatement.includes(' ') &&
          /[a-zA-Z]/.test(cleanStatement) &&
          cleanStatement.split(' ').length >= 6 && // Minimum words for complete thoughts
          // Filter out common non-factual content
          !/^(?:abstract|introduction|conclusion|references|bibliography|figure|table|appendix|methodology|materials|methods)/i.test(cleanStatement) &&
          !/^(?:the|this|these|those|a|an|in|on|at|to|for|of|with|by|we|our|this|that)/i.test(cleanStatement.trim()) &&
          // Must contain factual claim indicators
          (/\b(?:shows|indicates|suggests|reveals|demonstrates|finds|achieves|obtains|reaches|attains|better|more|superior|outperforms|significant|improvement|enhancement|propose|introduce|develop|create|design|conclude|results|findings|analysis|leads|causes|enables|facilitates|improves|reduces|increases|decreases|affects|influences|impacts|determines|predicts|correlation|efficiency|accuracy|precision|performance|speed|time|cost|usage|requirements)\b/i.test(cleanStatement)) &&
          // Must contain specific factual content (numbers, comparisons, or strong claims)
          (/\d+%|\d+\.\d+%|\d+\.\d+|\b(?:better|more|superior|outperforms|exceeds|surpasses|higher|lower|faster|slower|significant|improvement|enhancement|reduction|increase|decrease|correlation|efficiency|accuracy|precision|performance)\b/i.test(cleanStatement))
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
    
    for (const s of academicSentences.slice(0, 5)) {
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
        .slice(0, 10)
        
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
  const finalStatements = uniqueStatements // Process all statements

  console.log('🔍 Final statements:', finalStatements.length)
  console.log('🔍 Final statements:', finalStatements.map(s => s.substring(0, 80)))

  return finalStatements
}

// Find related papers from extracted statements
async function findRelatedPapersFromStatements(statements: string[]): Promise<Citation[]> {
  const citations: Citation[] = []
  let idCounter = 1
  
  // Process all statements
  const limitedStatements = statements
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
      
      // Take all results per statement
      for (const result of uniqueResults) {
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
  
  // Sort by confidence and return all results
  return citations
    .sort((a, b) => b.confidence - a.confidence)
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
      keyTerms.slice(0, 6).join(' '), // Top 6 terms without quotes
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
async function searchOpenAlex(query: string): Promise<RelatedPaper[]> {
  console.log('🔍 Searching OpenAlex for:', query.substring(0, 50))
  try {
    const response = await axios.get('https://api.openalex.org/works', {
      params: {
        search: query,
        per_page: 5,
        sort: 'relevance_score:desc'
      },
      timeout: 10000
    })

    const papers: RelatedPaper[] = []
    const results = response.data.results || []

    console.log('🔍 OpenAlex found:', results.length, 'papers')

    for (const work of results) {
      const authors = work.authorships ? work.authorships.map((a: any) => a.author?.display_name || 'Unknown Author') : ['Unknown Author']
      const year = work.publication_year ? work.publication_year.toString() : 'Unknown'

      // Reconstruct abstract if available, otherwise fallback text
      let abstract = 'No abstract available.'
      if (work.abstract_inverted_index) {
        const abstractWords = work.abstract_inverted_index
        abstract = Object.keys(abstractWords)
          .sort((a, b) => Math.min(...abstractWords[a]) - Math.min(...abstractWords[b]))
          .join(' ')
      }

      papers.push({
        id: `openalex-${work.id?.toString().split('/').pop() || Math.random().toString(36).slice(2, 9)}`,
        title: work.title || 'Untitled',
        authors,
        year,
        abstract,
        url: work.doi ? `https://doi.org/${work.doi}` : work.open_access?.oa_url || work.openalex_url || '#',
        similarity: 0
      })
    }

    console.log('🔍 OpenAlex papers processed:', papers.length)
    return papers
  } catch (error) {
    console.error('❌ OpenAlex search failed:', error instanceof Error ? error.message : String(error))
    return []
  }
}

// Search CrossRef API
async function searchCrossRef(query: string): Promise<RelatedPaper[]> {
  console.log('🔍 Searching CrossRef for:', query.substring(0, 50))
  try {
    const response = await axios.get('https://api.crossref.org/works', {
      params: {
        query: query,
        rows: 5,
        sort: 'relevance'
      },
      timeout: 10000,
      headers: {
        'User-Agent': 'CiteFinder/0.1'
      }
    })

    const papers: RelatedPaper[] = []
    const items = response.data.message?.items || []

    console.log('🔍 CrossRef found:', items.length, 'papers')

    for (const item of items) {
      if (item.title && item.title[0]) {
        const authors = item.author ? item.author.map((a: any) => `${a.given || ''} ${a.family || ''}`.trim()).filter((n: string) => n.length > 0) : ['Unknown Author']
        const year = item.published ? item.published['date-parts']?.[0]?.[0]?.toString() : 'Unknown'

        papers.push({
          id: `crossref-${item.DOI || Math.random().toString(36).slice(2, 9)}`,
          title: item.title[0],
          authors,
          year,
          abstract: item.abstract || 'No abstract available.',
          url: item.DOI ? `https://doi.org/${item.DOI}` : item.URL || '#',
          similarity: 0
        })
      }
    }

    console.log('🔍 CrossRef papers processed:', papers.length)
    return papers
  } catch (error) {
    console.error('❌ CrossRef search failed:', error instanceof Error ? error.message : String(error))
    return []
  }
}

// Search PubMed API
async function searchPubMed(query: string): Promise<RelatedPaper[]> {
  console.log('🔍 Searching PubMed for:', query.substring(0, 50))
  try {
    const response = await axios.get('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi', {
      params: {
        db: 'pubmed',
        term: query,
        retmode: 'json',
        retmax: 5,
        sort: 'relevance'
      },
      timeout: 10000
    })

    const papers: RelatedPaper[] = []
    const idList = response.data.esearchresult?.idlist || []

    console.log('🔍 PubMed found:', idList.length, 'papers')

    if (idList.length > 0) {
      const ids = idList.slice(0, 10).join(',')
      const detailResponse = await axios.get('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi', {
        params: {
          db: 'pubmed',
          id: ids,
          retmode: 'json'
        },
        timeout: 10000
      })

      const summaries = detailResponse.data.result

      for (const id of idList.slice(0, 10)) {
        const summary = summaries[id]
        if (summary && summary.title) {
          const authors = summary.authors ? summary.authors.map((a: any) => a.name) : ['Unknown Author']
          const year = summary.pubdate ? summary.pubdate.split(' ')[0] : 'Unknown'

          papers.push({
            id: `pubmed-${id}`,
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

    console.log('🔍 PubMed papers processed:', papers.length)
    return papers
  } catch (error) {
    console.error('❌ PubMed search failed:', error instanceof Error ? error.message : String(error))
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

// Calculate relevance score based on statement-paper matching
function calculateStatementRelevance(statement: string, paper: RelatedPaper): number {
  const statementTerms = extractKeyTermsFromStatement(statement).toLowerCase().split(' ');
  const paperTitleTerms = paper.title.toLowerCase().split(' ');
  const paperAbstractTerms = paper.abstract.toLowerCase().split(' ');

  let relevance = 0;
  let totalMatches = 0;

  // Check title matches
  for (const term of statementTerms) {
    if (paperTitleTerms.includes(term)) {
      relevance += 1;
      totalMatches++;
    }
  }

  // Check abstract matches
  for (const term of statementTerms) {
    if (paperAbstractTerms.includes(term)) {
      relevance += 0.5;
      totalMatches++;
    }
  }

  // Normalize relevance score
  const maxPossibleRelevance = statementTerms.length * 1.5; // Max 1 for title + 0.5 for abstract
  return maxPossibleRelevance > 0 ? (relevance / maxPossibleRelevance) * 100 : 0;
}

// Search for related papers using multiple academic APIs
async function searchRelatedPapers(citations: Citation[], statements: string[] = []): Promise<RelatedPaper[]> {
  const allPapers: RelatedPaper[] = []
  const seenTitles = new Set<string>()

  console.log('🔍 searchRelatedPapers called with citations:', citations.length)
  console.log('📝 Citations:', citations.map(c => ({ 
    title: c.title, 
    authors: c.authors, 
    text: c.text?.substring(0, 50), 
    statement: c.statement 
  })))

  // Skip re-searching discovered citations to avoid duplicate API calls; only enrich with existing citations
  const discoveredCitations: Citation[] = []
  const existingCitations = citations.filter(c => !c.statement)

  console.log('🔍 Discovered citations with statements:', 0)
  console.log('🔍 Existing citations without statements:', existingCitations.length)
  console.log('🔍 Statements to match papers against:', statements.length)

  // For existing citations, add a few more papers if we have room
  for (const citation of existingCitations.slice(0, 1)) {
    const searchQuery = citation.title || citation.authors || citation.text.substring(0, 100)
    if (!searchQuery || allPapers.length >= 6) continue // Cap at 6 total papers

    console.log('🔍 Searching for existing citation:', searchQuery.substring(0, 50))

    try {
      const [arxivResults, openAlexResults, crossrefResults, pubmedResults] = await Promise.allSettled([
        withTimeout(searchArxiv(searchQuery), 9000, [] as RelatedPaper[]),
        withTimeout(searchOpenAlex(searchQuery), 9000, [] as RelatedPaper[]),
        withTimeout(searchCrossRef(searchQuery), 9000, [] as RelatedPaper[]),
        withTimeout(searchPubMed(searchQuery), 9000, [] as RelatedPaper[])
      ])

      const results = [arxivResults, openAlexResults, crossrefResults, pubmedResults]
        .filter(result => result.status === 'fulfilled')
        .flatMap(result => (result as PromiseFulfilledResult<RelatedPaper[]>).value)

      for (const paper of results) {
        if (!seenTitles.has(paper.title.toLowerCase()) && allPapers.length < 6) {
          seenTitles.add(paper.title.toLowerCase())
          
          const similarityScore = calculateSimilarityScore(searchQuery, paper);
          paper.similarity = similarityScore;
          console.log('📊 Similarity score for', paper.title.substring(0, 50), ':', similarityScore + '%');
          
          console.log('📄 Existing citation paper:', paper.title.substring(0, 50))
          console.log('📊 Similarity score:', similarityScore)
          
          allPapers.push(paper)
        }
      }
    } catch (error) {
      console.error('❌ Error searching for existing citations:', error)
    }
  }

  console.log('📊 Final results:')
  console.log('  - Total papers found:', allPapers.length)
  console.log('  - Papers with similarity scores:', allPapers.map(p => ({ title: p.title.substring(0, 30), similarity: p.similarity })))

  // Sort by similarity score (highest first) and return up to 6 papers for free users
  const finalResults = allPapers
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 6)

  console.log('📊 Final sorted results:', finalResults.length)
  console.log('📊 Similarity range:', finalResults.length > 0 ? `${Math.min(...finalResults.map(p => p.similarity))}% - ${Math.max(...finalResults.map(p => p.similarity))}%` : 'No results')

  return finalResults
}

// Utility: enforce a timeout on any async operation
async function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise<T>((resolve) => {
    let settled = false
    const timer = setTimeout(() => {
      if (!settled) {
        resolve(fallback)
      }
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

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text content is required' },
        { status: 400 }
      )
    }

    console.log('📝 Processing text input, length:', text.length)
    console.log('📝 Text preview:', text.substring(0, 200))

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
      discoveredCitationsCount: discoveredCitations.length
    })

  } catch (error) {
    console.error('❌ Error in process-text:', error)
    return NextResponse.json(
      { error: 'Failed to process text' },
      { status: 500 }
    )
  }
} 