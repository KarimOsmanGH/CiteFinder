import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import pdf from 'pdf-parse'
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
  
  // Normalize bullet points into sentence-like lines
  let normalized = text
    .replace(/\r/g, '\n')
    .replace(/\n{2,}/g, '\n')
    // Fix: put '-' at the end of the character class to avoid creating a range
    .replace(/^[\s>*•–-]+/gm, '')

  console.log('🔍 After normalization, text length:', normalized.length)
  console.log('🔍 Normalized text preview:', normalized.substring(0, 200))

  if (!normalized.trim()) {
    // Guard: if normalization removed everything, fall back to original text
    console.log('🔍 Normalization removed everything, using original text')
    normalized = text
  }

  // Split into candidate sentences
  let candidates = normalized.split(/(?<=[.!?])\s+|\n+/)
  if (!candidates || candidates.every(s => !s || !s.trim())) {
    // Guard: if splitting yielded only empties, fallback to using raw text as one candidate
    candidates = [text.trim()]
  }
  
  // Limit candidates to prevent timeout - only process first 50 candidates
  if (candidates.length > 50) {
    console.log('🔍 Limiting candidates from', candidates.length, 'to 50 to prevent timeout')
    candidates = candidates.slice(0, 50)
  }
  
  console.log('🔍 Total candidates found:', candidates.length)
  console.log('🔍 First few candidates:', candidates.slice(0, 3))
  
  const claimPatterns = [
    // Academic research patterns
    /\b(?:according to|previous studies|recent research|meta[- ]analysis)\b/gi,
    /\b(?:research shows|studies indicate|evidence suggests|data reveals|analysis demonstrates|results show|findings indicate|has been shown|has been found|we (?:found|observed)|was (?:found|observed))\b/gi,
    
    // Comparative/performance patterns
    /\b(?:better than|more effective|superior to|outperforms|improves|enhances|increases|reduces|decreases|significantly|substantially|dramatically|compared (?:to|with)|in contrast)\b/gi,
    
    // Technical method patterns
    /\b(?:method|technique|approach|algorithm|model|framework|protocol|procedure|strategy|process|dataset|sample|participants?)\b/gi,
    
    // Performance/metrics patterns
    /\b(?:accuracy|precision|recall|f1(?:-score)?|auc|performance|reliability|validity|robustness|scalability|effectiveness|quality|speed|cost)\b/gi,
    
    // Statistical patterns
    /\b(?:significant|p-?value|p\s*<\s*0\.?\d+|confidence interval|ci\s*[:=]|odds ratio|hazard ratio|r\s*=|r2|r\^2|correlation|mean|median|average|std(?:dev|\.?)|standard deviation|%|percent|\d+\s*(?:%|percent|participants|subjects|samples))\b/gi,
    
    // Association/causation patterns
    /\b(?:associated with|linked to|correlated with|leads to|results in|is caused by|is related to)\b/gi,
    
    // Remote sensing/drone specific patterns
    /\b(?:drones?|uav|unmanned aerial vehicle|remote sensing|earth observation|satellite|aerial|imaging|spectral|thermal|multispectral|hyperspectral|monitoring|detection|analysis|assessment|evaluation|application|implementation|development|study|trial|experiment)\b/gi,
    
    // Software/technology patterns
    /\b(?:software|open[- ]source|platform|system|tool|application|solution|technology|innovation|advancement|breakthrough|development)\b/gi,
    
    // Environmental/geographic patterns
    /\b(?:environmental|climate|agriculture|forestry|urban|rural|landscape|ecosystem|biodiversity|conservation|mapping|survey|inventory)\b/gi,
    
    // Data collection patterns
    /\b(?:data collection|field survey|ground truth|validation|calibration|measurement|observation|sampling|monitoring|tracking|surveillance)\b/gi
  ]
  
  let processedCount = 0
  let skippedCount = 0
  
  for (const sentence of candidates) {
    const lowerSentence = sentence.toLowerCase()
    processedCount++

    // Skip incomplete phrases and section headers
    if (
      // Skip if it's just a topic/section header
      /^[a-z\s]+:$/i.test(sentence) ||
      /^[a-z\s]+:$/i.test(sentence.trim()) ||
      // Skip if it's too short or incomplete
      sentence.split(' ').length < 5 ||
      // Skip if it ends with a colon (likely a header)
      sentence.trim().endsWith(':') ||
      // Skip if it's just a repeated word or phrase
      /^([a-z]+\s*:?\s*)+$/i.test(sentence) ||
      // Skip if it's just a list item without context
      /^[•\-\*]\s*[a-z\s]+$/i.test(sentence) ||
      // Skip if it's just a single word or very short phrase
      sentence.trim().length < 30 ||
      // Skip metadata sections
      /^(?:see discussions|doi:|citations:|reads:|author|preprint|publication)/i.test(sentence.trim()) ||
      /^(?:https?:\/\/|www\.)/i.test(sentence.trim()) ||
      /^(?:figure|table|fig\.|tab\.)/i.test(sentence.trim()) ||
      // Skip very short or incomplete sentences
      sentence.trim().length < 20 ||
      // Skip sentences that are mostly numbers or special characters
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

        if (
          cleanStatement.length > 30 &&
          cleanStatement.length < 400 &&
          !statements.includes(cleanStatement) &&
          cleanStatement.includes(' ') &&
          /[a-zA-Z]/.test(cleanStatement) &&
          // Additional quality checks
          cleanStatement.split(' ').length >= 6 && // At least 6 words
          !/^[a-z\s]+:$/i.test(cleanStatement) && // Not just a header
          !/^[•\-\*]\s*[a-z\s]+$/i.test(cleanStatement) // Not just a bullet point
        ) {
          statements.push(cleanStatement)
          console.log('✅ Statement found:', cleanStatement.substring(0, 100))
        }
        break
      }
    }
    
    if (!patternMatched && processedCount <= 5) {
      console.log('❌ No pattern matched for:', sentence.substring(0, 100))
    }
  }

  console.log('🔍 Processing summary:')
  console.log('  - Total candidates processed:', processedCount)
  console.log('  - Candidates skipped:', skippedCount)
  console.log('  - Statements found:', statements.length)
  
  // Fallback: include colon-led factual lines (definitions/claims) but only if they're substantial
  if (statements.length === 0) {
    console.log('🔍 No statements found, trying fallback with colon lines...')
    const colonLines = normalized.split(/\n+/)
      .map(l => l.trim())
      .filter(l => 
        /\w+\s*:\s*\w+/.test(l) && 
        l.length < 300 && 
        l.length > 50 && // Must be substantial
        l.split(' ').length >= 8 && // At least 8 words
        !/^[a-z\s]+:$/i.test(l) // Not just a header
      )
    console.log('🔍 Colon lines found:', colonLines.length)
    for (const l of colonLines.slice(0, 3)) {
      const s = l.endsWith('.') ? l : l + '.'
      if (!statements.includes(s)) {
        statements.push(s)
        console.log('✅ Fallback statement found (colon):', s.substring(0, 100))
      }
    }
  }

  // New generic fallback: if still nothing, accept reasonable sentences the user typed
  if (statements.length === 0) {
    console.log('🔍 No statements after colon fallback, trying generic sentence fallback...')
    const generic = candidates
      .map(s => s.trim())
      .filter(s => s.length >= 30 && s.split(/\s+/).length >= 6 && /[.!?]$/.test(s))
      .slice(0, 3)
    for (const s of generic) {
      const withPunct = /[.!?]$/.test(s) ? s : s + '.'
      if (!statements.includes(withPunct)) {
        statements.push(withPunct)
        console.log('✅ Fallback statement found (generic):', withPunct.substring(0, 100))
      }
    }
  }

  // Ultimate fallback: if user typed a single statement, just use it
  if (statements.length === 0 && text.trim().length > 10) {
    console.log('🔍 Ultimate fallback: using user input as statement')
    let userStatement = text.trim()
    if (!/[.!?]$/.test(userStatement)) {
      userStatement += '.'
    }
    statements.push(userStatement)
    console.log('✅ Ultimate fallback statement:', userStatement)
  }

  // Sort by closeness to ideal readable length and uniqueness
  statements.sort((a, b) => Math.abs(a.length - 125) - Math.abs(b.length - 125))

  // Remove duplicates preserving order
  const uniqueStatements = [...new Set(statements)]
  // Return up to 6 for better coverage
  const finalStatements = uniqueStatements.slice(0, 6)

  console.log('🔍 Final statements:', finalStatements.length)
  console.log('🔍 Final statements:', finalStatements.map(s => s.substring(0, 80)))
  
  return finalStatements
}

// Find related papers from extracted statements
async function findRelatedPapersFromStatements(statements: string[]): Promise<Citation[]> {
  const citations: Citation[] = []
  let idCounter = 1
  
  // Limit to first 3 statements to prevent timeout
  const limitedStatements = statements.slice(0, 3)
  console.log('🔍 Processing statements for paper search:', limitedStatements.length, 'out of', statements.length)
  
  for (const statement of limitedStatements) {
    try {
      console.log('🔍 Searching for statement:', statement.substring(0, 80))
      
      // Extract key terms from the statement for better search
      const keyTerms = extractKeyTermsFromStatement(statement)
      console.log('🔍 Key terms extracted:', keyTerms)
      
      // Search across all databases for each statement with timeout
      const searchPromises = [
        searchArxiv(keyTerms).catch(e => { console.log('❌ ArXiv search failed:', e.message); return [] }),
        searchOpenAlex(keyTerms).catch(e => { console.log('❌ OpenAlex search failed:', e.message); return [] }),
        searchCrossRef(keyTerms).catch(e => { console.log('❌ CrossRef search failed:', e.message); return [] }),
        searchPubMed(keyTerms).catch(e => { console.log('❌ PubMed search failed:', e.message); return [] })
      ]
      
      // Wait for all searches with a 10-second timeout
      const results = await Promise.allSettled(searchPromises)
      const [arxivResults, openAlexResults, crossRefResults, pubmedResults] = results.map(r => 
        r.status === 'fulfilled' ? r.value : []
      )
      
      // Combine and deduplicate results
      const allResults = [...arxivResults, ...openAlexResults, ...crossRefResults, ...pubmedResults]
      const uniqueResults = allResults.filter((result, index, self) => 
        index === self.findIndex(r => r.title === result.title)
      )
      
      console.log('🔍 Total unique results found:', uniqueResults.length)
      
      // Convert to citations with high confidence for statement-based discovery
      for (const result of uniqueResults.slice(0, 2)) { // Top 2 results per statement
        const authors = result.authors.join(', ')
        const year = result.year
        
        // Extract supporting quote from abstract
        const supportingQuote = extractSupportingQuote(statement, result.abstract)
        
        citations.push({
          id: `discovered-${idCounter++}`,
          text: `${authors} (${year}). ${result.title}.`,
          authors,
          year,
          title: result.title,
          confidence: 0.90, // Higher confidence for statement-based discovery
          statement: statement, // Add the original statement for context
          supportingQuote: supportingQuote
        })
      }
    } catch (error) {
      console.error(`Error searching for statement "${statement}":`, error)
    }
  }
  
  return citations
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
    const response = await axios.get('http://export.arxiv.org/api/query', {
      params: {
        search_query: `all:"${searchQuery}"`,
        start: 0,
        max_results: 5,
        sortBy: 'relevance',
        sortOrder: 'descending'
      },
      timeout: 10000
    });

    const papers: RelatedPaper[] = [];
    const xmlText = response.data;
    
    // Parse XML response manually (simpler than cheerio for this use case)
    const entryMatches = xmlText.match(/<entry>([\s\S]*?)<\/entry>/g);
    
    if (entryMatches) {
      for (const entry of entryMatches) {
        if (papers.length >= 5) break;
        
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
            similarity: 0.8 + Math.random() * 0.2
          });
        }
      }
    }
    
    return papers;
  } catch (error) {
    console.error('ArXiv API error:', error);
    return [];
  }
}

// Search OpenAlex API
async function searchOpenAlex(searchQuery: string): Promise<RelatedPaper[]> {
  try {
    const response = await axios.get('https://api.openalex.org/works', {
      params: {
        search: searchQuery,
        per_page: 5,
        sort: 'relevance_score:desc'
      },
      timeout: 10000
    });

    const papers: RelatedPaper[] = [];
    const results = response.data.results || [];
    
    for (const work of results) {
      if (papers.length >= 5) break;
      
      const authors = work.authorships?.map((authorship: any) => 
        authorship.author?.display_name || 'Unknown Author'
      ) || ['Unknown Author'];
      
      const year = work.publication_year?.toString() || 'Unknown';
      const abstract = work.abstract_inverted_index ? 
        Object.keys(work.abstract_inverted_index).join(' ') : 
        'No abstract available';
      
      papers.push({
        id: `openalex-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: work.title || 'Untitled',
        authors,
        year,
        abstract: abstract.length > 200 ? abstract.substring(0, 200) + '...' : abstract,
        url: work.doi ? `https://doi.org/${work.doi}` : work.openalex_url || work.url || 'https://openalex.org',
        similarity: 0.7 + Math.random() * 0.3
      });
    }
    
    return papers;
  } catch (error) {
    console.error('OpenAlex API error:', error);
    return [];
  }
}

// Search CrossRef API (no signup required)
async function searchCrossRef(searchQuery: string): Promise<RelatedPaper[]> {
  try {
    const response = await axios.get('https://api.crossref.org/works', {
      params: {
        query: searchQuery,
        rows: 5,
        sort: 'relevance'
      },
      timeout: 10000
    });

    const papers: RelatedPaper[] = [];
    const items = response.data.message?.items || [];
    
    for (const item of items) {
      if (papers.length >= 5) break;
      
      const authors = item.author?.map((author: any) => 
        `${author.given || ''} ${author.family || ''}`.trim()
      ).filter((name: string) => name.length > 0) || ['Unknown Author'];
      
      const year = item.published?.['date-parts']?.[0]?.[0]?.toString() || 'Unknown';
      const abstract = item.abstract || 'No abstract available';
      
      papers.push({
        id: `crossref-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: item.title?.[0] || 'Untitled',
        authors,
        year,
        abstract: abstract.length > 200 ? abstract.substring(0, 200) + '...' : abstract,
        url: item.DOI ? `https://doi.org/${item.DOI}` : item.URL || 'https://crossref.org',
        similarity: 0.6 + Math.random() * 0.4
      });
    }
    
    return papers;
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
  
  // Cap at 100%
  return Math.min(percentage, 100);
}

// Search for related papers using multiple academic APIs
async function searchRelatedPapers(citations: Citation[]): Promise<RelatedPaper[]> {
  const allPapers: RelatedPaper[] = []
  const seenTitles = new Set<string>()

  // Process discovered citations (which have statements) first
  const discoveredCitations = citations.filter(c => c.statement)
  const existingCitations = citations.filter(c => !c.statement)

  // For discovered citations, get up to 3 papers per statement
  for (const citation of discoveredCitations.slice(0, 3)) { // Limit to 3 statements
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

      // Calculate similarity scores and add unique papers (up to 3 per statement)
      let papersForThisStatement = 0
      for (const paper of results) {
        if (!seenTitles.has(paper.title.toLowerCase()) && papersForThisStatement < 3) {
          seenTitles.add(paper.title.toLowerCase())
          
          // Calculate actual similarity score
          const similarityScore = calculateSimilarityScore(searchQuery, paper);
          paper.similarity = similarityScore;
          
          // Extract supporting quote if this is a discovered citation with a statement
          if (citation.statement && citation.statement.length > 0) {
            paper.supportingQuote = extractSupportingQuote(citation.statement, paper.abstract)
            paper.statement = citation.statement // Associate paper with its statement
          }
          
          allPapers.push(paper)
          papersForThisStatement++
        }
      }
    } catch (error) {
      console.error('Error searching for related papers:', error)
    }
  }

  // For existing citations, add a few more papers if we have room
  for (const citation of existingCitations.slice(0, 2)) {
    const searchQuery = citation.title || citation.authors || citation.text.substring(0, 100)
    if (!searchQuery || allPapers.length >= 9) continue // Cap at 9 total papers

    try {
      const [arxivResults, openAlexResults, crossrefResults, pubmedResults] = await Promise.allSettled([
        searchArxiv(searchQuery),
        searchOpenAlex(searchQuery),
        searchCrossRef(searchQuery),
        searchPubMed(searchQuery)
      ])

      const results = [arxivResults, openAlexResults, crossrefResults, pubmedResults]
        .filter(result => result.status === 'fulfilled')
        .flatMap(result => (result as PromiseFulfilledResult<RelatedPaper[]>).value)

      for (const paper of results) {
        if (!seenTitles.has(paper.title.toLowerCase()) && allPapers.length < 9) {
          seenTitles.add(paper.title.toLowerCase())
          
          const similarityScore = calculateSimilarityScore(searchQuery, paper);
          paper.similarity = similarityScore;
          
          allPapers.push(paper)
        }
      }
    } catch (error) {
      console.error('Error searching for related papers:', error)
    }
  }

  // Sort by similarity score (highest first) and return up to 9 papers for free users
  return allPapers
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 9)
}

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