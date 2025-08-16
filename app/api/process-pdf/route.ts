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
          const url = idMatch[1].trim();
          const published = publishedMatch ? publishedMatch[1] : '';
          const year = published ? new Date(published).getFullYear().toString() : 'Unknown';
          
          papers.push({
            id: `arxiv-${papers.length}`,
            title,
            authors: authors.length > 0 ? authors : ['Unknown Author'],
            year,
            abstract: summary,
            url,
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
        id: `openalex-${papers.length}`,
        title: work.title || 'Untitled',
        authors,
        year,
        abstract: abstract.length > 200 ? abstract.substring(0, 200) + '...' : abstract,
        url: work.doi ? `https://doi.org/${work.doi}` : work.openalex_url || '#',
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
        id: `crossref-${papers.length}`,
        title: item.title?.[0] || 'Untitled',
        authors,
        year,
        abstract: abstract.length > 200 ? abstract.substring(0, 200) + '...' : abstract,
        url: item.DOI ? `https://doi.org/${item.DOI}` : '#',
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
        id: `pubmed-${papers.length}`,
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

// Search for related papers using multiple academic APIs
async function searchRelatedPapers(citations: Citation[]): Promise<RelatedPaper[]> {
  const allPapers: RelatedPaper[] = [];
  const seenTitles = new Set<string>();
  
  for (const citation of citations.slice(0, 3)) { // Limit to top 3 citations for performance
    const searchQuery = citation.title || citation.authors || citation.text.substring(0, 100);
    if (!searchQuery) continue;
    
    try {
      // Search all APIs in parallel
      const [arxivResults, openAlexResults, crossrefResults, pubmedResults] = await Promise.allSettled([
        searchArxiv(searchQuery),
        searchOpenAlex(searchQuery),
        searchCrossRef(searchQuery),
        searchPubMed(searchQuery)
      ]);
      
      // Collect results from successful API calls
      const results = [
        ...(arxivResults.status === 'fulfilled' ? arxivResults.value : []),
        ...(openAlexResults.status === 'fulfilled' ? openAlexResults.value : []),
        ...(crossrefResults.status === 'fulfilled' ? crossrefResults.value : []),
        ...(pubmedResults.status === 'fulfilled' ? pubmedResults.value : [])
      ];
      
      // Add unique papers
      for (const paper of results) {
        const normalizedTitle = paper.title.toLowerCase().trim();
        if (!seenTitles.has(normalizedTitle) && allPapers.length < 15) {
          seenTitles.add(normalizedTitle);
          allPapers.push(paper);
        }
      }
      
      // Add delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error('Error searching for papers:', error);
    }
  }
  
  return allPapers.slice(0, 15); // Return top 15 results
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('pdf') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No PDF file provided' },
        { status: 400 }
      )
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are allowed' },
        { status: 400 }
      )
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      return NextResponse.json(
        { error: 'File size must be less than 50MB' },
        { status: 400 }
      )
    }
    
    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Store PDF in Vercel Blob storage
    const timestamp = Date.now()
    const fileName = `pdfs/${timestamp}-${file.name}`
    
    const { url: pdfUrl } = await put(fileName, buffer, {
      access: 'public',
      contentType: 'application/pdf'
    })
    
    // Parse PDF
    const pdfData = await pdf(buffer)
    const text = pdfData.text
    
    // Extract citations
    const citations = extractCitations(text)
    
    // Search for related papers
    const relatedPapers = await searchRelatedPapers(citations)
    
    return NextResponse.json({
      citations,
      relatedPapers,
      textLength: text.length,
      pages: pdfData.numpages,
      pdfUrl, // Return the stored PDF URL
      fileName: file.name
    })
    
  } catch (error) {
    console.error('Error processing PDF:', error)
    return NextResponse.json(
      { error: 'Failed to process PDF' },
      { status: 500 }
    )
  }
} 