'use client'

import { ExternalLink, Star, Search, CheckCircle, AlertCircle, Filter, SortAsc, SortDesc, BookOpen, Calendar, Users, Target } from 'lucide-react'
import { useState, useMemo } from 'react'
import { RelatedPaper, StatementWithPosition } from '@/types'

// Function to extract supporting quote from abstract
function extractSupportingQuoteFromAbstract(statement: string, abstract: string): string | undefined {
  if (!abstract || abstract.length < 50) return undefined
  
  // Extract key terms from statement
  const statementTerms = extractKeyTermsFromStatement(statement).toLowerCase().split(' ').filter(t => t.length > 3)
  
  // Split abstract into sentences
  const sentences = abstract.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 20)
  
  // Find sentences that contain statement terms
  const relevantSentences = sentences.filter(sentence => {
    const lowerSentence = sentence.toLowerCase()
    // Require at least 2 term matches for relevance
    const matchCount = statementTerms.filter(term => lowerSentence.includes(term)).length
    return matchCount >= 2
  })
  
  // Only return evidence if we have meaningful matches
  if (relevantSentences.length === 0) {
    return undefined // No good match, don't show evidence
  }
  
  // Return the most relevant sentence (best match based on term count)
  const bestSentence = relevantSentences.reduce((best, current) => {
    const currentScore = statementTerms.filter(term => current.toLowerCase().includes(term)).length
    const bestScore = statementTerms.filter(term => best.toLowerCase().includes(term)).length
    return currentScore > bestScore ? current : best
  })
  
  // Final check: only return if it has good overlap
  const finalScore = statementTerms.filter(term => bestSentence.toLowerCase().includes(term)).length
  if (finalScore < 2) {
    return undefined // Not enough term overlap
  }
  
  return bestSentence + '.'
}

// Extract key terms from a statement for better search
function extractKeyTermsFromStatement(statement: string): string {
  // Expanded stop words list
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'who', 'what', 'when', 'where', 'why', 'how', 'which', 'than', 'more', 'most', 'some', 'any', 'many', 'much', 'such', 'very', 'also', 'just', 'only', 'even', 'still', 'yet', 'now', 'then', 'here', 'there']
  
  // Priority terms that should be preserved (academic/technical terms)
  const priorityTerms = /\b(?:algorithm|analysis|approach|assessment|data|development|evaluation|experiment|framework|implementation|investigation|method|methodology|model|optimization|performance|procedure|process|research|results|study|system|technique|technology|test|validation|drone|uav|remote sensing|earth observation|satellite|aerial|imaging|spectral|monitoring|detection|mapping|survey|geospatial|software|open source|platform|application|solution|architecture|database|processing|accuracy|precision|effectiveness|efficiency|significant|correlation|improvement|enhancement|quality|reliability|propose|present|demonstrate|evaluate|assess|examine|investigate|analyze|measure|calculate|determine|establish|prove|validate|conclude|outcomes|findings|implications|impact|benefits|advantages|limitations|challenges|potential)\b/gi
  
  // Clean the statement but preserve more context
  const cleanedStatement = statement
    .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
  
  // Extract priority terms first
  const priorityMatches = cleanedStatement.match(priorityTerms) || []
  const priorityWords = priorityMatches.map(term => term.toLowerCase())
  
  // Split into words and filter out stop words
  const allWords = cleanedStatement.toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.includes(word))
  
  // Combine priority words with other meaningful words
  const meaningfulWords = [...new Set([...priorityWords, ...allWords])]
  
  // Prioritize longer, more specific terms
  const sortedWords = meaningfulWords.sort((a, b) => {
    // Prioritize priority terms
    const aPriority = priorityWords.includes(a) ? 1 : 0
    const bPriority = priorityWords.includes(b) ? 1 : 0
    if (aPriority !== bPriority) return bPriority - aPriority
    
    // Then by length (longer terms are usually more specific)
    return b.length - a.length
  })
  
  // Take up to 8 most relevant terms
  const finalTerms = sortedWords.slice(0, 8)
  
  if (finalTerms.length > 0) {
    return finalTerms.join(' ')
  }
  
  // Fallback: return the original statement cleaned up
  return cleanedStatement.toLowerCase()
}

interface RelatedPapersProps {
  papers: RelatedPaper[]
  statementsFound?: string[]
  selectedPapers?: RelatedPaper[]
  onPaperSelection?: (paper: RelatedPaper, isSelected: boolean) => void
  selectedStatement?: StatementWithPosition | null
  onClearStatementSelection?: () => void
}

export default function RelatedPapers({ papers, statementsFound = [], selectedPapers = [], onPaperSelection, selectedStatement, onClearStatementSelection }: RelatedPapersProps) {
  const [sortBy, setSortBy] = useState<'similarity' | 'year' | 'title'>('similarity')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filterByStatement, setFilterByStatement] = useState<string>('all')
  const [showOnlySelected, setShowOnlySelected] = useState(false)

  
  // IMPROVED: Filter papers to only show those with 50% or higher similarity (quality threshold)
  // This ensures only relevant papers are shown to users
  const filteredPapers = papers.filter(paper => paper.similarity >= 50)
  
  // Apply additional filters and sorting
  const processedPapers = useMemo(() => {
    let result = [...filteredPapers]
    
    // If a statement is selected, show only papers for that statement
    if (selectedStatement) {
      // Show only papers that directly match the selected statement
      result = result.filter(paper => 
        paper.statement === selectedStatement.text
      )
    } else {
      // Filter by statement dropdown if no statement is selected
      if (filterByStatement !== 'all') {
        result = result.filter(paper => paper.statement === filterByStatement)
      }
    }
    
    // Filter by selection status
    if (showOnlySelected) {
      result = result.filter(paper => selectedPapers.some(p => p.id === paper.id))
    }
    
    // Sort papers
    result.sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'similarity':
          comparison = a.similarity - b.similarity
          break
        case 'year':
          comparison = parseInt(a.year) - parseInt(b.year)
          break
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })
    
    return result
  }, [filteredPapers, selectedStatement, filterByStatement, showOnlySelected, selectedPapers, sortBy, sortOrder])
  
  // Show all papers without limitations
  const limitedPapers = processedPapers
  
  
  // Show content when we have papers to display
  if (limitedPapers.length > 0 || statementsFound.length === 0) {
    return (
      <div className="space-y-8">


        {/* Selected Statement Indicator */}
        {selectedStatement && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
                <div>
                  <h4 className="text-lg font-bold text-green-800">Selected Statement</h4>
                  <p className="text-green-700 text-sm mt-1">Showing papers that support this statement</p>
                </div>
              </div>
              <button
                onClick={onClearStatementSelection}
                className="px-3 py-1 text-sm bg-green-100 hover:bg-green-200 text-green-800 rounded-lg transition-colors"
              >
                Clear Selection
              </button>
            </div>
            <div className="mt-3 p-3 bg-white rounded-lg border border-green-200">
              <p className="text-gray-800 italic">"{selectedStatement.text}"</p>
            </div>
          </div>
        )}


        
        {/* Statements and Papers - Mobile Friendly with Table View */}
        {statementsFound.map((statement, index) => (
          <div key={index} className="space-y-4">
            {/* Enhanced Statement Card - Mobile Responsive */}
            <div className="relative overflow-hidden rounded-xl border-2 border-blue-300 bg-gradient-to-br from-blue-100 to-indigo-100 p-4 sm:p-6 lg:p-8 shadow-lg">
              <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br from-blue-400 to-indigo-400 opacity-10 rounded-full" aria-hidden="true"></div>
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <span className="text-white text-lg sm:text-xl font-bold">{index + 1}</span>
                </div>
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3">
                    <h3 className="text-lg sm:text-xl font-bold text-blue-900 tracking-wide uppercase">Statement {index + 1}</h3>
                    <div className="px-3 py-1 bg-blue-200 text-blue-800 text-xs sm:text-sm font-semibold rounded-full w-fit">
                      {(() => {
                        const statementPapers = limitedPapers.filter(paper => paper.statement === statement)
                        return `${statementPapers.length} supporting paper${statementPapers.length !== 1 ? 's' : ''}`
                      })()}
                    </div>
                  </div>
                  <p className="text-sm sm:text-base lg:text-lg leading-relaxed text-blue-900 font-medium">
                    {statement}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Papers Table for this statement */}
            {(() => {
              const statementPapers = limitedPapers.filter(paper => paper.statement === statement)
              if (statementPapers.length > 0) {
                return (
                  <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden shadow-lg">
                    {/* Table Header - Hidden on mobile, shown on larger screens */}
                    <div className="hidden md:grid md:grid-cols-12 bg-gradient-to-r from-gray-200 to-gray-100 border-b-2 border-gray-400 px-4 py-3 font-semibold text-gray-800 text-sm">
                      <div className="col-span-1 flex items-center justify-center">Select</div>
                      <div className="col-span-5">Title</div>
                      <div className="col-span-2 text-center">Year</div>
                      <div className="col-span-2 text-center">Match</div>
                      <div className="col-span-2 text-center">Actions</div>
                    </div>
                    
                    {/* Scrollable Table Body */}
                    <div className="overflow-y-auto max-h-[600px]">
                      {statementPapers.map((paper, paperIndex) => {
                        const isSelected = selectedPapers.some(p => p.id === paper.id)
                        const supportingQuote = paper.supportingQuote || extractSupportingQuoteFromAbstract(statement, paper.abstract)
                        
                        return (
                          <div
                            key={paper.id}
                            className={`border-b border-gray-200 last:border-b-0 transition-all duration-200 ${
                              isSelected 
                                ? 'bg-green-50' 
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            {/* Desktop View - Table Row */}
                            <div className="hidden md:grid md:grid-cols-12 px-4 py-4 items-center gap-4">
                              {/* Select Checkbox */}
                              <div className="col-span-1 flex items-center justify-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => onPaperSelection?.(paper, e.target.checked)}
                                  className="w-5 h-5 text-green-600 bg-white border-2 border-gray-300 rounded focus:ring-green-500 focus:ring-2 hover:bg-green-50 transition-colors cursor-pointer"
                                  title={isSelected ? "Remove from references" : "Add to references"}
                                />
                              </div>
                              
                              {/* Title */}
                              <div className="col-span-5">
                                <h4 className="font-bold text-gray-900 text-sm leading-tight line-clamp-3">
                                  {paper.title}
                                </h4>
                              </div>
                              
                              {/* Year */}
                              <div className="col-span-2 text-center">
                                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                                  {paper.year}
                                </span>
                              </div>
                              
                              {/* Match Percentage */}
                              <div className="col-span-2 text-center">
                                <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded">
                                  {paper.similarity}%
                                </span>
                              </div>
                              
                              {/* Actions */}
                              <div className="col-span-2 flex justify-center gap-2">
                                {paper.url && (
                                  <a
                                    href={paper.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                                    title="Open paper"
                                  >
                                    <ExternalLink className="w-3 h-3 mr-1" />
                                    View
                                  </a>
                                )}
                              </div>
                            </div>
                            
                            {/* Mobile View - Card Style */}
                            <div className="md:hidden p-4 space-y-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3 flex-1">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => onPaperSelection?.(paper, e.target.checked)}
                                    className="w-5 h-5 mt-1 text-green-600 bg-white border-2 border-gray-300 rounded focus:ring-green-500 focus:ring-2 hover:bg-green-50 transition-colors cursor-pointer flex-shrink-0"
                                    title={isSelected ? "Remove from references" : "Add to references"}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-gray-900 text-sm mb-2 leading-tight">
                                      {paper.title}
                                    </h4>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                                        {paper.year}
                                      </span>
                                      <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded">
                                        {paper.similarity}% match
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Supporting Evidence - Mobile */}
                              {supportingQuote && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                  <div className="flex items-center mb-2">
                                    <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                                    <p className="text-xs font-bold text-green-800">Evidence</p>
                                  </div>
                                  <p className="text-xs text-green-700 italic leading-relaxed">"{supportingQuote}"</p>
                                </div>
                              )}
                              
                              {/* Actions - Mobile */}
                              {paper.url && (
                                <div className="flex justify-end">
                                  <a
                                    href={paper.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                                  >
                                    <ExternalLink className="w-3 h-3 mr-1" />
                                    {paper.url.includes('doi.org') ? 'View DOI' : 'Open Paper'}
                                  </a>
                                </div>
                              )}
                            </div>
                            
                            {/* Supporting Evidence - Desktop (Expandable row) */}
                            {supportingQuote && (
                              <div className="hidden md:block px-4 pb-4 pt-0">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                  <div className="flex items-center mb-2">
                                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                                    <p className="text-xs font-bold text-green-800">Supporting Evidence</p>
                                  </div>
                                  <p className="text-xs text-green-700 italic leading-relaxed">"{supportingQuote}"</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              } else {
                return (
                  <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6 sm:p-10 text-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                      <Search className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                    </div>
                    <h4 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2 sm:mb-3">No Supporting Papers Found</h4>
                    <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto">
                      We couldn't find academic papers that strongly support this statement. 
                      This might be because the statement is too specific or needs additional context.
                    </p>
                  </div>
                )
              }
            })()}
          </div>
        ))}
        
        {/* Enhanced Summary Footer - Mobile Responsive */}
        <div className="bg-gradient-to-r from-gray-100 to-blue-100 border-2 border-gray-300 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-4 sm:gap-6">
            <div>
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Selection Summary</h3>
              <p className="text-gray-600 text-sm sm:text-base lg:text-lg">
                {selectedPapers.length} of {limitedPapers.length} papers selected for references
              </p>
            </div>
            <div>
              <div className="bg-blue-200 border-2 border-blue-300 rounded-lg sm:rounded-xl p-3 sm:p-4">
                <p className="text-blue-800 font-semibold mb-1 text-sm sm:text-base">Next Step</p>
                <p className="text-blue-700 text-xs sm:text-sm">
                  Use the References Generator below to create your formatted bibliography
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Enhanced Error Messages */}
        {filteredPapers.length === 0 && papers.length > 0 && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-8">
            <div className="flex items-center mb-4">
              <AlertCircle className="w-8 h-8 text-yellow-600 mr-4" />
              <h3 className="text-xl font-semibold text-yellow-800">Quality Threshold Not Met</h3>
            </div>
            <p className="text-yellow-700 text-base">
              Found {papers.length} papers, but none meet the 50% similarity threshold for quality academic citations. 
              The statements above were extracted from your content and may need additional research to find supporting sources.
            </p>
          </div>
        )}
      </div>
    )
  }
  
  // If no statements found, show the original "no papers" message
  if (filteredPapers.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Search className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-2xl font-semibold text-gray-900 mb-4">No High-Quality Matches Found</h3>
        <p className="text-gray-600 text-lg mb-6">
          {papers.length > 0 
            ? `Found ${papers.length} papers, but none meet the 50% similarity threshold for quality matches.`
            : 'No related papers were found in the academic databases'
          }
        </p>
        {papers.length > 0 && (
          <div className="mt-8 p-6 bg-gray-50 rounded-xl max-w-2xl mx-auto">
            <p className="text-sm text-gray-600 mb-4 font-semibold">Debug Information:</p>
            <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
              <div>Total papers: {papers.length}</div>
              <div>Highest similarity: {Math.max(...papers.map(p => p.similarity || 0))}%</div>
              <div>Papers with statements: {papers.filter(p => p.statement).length}</div>
              <div>Similarity threshold: 50%</div>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              All similarity scores: {papers.map(p => p.similarity).join(', ')}
            </div>
          </div>
        )}
        {filteredPapers.length > 9 && (
          <p className="text-gray-500 text-base mt-6">
            Free users can see up to 9 papers (3 per statement). Upgrade to Premium for unlimited access.
          </p>
        )}
      </div>
    )
  }
} 