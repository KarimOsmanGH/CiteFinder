// Citation extraction and statement processing logic

import { Citation, StatementWithPosition } from '@/types'
import { 
  MAX_TEXT_LENGTH, 
  MAX_STATEMENT_CANDIDATES, 
  CONTEXT_RADIUS,
  MIN_STATEMENT_LENGTH,
  MAX_STATEMENT_LENGTH,
  MIN_WORD_COUNT,
  CONFIDENCE
} from './constants'
import { normalizeText, extractYear, extractAuthors, extractTitle } from './utils'

interface CandidateSegment {
  rawText: string
  normalizedText: string
  startIndex: number
  endIndex: number
}

// Citation extraction patterns
const CITATION_PATTERNS = [
  // APA style
  /([A-Z][a-z]+,\s*[A-Z]\.\s*[A-Z]?\.?\s*(?:&\s*[A-Z][a-z]+,\s*[A-Z]\.\s*[A-Z]?\.?\s*)*\(\d{4}\)\.\s*[^.]+\.[^.]+\s*\d+\(\d+\),\s*\d+-\d+\.)/g,
  // MLA style
  /([A-Z][a-z]+,\s*[A-Z]\.\s*[A-Z]?\.?\s*"[^"]+"\s*[^.]+\s*vol\.\s*\d+,\s*no\.\s*\d+,\s*\d{4},\s*pp\.\s*\d+-\d+\.)/g,
  // Chicago style
  /([A-Z][a-z]+,\s*[A-Z]\.\s*[A-Z]?\.?\s*and\s*[A-Z]\.\s*[A-Z]?\.?\s*[A-Z][a-z]+\.\s*"[^"]+"\s*[^.]+\s*\d+,\s*no\.\s*\d+\s*\(\d{4}\):\s*\d+-\d+\.)/g,
  // Simple author-year: (Author, Year)
  /\(([A-Z][a-z]+(?:\s+et\s+al\.)?,\s*\d{4})\)/g,
  // Author et al. (Year)
  /([A-Z][a-z]+\s+et\s+al\.\s*\(\d{4}\))/g,
  // Basic author-year format
  /([A-Z][a-z]+\s+\(\d{4}\))/g
]

// Factual statement patterns
const FACTUAL_PATTERNS = [
  // Quantitative claims
  /\b(?:achieves|reaches|obtains|attains|achieves.*\d+%|achieves.*\d+\.\d+%|accuracy.*\d+%|precision.*\d+%|performance.*\d+%|improvement.*\d+%|reduction.*\d+%|increase.*\d+%)\b/i,
  // Comparative claims
  /\b(?:better than|more effective|superior to|outperforms|exceeds|surpasses|compared to|in contrast|versus|against|higher than|lower than|faster than|slower than|more accurate|less accurate)\b/i,
  // Causal relationships
  /\b(?:leads to|results in|causes|enables|facilitates|improves|enhances|reduces|increases|decreases|affects|influences|impacts|determines|predicts)\b/i,
  // Research findings
  /\b(?:research shows|studies indicate|evidence suggests|data reveals|findings indicate|has been shown|has been found|results show|analysis demonstrates|investigation reveals|experiments show|empirical evidence|statistical analysis)\b/i,
  // Methodological innovations
  /\b(?:propose.*method|introduce.*approach|develop.*technique|create.*algorithm|design.*framework|implement.*system|establish.*protocol|formulate.*model)\b/i,
  // Significant findings
  /\b(?:significant|statistically significant|p-?value.*<|correlation.*=|correlation.*\d+\.\d+|improvement.*of|enhancement.*by|effect size|confidence interval)\b/i,
  // Results and conclusions
  /\b(?:conclude.*that|results.*demonstrate|findings.*suggest|analysis.*reveals|study.*finds|research.*confirms|data.*supports|evidence.*indicates)\b/i,
  // Performance metrics
  /\b(?:efficiency.*\d+%|accuracy.*\d+%|speed.*\d+%|precision.*\d+%|recall.*\d+%|f1.*score|processing.*time|computational.*cost|memory.*usage|storage.*requirements)\b/i
]

// Factual indicator pattern for validation
const FACTUAL_INDICATOR_PATTERN = /\b(?:shows|indicates|suggests|reveals|demonstrates|finds|achieves|obtains|reaches|attains|better|more|superior|outperforms|significant|improvement|enhancement|propose|introduce|develop|create|design|conclude|results|findings|analysis|leads|causes|enables|facilitates|improves|reduces|increases|decreases|affects|influences|impacts|determines|predicts|correlation|efficiency|accuracy|precision|performance|speed|time|cost|usage|requirements|is|are|was|were|has|have|had|can|could|will|would|should|may|might)\b/i

/**
 * Extract citations from text
 */
export function extractCitations(text: string): Citation[] {
  const citations: Citation[] = []
  const seen = new Set<string>()
  let idCounter = 1

  for (const pattern of CITATION_PATTERNS) {
    const matches = text.matchAll(pattern)
    
    for (const match of matches) {
      const citationText = match[1] || match[0]
      
      if (!seen.has(citationText)) {
        seen.add(citationText)
        
        const year = extractYear(citationText)
        const authors = extractAuthors(citationText)
        const title = extractTitle(citationText)
        
        // Calculate confidence based on completeness
        let confidence = CONFIDENCE.BASE
        if (year) confidence += CONFIDENCE.WITH_YEAR
        if (authors) confidence += CONFIDENCE.WITH_AUTHORS
        if (title) confidence += CONFIDENCE.WITH_TITLE

        citations.push({
          id: `citation-${idCounter++}`,
          text: citationText,
          authors,
          year,
          title,
          confidence: Math.min(confidence, 1.0)
        })
      }
    }
  }

  return citations.sort((a, b) => b.confidence - a.confidence)
}

/**
 * Extract statements/claims that need academic backing
 */
export function extractStatements(text: string): StatementWithPosition[] {
  const statements: StatementWithPosition[] = []
  
  // Limit text size to prevent timeout
  const processedText = text.length > MAX_TEXT_LENGTH 
    ? text.substring(0, MAX_TEXT_LENGTH) 
    : text
  
  const buildSegments = (source: string, separator: RegExp, minLength = 1): CandidateSegment[] => {
    const flags = separator.flags.includes('g') ? separator.flags : `${separator.flags}g`
    const matcher = new RegExp(separator.source, flags)
    const segments: CandidateSegment[] = []
    let lastIndex = 0
    let match: RegExpExecArray | null

    const pushSegment = (start: number, end: number) => {
      let segmentStart = start
      let segmentEnd = end

      while (segmentStart < segmentEnd && /\s/.test(source[segmentStart])) {
        segmentStart++
      }

      while (segmentEnd > segmentStart && /\s/.test(source[segmentEnd - 1])) {
        segmentEnd--
      }

      if (segmentEnd <= segmentStart) {
        return
      }

      const rawText = source.slice(segmentStart, segmentEnd)
      if (rawText.length < minLength) {
        return
      }

      const normalizedText = normalizeText(rawText) || rawText.trim()
      if (!normalizedText) {
        return
      }

      segments.push({
        rawText,
        normalizedText,
        startIndex: segmentStart,
        endIndex: segmentEnd
      })
    }

    while ((match = matcher.exec(source)) !== null) {
      pushSegment(lastIndex, match.index)
      lastIndex = match.index + match[0].length
    }

    pushSegment(lastIndex, source.length)

    return segments
  }

  // Split into sentence candidates while preserving original positions.
  let candidates = buildSegments(processedText, /(?<=[.!?])\s+(?=[A-Z])/)
  
  if (candidates.length <= 1) {
    candidates = buildSegments(processedText, /\n+/, 20)
  }
  
  if (candidates.length === 0) {
    const fallbackText = processedText.trim()
    if (fallbackText) {
      const startIndex = processedText.indexOf(fallbackText)
      candidates = [{
        rawText: fallbackText,
        normalizedText: normalizeText(fallbackText) || fallbackText,
        startIndex: startIndex >= 0 ? startIndex : 0,
        endIndex: (startIndex >= 0 ? startIndex : 0) + fallbackText.length
      }]
    }
  }
  
  // Sample if too many candidates
  if (candidates.length > MAX_STATEMENT_CANDIDATES) {
    const step = Math.ceil(candidates.length / MAX_STATEMENT_CANDIDATES)
    const sampled: CandidateSegment[] = []
    for (let i = 0; i < candidates.length && sampled.length < MAX_STATEMENT_CANDIDATES; i += step) {
      sampled.push(candidates[i])
    }
    candidates = sampled
  }
  
  for (const candidate of candidates) {
    const sentence = candidate.normalizedText

    // Skip invalid sentences
    if (
      sentence.split(' ').length < MIN_WORD_COUNT ||
      sentence.trim().length < 25 ||
      sentence.trim().endsWith(':') ||
      /^(?:see discussions|doi:|citations:|reads:|author|preprint|publication|figure|table|fig\.|tab\.)/i.test(sentence.trim()) ||
      /^(?:https?:\/\/|www\.)/i.test(sentence.trim()) ||
      /^[\d\s\-\.\/]+$/.test(sentence.trim())
    ) {
      continue
    }

    const lowerSentence = sentence.toLowerCase()
    
    for (const pattern of FACTUAL_PATTERNS) {
      if (pattern.test(lowerSentence)) {
        let cleanStatement = sentence.replace(/\s+/g, ' ').trim()

        if (!/[.!?]$/.test(cleanStatement)) {
          cleanStatement += '.'
        }

        if (
          cleanStatement.length > MIN_STATEMENT_LENGTH &&
          cleanStatement.length < MAX_STATEMENT_LENGTH &&
          !statements.some(s => s.text === cleanStatement) &&
          cleanStatement.includes(' ') &&
          /[a-zA-Z]/.test(cleanStatement) &&
          cleanStatement.split(' ').length >= MIN_WORD_COUNT &&
          !/^(?:abstract|introduction|conclusion|references|bibliography|figure|table|appendix|methodology|materials|methods)/i.test(cleanStatement) &&
          FACTUAL_INDICATOR_PATTERN.test(cleanStatement)
        ) {
          statements.push({
            text: cleanStatement,
            startIndex: candidate.startIndex,
            endIndex: candidate.endIndex,
            confidence: 0.8
          })
        }
        break
      }
    }
  }

  // Fallback logic if no statements found
  if (statements.length === 0) {
    const academicKeywords = /\b(?:study|research|analysis|method|result|conclusion|finding|data|experiment|test|evaluation|assessment|investigation)\b/i
    const academicSentences = candidates.filter(candidate =>
      academicKeywords.test(candidate.normalizedText) &&
      candidate.normalizedText.length >= 40 &&
      candidate.normalizedText.split(/\s+/).length >= 6 &&
      !/^(?:figure|table|doi:|http)/i.test(candidate.normalizedText.trim())
    )
    
    for (const candidate of academicSentences) {
      const withPunct = /[.!?]$/.test(candidate.normalizedText)
        ? candidate.normalizedText
        : `${candidate.normalizedText}.`
      
      statements.push({
        text: withPunct,
        startIndex: candidate.startIndex,
        endIndex: candidate.endIndex,
        confidence: 0.7
      })
    }
    
    // Second fallback: substantial sentences
    if (statements.length === 0) {
      const substantialSentences = candidates
        .filter(candidate => 
          candidate.normalizedText.length >= 35 && 
          candidate.normalizedText.split(/\s+/).length >= 5 &&
          !/^(?:see discussions|doi:|citations:|reads:|author|preprint|publication|figure|table)/i.test(candidate.normalizedText.trim()) &&
          !/^(?:https?:\/\/|www\.)/i.test(candidate.normalizedText.trim())
        )
        .slice(0, 10)
        
      for (const candidate of substantialSentences) {
        const withPunct = /[.!?]$/.test(candidate.normalizedText)
          ? candidate.normalizedText
          : `${candidate.normalizedText}.`
        
        statements.push({
          text: withPunct,
          startIndex: candidate.startIndex,
          endIndex: candidate.endIndex,
          confidence: 0.6
        })
      }
    }
  }

  // Ultimate fallback
  if (statements.length === 0 && processedText.trim().length > 20) {
    let userStatement = normalizeText(processedText.trim()) || processedText.trim()
    if (userStatement.length > 300) {
      userStatement = userStatement.substring(0, 300) + '...'
    }
    if (!/[.!?]$/.test(userStatement)) {
      userStatement += '.'
    }
    
    statements.push({
      text: userStatement,
      startIndex: 0,
      endIndex: Math.min(processedText.length, userStatement.length),
      confidence: 0.5
    })
  }

  // Remove duplicates and add context
  const uniqueStatements = statements.filter((s, i, arr) => 
    arr.findIndex(item => item.text === s.text) === i
  )
  
  return uniqueStatements.map((statement) => {
    const start = Math.max(0, statement.startIndex - CONTEXT_RADIUS)
    const end = Math.min(text.length, statement.endIndex + CONTEXT_RADIUS)
    const snippet = text.slice(start, end)
    const beforeLength = Math.max(statement.startIndex - start, 0)
    const highlightLength = Math.max(statement.endIndex - statement.startIndex, 0)
    const contextBefore = snippet.slice(0, beforeLength)
    const contextAfter = snippet.slice(beforeLength + highlightLength)

    return {
      ...statement,
      contextBefore,
      contextAfter,
      snippet
    }
  })
}
