'use client'

import { ExternalLink, Star, Search } from 'lucide-react'

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
  console.log('  - Filtered papers (60%+):', filteredPapers.length)
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
        <div className="bg-white rounded-xl p-4 border border-gray-200 mb-2">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Build your References page</h3>
          <p className="text-blue-700 text-sm mb-3">📋 <strong>Important:</strong> Click the checkbox next to each paper you want to include in your references. Selected papers will be highlighted in green.</p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-yellow-800 text-sm flex items-center">
              <span className="mr-2">⚠️</span>
              <strong>Step 1:</strong> Select papers using checkboxes below → <strong>Step 2:</strong> Use the References Generator to create your bibliography
            </p>
          </div>
        </div>
        
        {/* Show Statements */}
        {statementsFound.map((statement, index) => (
          <div key={index} className="space-y-4">
            {/* Statement Header */}
            <div className="relative overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 shadow-sm">
              <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br from-blue-400 to-indigo-400 opacity-10 rounded-full" aria-hidden="true"></div>
              <div className="flex items-start">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mr-3" aria-hidden="true">
                  <span className="text-white text-sm font-bold">{index + 1}</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-blue-900 tracking-wide uppercase">Statement</h3>
                  <p className="mt-1 text-lg leading-relaxed text-blue-900 font-medium">
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
                          className={`bg-white border rounded-xl p-6 hover-lift transition-all duration-300 animate-slide-in-right ${
                            isSelected ? 'border-green-300' : 'border-gray-200'
                          }`}
                          style={{ animationDelay: `${paperIndex * 0.1}s` }}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-gray-900 mb-3 leading-tight">
                                {paper.title}
                              </h3>
                              <div className="flex items-center text-sm text-gray-600 mb-3">
                                <div className="flex items-center">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                                  <span className="font-medium">{paper.authors.join(', ')}</span>
                                </div>
                                <span className="mx-2">•</span>
                                <span className="font-semibold">{paper.year}</span>
                              </div>
                              
                              {/* Supporting Quote or Abstract */}
                              {paper.supportingQuote ? (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                                  <p className="text-sm text-green-800 font-medium mb-1">Supporting Evidence:</p>
                                  <p className="text-green-700 text-sm italic">"{paper.supportingQuote}"</p>
                                </div>
                              ) : (
                                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                                  {paper.abstract}
                                </p>
                              )}
                            </div>
                            
                            {/* Paper Actions */}
                            <div className="flex flex-col items-end space-y-3 ml-4">
                              {/* Checkbox */}
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => onPaperSelection?.(paper, e.target.checked)}
                                  className="w-6 h-6 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 hover:bg-blue-50 transition-colors"
                                  title={isSelected ? "Remove from references" : "Add to references"}
                                />
                                <span className="text-sm text-gray-600">
                                  {isSelected ? "✓ Selected" : "Select for references"}
                                </span>
                              </div>
                              
                              <div className="w-px h-6 bg-gray-300"></div>
                              
                              {/* Link Button */}
                              {paper.url && (
                                <a
                                  href={paper.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-colors"
                                >
                                  {paper.url.includes('doi.org') ? 'DOI Link' : 'Open Link'}
                                </a>
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
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Search className="w-6 h-6 text-gray-400" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-700 mb-2">No Supporting Papers Found</h4>
                    <p className="text-gray-600 text-sm">
                      We couldn't find academic papers that strongly support this statement. Try rephrasing or adding more context.
                    </p>
                  </div>
                )
              }
            })()}
          </div>
        ))}
        
        {/* Show message if no papers found at all */}
        {filteredPapers.length === 0 && papers.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p className="text-yellow-800 text-sm">
              <strong>Note:</strong> Found {papers.length} papers, but none meet the 60% similarity threshold for quality academic citations. 
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