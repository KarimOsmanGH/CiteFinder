// Centralized type definitions for CiteFinder

export interface RelatedPaper {
  id: string
  title: string
  authors: string[]
  year: string
  abstract: string
  url?: string
  similarity: number
  statement?: string
  supportingQuote?: string
}

export interface Citation {
  id: string
  text: string
  authors?: string
  year?: string
  title?: string
  confidence: number
  statement?: string
  supportingQuote?: string
}

export interface StatementWithPosition {
  text: string
  startIndex: number
  endIndex: number
  confidence: number
  contextBefore?: string
  contextAfter?: string
  snippet?: string
}

export interface ProcessResponse {
  citations: Citation[]
  relatedPapers: RelatedPaper[]
  statementsWithPositions?: StatementWithPosition[]
  textLength: number
  pages: number
  pdfUrl?: string
  fileName?: string
  statementsFound?: string[]
  existingCitationsCount?: number
  discoveredCitationsCount?: number
}
