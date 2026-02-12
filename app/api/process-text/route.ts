import { NextRequest, NextResponse } from 'next/server'
import { Citation, RelatedPaper, StatementWithPosition } from '@/types'
import { extractCitations, extractStatements } from '@/lib/citation-processing'
import { findRelatedPapersFromStatements, searchRelatedPapers } from '@/lib/api-search'

export const runtime = 'nodejs'
export const maxDuration = 300

const MAX_TEXT_INPUT_CHARS = 200_000

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text content is required' },
        { status: 400 }
      )
    }

    const trimmedText = text.trim()
    if (!trimmedText) {
      return NextResponse.json(
        { error: 'Text content is required' },
        { status: 400 }
      )
    }

    if (trimmedText.length > MAX_TEXT_INPUT_CHARS) {
      return NextResponse.json(
        { error: `Text is too long. Please provide ${MAX_TEXT_INPUT_CHARS.toLocaleString()} characters or less.` },
        { status: 413 }
      )
    }

    // Extract existing citations
    let existingCitations: Citation[] = []
    try {
      existingCitations = extractCitations(trimmedText)
    } catch (error) {
      existingCitations = []
    }
    
    // Extract statements
    let statements: StatementWithPosition[] = []
    try {
      statements = extractStatements(trimmedText)
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
      textLength: trimmedText.length,
      pages: Math.ceil(trimmedText.length / 2000),
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
