import { NextRequest, NextResponse } from 'next/server'
import { Citation, RelatedPaper, StatementWithPosition } from '@/types'
import { extractCitations, extractStatements } from '@/lib/citation-processing'
import { findRelatedPapersFromStatements, searchRelatedPapers } from '@/lib/api-search'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text content is required' },
        { status: 400 }
      )
    }

    // Extract existing citations
    let existingCitations: Citation[] = []
    try {
      existingCitations = extractCitations(text)
    } catch (error) {
      existingCitations = []
    }
    
    // Extract statements
    let statements: StatementWithPosition[] = []
    try {
      statements = extractStatements(text)
    } catch (error) {
      statements = []
    }
    
    // Find related papers from statements
    let discoveredCitations: Citation[] = []
    try {
      discoveredCitations = await findRelatedPapersFromStatements(statements)
    } catch (error) {
      discoveredCitations = []
    }
    
    // Combine all citations
    const allCitations = [...existingCitations, ...discoveredCitations]
    
    // Search for related papers
    let relatedPapers: RelatedPaper[] = []
    try {
      relatedPapers = await searchRelatedPapers(allCitations, statements)
    } catch (error) {
      relatedPapers = []
    }
    
    // Filter out papers with no abstract
    const papersWithAbstract = relatedPapers.filter(paper => 
      paper.abstract && 
      paper.abstract.trim().length > 0 && 
      !paper.abstract.toLowerCase().includes('no abstract available')
    )

    return NextResponse.json({
      citations: allCitations,
      relatedPapers: papersWithAbstract,
      statementsWithPositions: statements,
      textLength: text.length,
      pages: Math.ceil(text.length / 2000),
      statementsFound: statements.map(s => s.text),
      existingCitationsCount: existingCitations.length,
      discoveredCitationsCount: discoveredCitations.length
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to process text: ${errorMessage}. Please check your input and try again.` },
      { status: 500 }
    )
  }
}
