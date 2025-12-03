import { NextRequest, NextResponse } from 'next/server'
import { Citation, RelatedPaper, StatementWithPosition } from '@/types'
import { parsePDF } from '@/lib/pdf-parser'
import { FILE_LIMITS } from '@/lib/constants'
import { extractCitations, extractStatements } from '@/lib/citation-processing'
import { findRelatedPapersFromStatements, searchRelatedPapers } from '@/lib/api-search'

export const runtime = 'nodejs'
export const maxDuration = 300

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

    // Validate file size
    if (file.size > FILE_LIMITS.MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File size too large. Please upload a PDF smaller than ${FILE_LIMITS.MAX_SIZE_MB}MB.` },
        { status: 400 }
      )
    }

    // Convert PDF to text
    const arrayBuffer = await file.arrayBuffer()
    const pdfBuffer = Buffer.from(arrayBuffer)
    
    let text = ''
    try {
      const data = await parsePDF(pdfBuffer)
      text = data.text
      
      if (!text || text.trim().length === 0) {
        return NextResponse.json(
          { error: 'PDF appears to be empty or unreadable. Please ensure the PDF contains text and is not password-protected.' },
          { status: 400 }
        )
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return NextResponse.json(
        { error: `Failed to parse PDF: ${errorMessage}. Please ensure the file is a valid PDF and try again.` },
        { status: 500 }
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
      discoveredCitationsCount: discoveredCitations.length,
      fileName: file.name,
      pdfUrl: ''
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to process PDF: ${errorMessage}. Please ensure the file is a valid PDF and try again.` },
      { status: 500 }
    )
  }
}
