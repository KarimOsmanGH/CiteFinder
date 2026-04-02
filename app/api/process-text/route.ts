import { NextRequest, NextResponse } from 'next/server'
import { Citation, RelatedPaper, StatementWithPosition } from '@/types'
import { extractCitations, extractStatements } from '@/lib/citation-processing'
import { findRelatedPapersFromStatements, searchRelatedPapers } from '@/lib/api-search'

export const runtime = 'nodejs'
export const maxDuration = 300

const MAX_TEXT_INPUT_CHARS = 200_000
const MISSING_ABSTRACT_PATTERN = /no abstract available/i

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()
    const warnings: string[] = []

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
    } catch {
      existingCitations = []
      warnings.push('We could not extract inline citations from this text.')
    }
    
    // Extract statements
    let statements: StatementWithPosition[] = []
    try {
      statements = extractStatements(trimmedText)
    } catch {
      statements = []
      warnings.push('We could not extract candidate statements from this text.')
    }
    
    // Find related papers from statements
    let discoveredCitations: Citation[] = []
    try {
      discoveredCitations = await findRelatedPapersFromStatements(statements)
    } catch {
      discoveredCitations = []
      warnings.push('Statement-based source discovery was unavailable for this request.')
    }
    
    // Combine all citations
    const allCitations = [...existingCitations, ...discoveredCitations]
    
    // Search for related papers
    let relatedPapers: RelatedPaper[] = []
    try {
      relatedPapers = await searchRelatedPapers(allCitations, statements)
    } catch {
      relatedPapers = []
      warnings.push('Academic database search was unavailable for this request.')
    }
    
    const normalizedPapers = relatedPapers.map((paper) => ({
      ...paper,
      abstract: paper.abstract?.trim() ? paper.abstract : 'No abstract available.'
    }))

    if (normalizedPapers.some((paper) => MISSING_ABSTRACT_PATTERN.test(paper.abstract))) {
      warnings.push('Some sources do not provide abstracts, so those matches were ranked using titles and available metadata only.')
    }

    return NextResponse.json({
      citations: allCitations,
      relatedPapers: normalizedPapers,
      statementsWithPositions: statements,
      textLength: trimmedText.length,
      pages: Math.ceil(trimmedText.length / 2000),
      statementsFound: statements.map(s => s.text),
      existingCitationsCount: existingCitations.length,
      discoveredCitationsCount: discoveredCitations.length,
      warnings
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to process text: ${errorMessage}. Please check your input and try again.` },
      { status: 500 }
    )
  }
}
