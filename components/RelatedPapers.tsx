'use client'

import { ExternalLink, Star, Search, CheckCircle, AlertCircle, Filter, SortAsc, SortDesc, BookOpen, Calendar, Users, Target } from 'lucide-react'
import { useState, useMemo } from 'react'
import { RelatedPaper } from '@/types'

interface RelatedPapersProps {
  papers: RelatedPaper[]
  statementsFound?: string[]
  selectedPapers?: RelatedPaper[]
  onPaperSelection?: (paper: RelatedPaper, isSelected: boolean) => void
}

export default function RelatedPapers({ papers, statementsFound = [], selectedPapers = [], onPaperSelection }: RelatedPapersProps) {
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
  
  // Filter papers to only show those with 30% or higher similarity
  const filteredPapers = papers.filter(paper => paper.similarity >= 30)
  
  // Apply additional filters and sorting
  const processedPapers = useMemo(() => {
    let result = [...filteredPapers]
    
    // Filter by statement
    if (filterByStatement !== 'all') {
      result = result.filter(paper => paper.statement === filterByStatement)
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
  }, [filteredPapers, filterByStatement, showOnlySelected, selectedPapers, sortBy, sortOrder])
  
  // Allow up to 9 papers total (3 per statement) for free users
  const limitedPapers = processedPapers.slice(0, 9)
  
  console.log('🔍 RelatedPapers processing:')
  console.log('  - Filtered papers (30%+):', filteredPapers.length)
  console.log('  - Limited papers:', limitedPapers.length)
  
  // Debug logging
  console.log('RelatedPapers Debug:', {
    totalPapers: papers.length,
    papersWithSimilarity: papers.map(p => ({ title: p.title, similarity: p.similarity, statement: p.statement })),
    filteredPapersCount: filteredPapers.length,
    statementsFound: statementsFound,
    similarityThreshold: 30
  })
  
  // Always show statements if we have them, regardless of paper count
  if (statementsFound.length > 0) {
    return (
      <div className="space-y-8">
        {/* Enhanced Header Section */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-8 border-2 border-blue-200 shadow-lg">
          <div className="flex items-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mr-6 shadow-lg">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Supporting Academic Papers</h2>
              <p className="text-gray-600 text-lg">Select papers to include in your references</p>
            </div>
          </div>
          
          {/* Enhanced Statistics Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-5 border-2 border-green-200 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-3">
                <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
                <span className="text-sm font-semibold text-gray-700">Selected Papers</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{selectedPapers.length}</p>
              <p className="text-xs text-gray-500 mt-1">Ready for references</p>
            </div>
            <div className="bg-white rounded-xl p-5 border-2 border-blue-200 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-3">
                <Search className="w-6 h-6 text-blue-600 mr-3" />
                <span className="text-sm font-semibold text-gray-700">Available Papers</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{limitedPapers.length}</p>
              <p className="text-xs text-gray-500 mt-1">High-quality matches</p>
            </div>
            <div className="bg-white rounded-xl p-5 border-2 border-orange-200 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-3">
                <Target className="w-6 h-6 text-orange-600 mr-3" />
                <span className="text-sm font-semibold text-gray-700">Statements</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{statementsFound.length}</p>
              <p className="text-xs text-gray-500 mt-1">From your content</p>
            </div>
            <div className="bg-white rounded-xl p-5 border-2 border-purple-200 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-3">
                <Star className="w-6 h-6 text-purple-600 mr-3" />
                <span className="text-sm font-semibold text-gray-700">Avg. Similarity</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {limitedPapers.length > 0 
                  ? Math.round(limitedPapers.reduce((sum, p) => sum + p.similarity, 0) / limitedPapers.length)
                  : 0}%
              </p>
              <p className="text-xs text-gray-500 mt-1">Quality score</p>
            </div>
          </div>
          
          {/* Enhanced Instructions */}
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
                  <p className="text-blue-700 text-sm">Examine each statement and its supporting papers below</p>
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
        </div>

        {/* Enhanced Filtering and Sorting Controls */}
        <div className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-md">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <h3 className="text-xl font-bold text-gray-900">Paper Selection & Organization</h3>
            <div className="flex flex-wrap gap-3">
              {/* Statement Filter */}
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-600" />
                <select
                  value={filterByStatement}
                  onChange={(e) => setFilterByStatement(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Statements</option>
                  {statementsFound.map((statement, index) => (
                    <option key={index} value={statement}>
                      Statement {index + 1}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Controls */}
              <div className="flex items-center space-x-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'similarity' | 'year' | 'title')}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="similarity">Similarity</option>
                  <option value="year">Year</option>
                  <option value="title">Title</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                >
                  {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                </button>
              </div>

              {/* Show Only Selected Toggle */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="showOnlySelected"
                  checked={showOnlySelected}
                  onChange={(e) => setShowOnlySelected(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="showOnlySelected" className="text-sm text-gray-700">
                  Show only selected
                </label>
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Showing {limitedPapers.length} of {filteredPapers.length} papers
                </span>
                {filterByStatement !== 'all' && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                    Filtered by statement
                  </span>
                )}
                {showOnlySelected && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                    Selected only
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-600">
                Sorted by {sortBy} ({sortOrder === 'asc' ? 'ascending' : 'descending'})
              </div>
            </div>
          </div>
        </div>
        
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
                              {paper.supportingQuote ? (
                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 mb-6">
                                  <div className="flex items-center mb-4">
                                    <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
                                    <p className="text-lg font-bold text-green-800">Supporting Evidence</p>
                                  </div>
                                  <p className="text-green-700 text-base italic leading-relaxed">"{paper.supportingQuote}"</p>
                                </div>
                              ) : (
                                <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6 mb-6">
                                  <div className="flex items-center mb-3">
                                    <BookOpen className="w-5 h-5 text-gray-600 mr-2" />
                                    <p className="text-sm font-semibold text-gray-700">Abstract</p>
                                  </div>
                                  <p className="text-gray-600 text-base leading-relaxed">
                                    {paper.abstract}
                                  </p>
                                </div>
                              )}
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
              Found {papers.length} papers, but none meet the 30% similarity threshold for quality academic citations. 
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
            ? `Found ${papers.length} papers, but none meet the 30% similarity threshold for quality matches.`
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
              <div>Similarity threshold: 30%</div>
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