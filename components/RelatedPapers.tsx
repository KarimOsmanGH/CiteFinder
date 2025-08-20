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
  // Filter papers to only show those with 60% or higher similarity
  const filteredPapers = papers.filter(paper => paper.similarity >= 60)
  
  // Allow up to 9 papers total (3 per statement) for free users
  const limitedPapers = filteredPapers.slice(0, 9)
  
  if (filteredPapers.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Search className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No High-Quality Matches Found</h3>
        <p className="text-gray-600">
          {papers.length > 0 
            ? `Found ${papers.length} papers, but none meet the 60% similarity threshold for quality matches.`
            : 'No related papers were found in the academic databases'
          }
        </p>
        {filteredPapers.length > 9 && (
          <p className="text-gray-500 text-sm mt-2">
            Free users can see up to 9 papers (3 per statement). Upgrade to Premium for unlimited access.
          </p>
        )}
      </div>
    )
  }

  // Group papers by their actual statements
  const papersByStatement = statementsFound.length > 0 
    ? statementsFound.map((statement) => {
        // Find papers that are actually associated with this statement
        const statementPapers = limitedPapers.filter(paper => paper.statement === statement)
        
        return {
          statement,
          papers: statementPapers
        }
      }).filter(group => group.papers.length > 0)
    : [{ statement: 'Related Papers', papers: limitedPapers }]

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
      {/* Statement Groups */}
      {papersByStatement.map((group, groupIndex) => (
        <div key={groupIndex} className="space-y-4">
          {/* Statement Header */}
          <div className="relative overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 shadow-sm">
            <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br from-blue-400 to-indigo-400 opacity-10 rounded-full" aria-hidden="true"></div>
            <div className="flex items-start">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mr-3" aria-hidden="true">
                <span className="text-white text-sm font-bold">{groupIndex + 1}</span>
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-blue-900 tracking-wide uppercase">Statement</h3>
                <p className="mt-1 text-lg leading-relaxed text-blue-900 font-medium">
                  {group.statement}
                </p>
              </div>
            </div>
          </div>
          
          {/* Papers for this statement */}
          <div className="space-y-4">
            {group.papers.map((paper, index) => {
              const isSelected = selectedPapers.some(p => p.id === paper.id)
              return (
                <div
                  key={paper.id}
                  className={`bg-white border rounded-xl p-6 hover-lift transition-all duration-300 animate-slide-in-right ${
                    isSelected ? 'border-green-300' : 'border-gray-200'
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
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
                    </div>
                    <div className="flex items-center ml-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        paper.similarity >= 80 ? 'bg-gradient-to-br from-green-400 to-green-600' :
                        paper.similarity >= 60 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                        'bg-gradient-to-br from-red-400 to-red-600'
                      }`}>
                        <Star className="w-5 h-5 text-white" />
                      </div>
                      <div className="ml-3 text-right">
                        <span className={`text-lg font-bold ${
                          paper.similarity >= 80 ? 'text-green-700' :
                          paper.similarity >= 60 ? 'text-orange-700' :
                          'text-red-700'
                        }`}>
                          {Math.round(paper.similarity)}%
                        </span>
                        <p className="text-xs text-gray-500">match</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Supporting Quote */}
                  {paper.supportingQuote ? (
                    <div className="mb-6">
                      <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-green-800 mb-1">Supporting Evidence</p>
                            <p className="text-sm text-green-700 italic leading-relaxed">
                              "{paper.supportingQuote}"
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-700 mb-6 leading-relaxed line-clamp-3">
                      {paper.abstract}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Selection Checkbox - Made more prominent */}
                      {onPaperSelection && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => onPaperSelection({ ...paper, statement: group.statement }, !isSelected)}
                            className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                              isSelected 
                                ? 'bg-green-500 border-green-500 text-white' 
                                : 'border-gray-400 hover:border-green-500 hover:bg-green-50'
                            }`}
                            title={isSelected ? "Deselect paper" : "Select paper for references"}
                          >
                            {isSelected && (
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>
                          <span className={`text-sm font-medium ${isSelected ? 'text-green-700' : 'text-gray-600'}`}>
                            {isSelected ? '✓ Selected' : 'Select for references'}
                          </span>
                        </div>
                      )}
                      
                      <div className="w-px h-6 bg-gray-300"></div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-2 ${
                            paper.similarity >= 80 ? 'bg-green-500' :
                            paper.similarity >= 60 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}></div>
                          <span className={`text-sm font-medium ${
                            paper.similarity >= 80 ? 'text-green-700' :
                            paper.similarity >= 60 ? 'text-orange-700' :
                            'text-red-700'
                          }`}>
                            Similarity: {Math.round(paper.similarity)}%
                          </span>
                        </div>
                        <div className="w-px h-4 bg-gray-300"></div>
                        <span className="text-sm text-gray-500">
                          {paper.id.startsWith('arxiv') ? 'arXiv' : 
                           paper.id.startsWith('openalex') ? 'OpenAlex' :
                           paper.id.startsWith('crossref') ? 'CrossRef' :
                           paper.id.startsWith('pubmed') ? 'PubMed' : 'Academic DB'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {/* Only show a single DOI Link button when a DOI URL is available */}
                      {paper.url && paper.url.includes('doi.org') && (
                        <a
                          href={paper.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 hover-lift"
                          title={`Open DOI: ${paper.url}`}
                        >
                          DOI Link
                          <ExternalLink className="w-4 h-4 ml-2" />
                        </a>
                      )}

                      {/* Fallback: if no DOI, show a single generic link when available */}
                      {!((paper.url && paper.url.includes('doi.org'))) && paper.url && paper.url !== '#' && (
                        <a
                          href={paper.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 hover-lift"
                          title={`Open: ${paper.url}`}
                        >
                          Open Link
                          <ExternalLink className="w-4 h-4 ml-2" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
} 