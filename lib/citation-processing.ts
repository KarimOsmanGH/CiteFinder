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
  /\b(?:achieves|reaches|obtains|attains|achieves.*\d+%|achieves.*\d+\.\d+%|accuracy.*\d+%|precision.*\d+%|performance.*\d+%|improvement.*\d+%|reduction.*\d+%|increase.*\d+%)\b/gi,
  // Comparative claims
  /\b(?:better than|more effective|superior to|outperforms|exceeds|surpasses|compared to|in contrast|versus|against|higher than|lower than|faster than|slower than|more accurate|less accurate)\b/gi,
  // Causal relationships
  /\b(?:leads to|results in|causes|enables|facilitates|improves|enhances|reduces|increases|decreases|affects|influences|impacts|determines|predicts)\b/gi,
  // Research findings
  /\b(?:research shows|studies indicate|evidence suggests|data reveals|findings indicate|has been shown|has been found|results show|analysis demonstrates|investigation reveals|experiments show|empirical evidence|statistical analysis)\b/gi,
  // Methodological innovations
  /\b(?:propose.*method|introduce.*approach|develop.*technique|create.*algorithm|design.*framework|implement.*system|establish.*protocol|formulate.*model)\b/gi,
  // Significant findings
  /\b(?:significant|statistically significant|p-?value.*<|correlation.*=|correlation.*\d+\.\d+|improvement.*of|enhancement.*by|effect size|confidence interval)\b/gi,
  // Results and conclusions
  /\b(?:conclude.*that|results.*demonstrate|findings.*suggest|analysis.*reveals|study.*finds|research.*confirms|data.*supports|evidence.*indicates)\b/gi,
  // Performance metrics
  /\b(?:efficiency.*\d+%|accuracy.*\d+%|speed.*\d+%|precision.*\d+%|recall.*\d+%|f1.*score|processing.*time|computational.*cost|memory.*usage|storage.*requirements)\b/gi
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
  
  let normalized = normalizeText(processedText)
  
  if (!normalized.trim()) {
    normalized = processedText
  }

  // Split into sentence candidates
  let candidates = normalized
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .filter(s => s && s.trim().length > 0)
  
  if (candidates.length <= 1) {
    candidates = normalized
      .split(/\n+/)
      .filter(s => s && s.trim().length > 20)
  }
  
  if (candidates.length === 0) {
    candidates = [processedText.trim()]
  }
  
  // Sample if too many candidates
  if (candidates.length > MAX_STATEMENT_CANDIDATES) {
    const step = Math.ceil(candidates.length / MAX_STATEMENT_CANDIDATES)
    const sampled: string[] = []
    for (let i = 0; i < candidates.length && sampled.length < MAX_STATEMENT_CANDIDATES; i += step) {
      sampled.push(candidates[i])
    }
    candidates = sampled
  }
  
  for (const sentence of candidates) {
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
          const startIndex = text.indexOf(cleanStatement)
          const endIndex = startIndex + cleanStatement.length
          
          statements.push({
            text: cleanStatement,
            startIndex: startIndex >= 0 ? startIndex : 0,
            endIndex: endIndex,
            confidence: 0.8
          })
        }
        break
      }
    }
  }

  // Fallback logic if no statements found
  if (statements.length === 0) {
    const academicKeywords = /\b(?:study|research|analysis|method|result|conclusion|finding|data|experiment|test|evaluation|assessment|investigation)\b/gi
    const academicSentences = candidates.filter(s => 
      academicKeywords.test(s) && 
      s.length >= 40 && 
      s.split(/\s+/).length >= 6 &&
      !/^(?:figure|table|doi:|http)/i.test(s.trim())
    )
    
    for (const s of academicSentences) {
      const withPunct = /[.!?]$/.test(s) ? s : s + '.'
      const startIndex = text.indexOf(withPunct)
      const endIndex = startIndex + withPunct.length
      
      statements.push({
        text: withPunct,
        startIndex: startIndex >= 0 ? startIndex : 0,
        endIndex: endIndex,
        confidence: 0.7
      })
    }
    
    // Second fallback: substantial sentences
    if (statements.length === 0) {
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
        const startIndex = text.indexOf(withPunct)
        const endIndex = startIndex + withPunct.length
        
        statements.push({
          text: withPunct,
          startIndex: startIndex >= 0 ? startIndex : 0,
          endIndex: endIndex,
          confidence: 0.6
        })
      }
    }
  }

  // Ultimate fallback
  if (statements.length === 0 && processedText.trim().length > 20) {
    let userStatement = processedText.trim()
    if (userStatement.length > 300) {
      userStatement = userStatement.substring(0, 300) + '...'
    }
    if (!/[.!?]$/.test(userStatement)) {
      userStatement += '.'
    }
    const startIndex = text.indexOf(userStatement)
    const endIndex = startIndex + userStatement.length
    
    statements.push({
      text: userStatement,
      startIndex: startIndex >= 0 ? startIndex : 0,
      endIndex: endIndex,
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
    const contextBefore = snippet.slice(0, beforeLength)
    const contextAfter = snippet.slice(beforeLength + statement.text.length)

    return {
      ...statement,
      contextBefore,
      contextAfter,
      snippet
    }
  })
}
