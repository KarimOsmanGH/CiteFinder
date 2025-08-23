'use client'

import { ExternalLink, Star, Search, CheckCircle, AlertCircle } from 'lucide-react'

interface RelatedPaper {
  id: string
  title: string
  authors: string[]
  year: string
  abstract: string
  url: string
  similarity: number
  statement?: string
  supportingQuote?: string
}

interface RelatedPapersProps {
  papers: RelatedPaper[]
  statementsFound?: string[]
  selectedPapers?: RelatedPaper[]
  onPaperSelection?: (paper: RelatedPaper, isSelected: boolean) => void
}

export default function RelatedPapers({ papers, statementsFound = [], selectedPapers = [], onPaperSelection }: RelatedPapersProps) {
  console.log('🔍 RelatedPapers component received:')
  console.log('  - Papers:', papers?.length || 0)
  console.log('  - Statements found:', statementsFound?.length || 0)
  console.log('  - Selected papers:', selectedPapers?.length || 0)
  console.log('  - Papers data:', papers?.map(p => ({ title: p.title.substring(0, 30), similarity: p.similarity })))
  console.log('  - Statements data:', statementsFound)
  
  // Filter papers to only show those with 30% or higher similarity (more reasonable threshold)
  const filteredPapers = papers.filter(paper => paper.similarity >= 30)
  
  // Allow up to 9 papers total (3 per statement) for free users
  const limitedPapers = filteredPapers.slice(0, 9)
  
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
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-4">
              <Star className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Supporting Academic Papers</h2>
              <p className="text-gray-600">Select papers to include in your references</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">Selected Papers</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-1">{selectedPapers.length}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <div className="flex items-center">
                <Search className="w-5 h-5 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">Available Papers</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-1">{limitedPapers.length}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-orange-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">Statements</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-1">{statementsFound.length}</p>
            </div>
          </div>
          
          <div className="bg-blue-100 border border-blue-300 rounded-lg p-4">
            <p className="text-blue-800 text-sm font-medium mb-2">📋 How to use:</p>
            <ol className="text-blue-700 text-sm space-y-1">
              <li>1. Review each statement and its supporting papers below</li>
              <li>2. Click the checkbox next to papers you want to include in your references</li>
              <li>3. Use the References Generator to create your formatted bibliography</li>
            </ol>
          </div>
        </div>
        
        {/* Statements and Papers */}
        {statementsFound.map((statement, index) => (
          <div key={index} className="space-y-6">
            {/* Statement Card */}
            <div className="relative overflow-hidden rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-lg">
              <div className="absolute -top-6 -right-6 w-20 h-20 bg-gradient-to-br from-blue-400 to-indigo-400 opacity-10 rounded-full" aria-hidden="true"></div>
              <div className="flex items-start">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mr-4 flex-shrink-0">
                  <span className="text-white text-lg font-bold">{index + 1}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <h3 className="text-lg font-bold text-blue-900 tracking-wide uppercase">Statement {index + 1}</h3>
                    <div className="ml-3 px-2 py-1 bg-blue-200 text-blue-800 text-xs font-semibold rounded-full">
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
            
            {/* Papers for this statement */}
            {(() => {
              const statementPapers = limitedPapers.filter(paper => paper.statement === statement)
              if (statementPapers.length > 0) {
                return (
                  <div className="space-y-4">
                    {statementPapers.map((paper, paperIndex) => {
                      const isSelected = selectedPapers.some(p => p.id === paper.id)
                      return (
                        <div
                          key={paper.id}
                          className={`bg-white border-2 rounded-xl p-6 hover-lift transition-all duration-300 animate-slide-in-right ${
                            isSelected 
                              ? 'border-green-300 bg-green-50 shadow-lg' 
                              : 'border-gray-200 hover:border-blue-300 shadow-md'
                          }`}
                          style={{ animationDelay: `${paperIndex * 0.1}s` }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              {/* Paper Header */}
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                  <h3 className="text-xl font-bold text-gray-900 mb-3 leading-tight">
                                    {paper.title}
                                  </h3>
                                  <div className="flex items-center text-sm text-gray-600 mb-3">
                                    <div className="flex items-center">
                                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                                      <span className="font-medium">{paper.authors.join(', ')}</span>
                                    </div>
                                    <span className="mx-2">•</span>
                                    <span className="font-semibold text-gray-800">{paper.year}</span>
                                    <span className="mx-2">•</span>
                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                                      {paper.similarity}% match
                                    </span>
                                  </div>
                                </div>
                                
                                {/* Selection Controls */}
                                <div className="flex flex-col items-end space-y-3 ml-4">
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
                                          <CheckCircle className="w-4 h-4 mr-1" />
                                          Selected
                                        </span>
                                      ) : (
                                        "Select for references"
                                      )}
                                    </span>
                                  </div>
                                  
                                  {/* External Link */}
                                  {paper.url && (
                                    <a
                                      href={paper.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-colors"
                                    >
                                      <ExternalLink className="w-4 h-4 mr-2" />
                                      {paper.url.includes('doi.org') ? 'View DOI' : 'Open Paper'}
                                    </a>
                                  )}
                                </div>
                              </div>
                              
                              {/* Supporting Quote or Abstract */}
                              {paper.supportingQuote ? (
                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-5 mb-4">
                                  <div className="flex items-center mb-3">
                                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                                    <p className="text-sm font-bold text-green-800">Supporting Evidence</p>
                                  </div>
                                  <p className="text-green-700 text-sm italic leading-relaxed">"{paper.supportingQuote}"</p>
                                </div>
                              ) : (
                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-4">
                                  <p className="text-gray-600 text-sm leading-relaxed">
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
                  <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-700 mb-2">No Supporting Papers Found</h4>
                    <p className="text-gray-600 text-sm max-w-md mx-auto">
                      We couldn't find academic papers that strongly support this statement. 
                      This might be because the statement is too specific or needs additional context.
                    </p>
                  </div>
                )
              }
            })()}
          </div>
        ))}
        
        {/* Summary Footer */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Summary</h3>
              <p className="text-gray-600 text-sm">
                {selectedPapers.length} of {limitedPapers.length} papers selected for references
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">
                Next: Use the References Generator below to create your bibliography
              </p>
            </div>
          </div>
        </div>
        
        {/* Show message if no papers found at all */}
        {filteredPapers.length === 0 && papers.length > 0 && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
            <div className="flex items-center mb-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
              <h3 className="text-lg font-semibold text-yellow-800">Quality Threshold Not Met</h3>
            </div>
            <p className="text-yellow-700 text-sm">
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
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Search className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No High-Quality Matches Found</h3>
        <p className="text-gray-600">
          {papers.length > 0 
            ? `Found ${papers.length} papers, but none meet the 30% similarity threshold for quality matches.`
            : 'No related papers were found in the academic databases'
          }
        </p>
        {papers.length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Debug Info:</p>
            <p className="text-xs text-gray-500">Total papers: {papers.length}</p>
            <p className="text-xs text-gray-500">Highest similarity: {Math.max(...papers.map(p => p.similarity || 0))}%</p>
            <p className="text-xs text-gray-500">Papers with statements: {papers.filter(p => p.statement).length}</p>
            <p className="text-xs text-gray-500">Similarity threshold: 30%</p>
            <p className="text-xs text-gray-500">All similarity scores: {papers.map(p => p.similarity).join(', ')}</p>
          </div>
        )}
        {filteredPapers.length > 9 && (
          <p className="text-gray-500 text-sm mt-2">
            Free users can see up to 9 papers (3 per statement). Upgrade to Premium for unlimited access.
          </p>
        )}
      </div>
    )
  }
} 