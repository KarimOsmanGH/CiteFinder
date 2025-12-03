// Shared utility functions for CiteFinder

import { 
  STOP_WORDS, 
  PRIORITY_TERMS_PATTERN, 
  IMPORTANT_PHRASES,
  SIMILARITY_THRESHOLDS 
} from './constants'

/**
 * Enforce a timeout on any async operation
 */
export async function withTimeout<T>(
  promise: Promise<T>, 
  ms: number, 
  fallback: T
): Promise<T> {
  return new Promise<T>((resolve) => {
    let settled = false
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true
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

/**
 * Extract key terms from a statement for better search
 */
export function extractKeyTermsFromStatement(statement: string): string {
  // Clean the statement
  let cleanedStatement = statement
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
  
  // Extract and preserve important phrases
  const preservedPhrases: string[] = []
  IMPORTANT_PHRASES.forEach(phrase => {
    if (cleanedStatement.includes(phrase)) {
      preservedPhrases.push(phrase)
      cleanedStatement = cleanedStatement.replace(phrase, '')
    }
  })
  
  // Extract priority terms
  const priorityMatches = statement.match(PRIORITY_TERMS_PATTERN) || []
  const priorityWords = priorityMatches.map(term => term.toLowerCase())
  
  // Split into words and filter out stop words
  const allWords = cleanedStatement
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOP_WORDS.includes(word as any))
  
  // Combine priority words with other meaningful words
  const meaningfulWords = [...new Set([...priorityWords, ...allWords])]
  
  // Prioritize longer, more specific terms
  const sortedWords = meaningfulWords.sort((a, b) => {
    const aPriority = priorityWords.includes(a) ? 1 : 0
    const bPriority = priorityWords.includes(b) ? 1 : 0
    if (aPriority !== bPriority) return bPriority - aPriority
    return b.length - a.length
  })
  
  // Take up to 8 most relevant terms
  const finalTerms = [...preservedPhrases, ...sortedWords.slice(0, 6)]
  
  if (finalTerms.length > 0) {
    return finalTerms.join(' ')
  }
  
  return statement.toLowerCase()
}

/**
 * Extract a supporting quote from an abstract that relates to the statement
 */
export function extractSupportingQuote(
  statement: string, 
  abstract: string
): string | undefined {
  if (!abstract || abstract.length < 50) return undefined
  
  const statementTerms = extractKeyTermsFromStatement(statement)
    .toLowerCase()
    .split(' ')
    .filter(t => t.length > 3)
  
  const sentences = abstract
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 20)
  
  const relevantSentences = sentences.filter(sentence => {
    const lowerSentence = sentence.toLowerCase()
    const matchCount = statementTerms.filter(term => 
      lowerSentence.includes(term)
    ).length
    return matchCount >= SIMILARITY_THRESHOLDS.MIN_TERM_MATCHES
  })
  
  if (relevantSentences.length === 0) {
    return undefined
  }
  
  const bestSentence = relevantSentences.reduce((best, current) => {
    const currentScore = statementTerms.filter(term => 
      current.toLowerCase().includes(term)
    ).length
    const bestScore = statementTerms.filter(term => 
      best.toLowerCase().includes(term)
    ).length
    return currentScore > bestScore ? current : best
  })
  
  const finalScore = statementTerms.filter(term => 
    bestSentence.toLowerCase().includes(term)
  ).length
  
  if (finalScore < SIMILARITY_THRESHOLDS.MIN_TERM_MATCHES) {
    return undefined
  }
  
  return bestSentence + '.'
}

/**
 * Normalize text for processing
 */
export function normalizeText(text: string): string {
  return text
    .replace(/\r/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .replace(/^[\s>*•–-]+/gm, '')
    .replace(/^\d+\.\s*/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Extract year from citation text
 */
export function extractYear(text: string): string | undefined {
  const yearMatch = text.match(/\b(19|20)\d{2}\b/)
  return yearMatch ? yearMatch[0] : undefined
}

/**
 * Extract authors from citation text
 */
export function extractAuthors(text: string): string | undefined {
  const authorMatch = text.match(/^([^(]+?)(?:\s*\(\d{4}\)|,|\.)/)
  if (authorMatch) {
    return authorMatch[1].trim()
  }
  
  const etAlMatch = text.match(/([A-Z][a-z]+\s*et\s*al\.)/)
  if (etAlMatch) {
    return etAlMatch[1].trim()
  }
  
  return undefined
}

/**
 * Extract title from citation text
 */
export function extractTitle(text: string): string | undefined {
  const titleMatch = text.match(/"([^"]+)"/)
  if (titleMatch) {
    return titleMatch[1].trim()
  }
  
  const parts = text.split('.')
  if (parts.length > 1) {
    const potentialTitle = parts[1]?.trim()
    if (potentialTitle && potentialTitle.length > 10 && potentialTitle.length < 200) {
      return potentialTitle
    }
  }
  
  return undefined
}

/**
 * Generate a unique ID
 */
export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}
