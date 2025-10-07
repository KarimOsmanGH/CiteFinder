'use client'

import { ExternalLink, Star, Search, CheckCircle, AlertCircle, Filter, SortAsc, SortDesc, BookOpen, Calendar, Users, Target } from 'lucide-react'
import { useState, useMemo } from 'react'
import { RelatedPaper, StatementWithPosition } from '@/types'

// Function to extract supporting quote from abstract
function extractSupportingQuoteFromAbstract(statement: string, abstract: string): string | undefined {
  if (!abstract || abstract.length < 50) return undefined
  
  // Extract key terms from statement
  const statementTerms = extractKeyTermsFromStatement(statement).toLowerCase().split(' ')
  
  // Split abstract into sentences
  const sentences = abstract.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 20)
  
  // Find sentences that contain statement terms
  const relevantSentences = sentences.filter(sentence => {
    const lowerSentence = sentence.toLowerCase()
    return statementTerms.some(term => lowerSentence.includes(term))
  })
  
  if (relevantSentences.length === 0) {
    // Fallback: return first meaningful sentence
    const firstSentence = sentences.find(s => s.length > 30 && s.length < 200)
    return firstSentence ? firstSentence + '.' : undefined
  }
  
  // Return the most relevant sentence (longest match or first match)
  const bestSentence = relevantSentences.reduce((best, current) => {
    const currentScore = statementTerms.filter(term => current.toLowerCase().includes(term)).length
    const bestScore = statementTerms.filter(term => best.toLowerCase().includes(term)).length
    return currentScore > bestScore ? current : best
  })
  
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

  console.log('🔍 RelatedPapers component received:')
  console.log('  - Papers:', papers?.length || 0)
  console.log('  - Statements found:', statementsFound?.length || 0)
  console.log('  - Selected papers:', selectedPapers?.length || 0)
  console.log('  - Papers data:', papers?.map(p => ({ title: p.title.substring(0, 30), similarity: p.similarity })))
  console.log('  - Statements data:', statementsFound)
  
  // Filter papers to only show those with 20% or higher similarity (more lenient threshold)
  const filteredPapers = papers.filter(paper => paper.similarity >= 20)
  
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
  
  console.log('🔍 RelatedPapers processing:')
  console.log('  - Filtered papers (30%+):', filteredPapers.length)
  console.log('  - Total papers:', limitedPapers.length)
  
  // Debug logging
  console.log('RelatedPapers Debug:', {
    totalPapers: papers.length,
    papersWithSimilarity: papers.map(p => ({ title: p.title, similarity: p.similarity, statement: p.statement })),
    filteredPapersCount: filteredPapers.length,
    statementsFound: statementsFound,
    similarityThreshold: 30
  })
  
  // Show content when we have papers to display
  if (limitedPapers.length > 0 || statementsFound.length === 0) {
    return (
      <div className="space-y-8">

        
        {/* Enhanced Instructions - only show when no statement is selected */}
        {!selectedStatement && (
          <div className="bg-gradient-to-r from-blue-100 to-indigo-100 border-2 border-blue-300 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mr-4">
                <span className="text-white font-bold text-lg">📋</span>
              </div>
              <h3 className="text-lg font-bold text-blue-900">How to Build Your References</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mr-3 flex-shrink-0 mt-1">
                  <span className="text-sm font-bold">1</span>
                </div>
                <div>
                  <p className="text-blue-800 font-semibold mb-1">Review Statements</p>
                  <p className="text-blue-700 text-sm">Review the extracted statements above to see supporting papers</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mr-3 flex-shrink-0 mt-1">
                  <span className="text-sm font-bold">2</span>
                </div>
                <div>
                  <p className="text-blue-800 font-semibold mb-1">Select Papers</p>
                  <p className="text-blue-700 text-sm">Click checkboxes next to papers you want in your references</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mr-3 flex-shrink-0 mt-1">
                  <span className="text-sm font-bold">3</span>
                </div>
                <div>
                  <p className="text-blue-800 font-semibold mb-1">Generate Bibliography</p>
                  <p className="text-blue-700 text-sm">Use the References Generator to create your formatted bibliography</p>
                </div>
              </div>
            </div>
          </div>
        )}

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


        
        {/* Statements and Papers */}
        {statementsFound.map((statement, index) => (
          <div key={index} className="space-y-6">
            {/* Enhanced Statement Card */}
            <div className="relative overflow-hidden rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-8 shadow-lg">
              <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br from-blue-400 to-indigo-400 opacity-10 rounded-full" aria-hidden="true"></div>
              <div className="flex items-start">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mr-6 flex-shrink-0 shadow-lg">
                  <span className="text-white text-xl font-bold">{index + 1}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center mb-4">
                    <h3 className="text-xl font-bold text-blue-900 tracking-wide uppercase">Statement {index + 1}</h3>
                    <div className="ml-4 px-3 py-1 bg-blue-200 text-blue-800 text-sm font-semibold rounded-full">
                      {(() => {
                        const statementPapers = limitedPapers.filter(paper => paper.statement === statement)
                        return `${statementPapers.length} supporting paper${statementPapers.length !== 1 ? 's' : ''}`
                      })()}
                    </div>
                  </div>
                  <p className="text-lg leading-relaxed text-blue-900 font-medium">
                    {statement}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Enhanced Papers for this statement */}
            {(() => {
              const statementPapers = limitedPapers.filter(paper => paper.statement === statement)
              if (statementPapers.length > 0) {
                return (
                  <div className="space-y-6">
                    {statementPapers.map((paper, paperIndex) => {
                      const isSelected = selectedPapers.some(p => p.id === paper.id)
                      return (
                        <div
                          key={paper.id}
                          className={`bg-white border-2 rounded-2xl p-8 hover-lift transition-all duration-300 animate-slide-in-right ${
                            isSelected 
                              ? 'border-green-300 bg-green-50 shadow-xl' 
                              : 'border-gray-200 hover:border-blue-300 shadow-lg'
                          }`}
                          style={{ animationDelay: `${paperIndex * 0.1}s` }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              {/* Enhanced Paper Header */}
                              <div className="flex items-start justify-between mb-6">
                                <div className="flex-1">
                                  <h3 className="text-2xl font-bold text-gray-900 mb-4 leading-tight">
                                    {paper.title}
                                  </h3>
                                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                                    <div className="flex items-center">
                                      <Users className="w-4 h-4 mr-2 text-blue-600" />
                                      <span className="font-medium">{paper.authors.join(', ')}</span>
                                    </div>
                                    <div className="flex items-center">
                                      <Calendar className="w-4 h-4 mr-2 text-green-600" />
                                      <span className="font-semibold text-gray-800">{paper.year}</span>
                                    </div>
                                    <div className="flex items-center">
                                      <Target className="w-4 h-4 mr-2 text-purple-600" />
                                      <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full">
                                        {paper.similarity}% match
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Enhanced Selection Controls */}
                                <div className="flex flex-col items-end space-y-4 ml-6">
                                  <div className="flex items-center space-x-3">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={(e) => onPaperSelection?.(paper, e.target.checked)}
                                      className="w-6 h-6 text-green-600 bg-white border-2 border-gray-300 rounded-lg focus:ring-green-500 focus:ring-2 hover:bg-green-50 transition-colors"
                                      title={isSelected ? "Remove from references" : "Add to references"}
                                    />
                                    <span className="text-sm font-medium text-gray-700">
                                      {isSelected ? (
                                        <span className="text-green-700 flex items-center">
                                          <CheckCircle className="w-5 h-5 mr-2" />
                                          Selected
                                        </span>
                                      ) : (
                                        "Select for references"
                                      )}
                                    </span>
                                  </div>
                                  
                                  {/* Enhanced External Link */}
                                  {paper.url && (
                                    <a
                                      href={paper.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border-2 border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-colors"
                                    >
                                      <ExternalLink className="w-4 h-4 mr-2" />
                                      {paper.url.includes('doi.org') ? 'View DOI' : 'Open Paper'}
                                    </a>
                                  )}
                                </div>
                              </div>
                              
                              {/* Enhanced Supporting Quote or Abstract */}
                              {(() => {
                                // Try to get supporting quote - either from paper or extract from abstract
                                const supportingQuote = paper.supportingQuote || extractSupportingQuoteFromAbstract(statement, paper.abstract)
                                
                                if (supportingQuote) {
                                  return (
                                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 mb-6">
                                      <div className="flex items-center mb-4">
                                        <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
                                        <p className="text-lg font-bold text-green-800">Supporting Evidence</p>
                                      </div>
                                      <p className="text-green-700 text-base italic leading-relaxed">"{supportingQuote}"</p>
                                    </div>
                                  )
                                } else {
                                  return (
                                    <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6 mb-6">
                                      <div className="flex items-center mb-3">
                                        <BookOpen className="w-5 h-5 text-gray-600 mr-2" />
                                        <p className="text-sm font-semibold text-gray-700">Abstract</p>
                                      </div>
                                      <p className="text-gray-600 text-base leading-relaxed">
                                        {paper.abstract}
                                      </p>
                                    </div>
                                  )
                                }
                              })()}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              } else {
                return (
                  <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-10 text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Search className="w-10 h-10 text-gray-400" />
                    </div>
                    <h4 className="text-xl font-semibold text-gray-700 mb-3">No Supporting Papers Found</h4>
                    <p className="text-gray-600 text-base max-w-md mx-auto">
                      We couldn't find academic papers that strongly support this statement. 
                      This might be because the statement is too specific or needs additional context.
                    </p>
                  </div>
                )
              }
            })()}
          </div>
        ))}
        
        {/* Enhanced Summary Footer */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-gray-200 rounded-2xl p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Selection Summary</h3>
              <p className="text-gray-600 text-lg">
                {selectedPapers.length} of {limitedPapers.length} papers selected for references
              </p>
            </div>
            <div className="text-right">
              <div className="bg-blue-100 border-2 border-blue-200 rounded-xl p-4">
                <p className="text-blue-800 font-semibold mb-1">Next Step</p>
                <p className="text-blue-700 text-sm">
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
              Found {papers.length} papers, but none meet the 20% similarity threshold for quality academic citations. 
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
            ? `Found ${papers.length} papers, but none meet the 20% similarity threshold for quality matches.`
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
              <div>Similarity threshold: 20%</div>
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