'use client'

import { CheckCircle, AlertCircle } from 'lucide-react'

interface Citation {
  id: string
  text: string
  authors?: string
  year?: string
  title?: string
  confidence: number
}

interface CitationListProps {
  citations: Citation[]
  searchMode?: 'pdf' | 'text'
  topicsFound?: string[]
  existingCitationsCount?: number
  discoveredCitationsCount?: number
}

export default function CitationList({ 
  citations, 
  searchMode = 'pdf',
  topicsFound = [],
  existingCitationsCount = 0,
  discoveredCitationsCount = 0
}: CitationListProps) {
  if (citations.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Citations Found</h3>
        <p className="text-gray-600">
          {searchMode === 'pdf' 
            ? 'No citations were detected in the uploaded PDF'
            : 'No citations were detected in the entered text'
          }
        </p>
      </div>
    )
  }

  // Separate existing and discovered citations
  const existingCitations = citations.filter(c => c.id.startsWith('citation-'))
  const discoveredCitations = citations.filter(c => c.id.startsWith('discovered-'))

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Citations Found</h2>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="text-2xl font-bold text-blue-600">{existingCitations.length}</div>
          <div className="text-sm text-blue-700">Existing Citations</div>
        </div>
        <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
          <div className="text-2xl font-bold text-indigo-600">{discoveredCitations.length}</div>
          <div className="text-sm text-indigo-700">Discovered Papers</div>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
          <div className="text-2xl font-bold text-purple-600">{topicsFound.length}</div>
          <div className="text-sm text-purple-700">Statements Analyzed</div>
        </div>
      </div>

      {/* Topics Found */}
      {topicsFound.length > 0 && (
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 mb-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">Statements Analyzed</h3>
          <div className="space-y-3">
            {topicsFound.map((statement, index) => (
              <div
                key={index}
                className="bg-white/50 backdrop-blur-sm border border-blue-200 rounded-lg p-3 hover:bg-white/70 transition-all duration-200"
                title={statement}
              >
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-blue-900 leading-relaxed break-words whitespace-normal">
                      {statement}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Existing Citations */}
      {existingCitations.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-2">
              <span className="text-white text-xs font-bold">{existingCitations.length}</span>
            </div>
            Existing Citations
          </h3>
          <div className="space-y-4">
            {existingCitations.map((citation, index) => (
              <div
                key={citation.id}
                className="bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl p-6 hover-lift transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-gray-700">
                        Confidence: {Math.round(citation.confidence * 100)}%
                      </span>
                      <div className="w-24 h-2 bg-gray-200 rounded-full mt-1">
                        <div 
                          className="h-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                          style={{ width: `${citation.confidence * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  {citation.year && (
                    <span className="text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 px-3 py-1 rounded-full">
                      {citation.year}
                    </span>
                  )}
                </div>
                
                <p className="text-gray-900 mb-4 text-lg leading-relaxed">{citation.text}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {citation.authors && (
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-sm font-semibold text-blue-900 mb-1">Authors</p>
                      <p className="text-sm text-blue-700">{citation.authors}</p>
                    </div>
                  )}
                  
                  {citation.title && (
                    <div className="bg-purple-50 rounded-lg p-3">
                      <p className="text-sm font-semibold text-purple-900 mb-1">Title</p>
                      <p className="text-sm text-purple-700">{citation.title}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Discovered Papers */}
      {discoveredCitations.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center mr-2">
              <span className="text-white text-xs font-bold">{discoveredCitations.length}</span>
            </div>
            Related Papers Found
          </h3>
          <div className="space-y-4">
            {discoveredCitations.map((citation, index) => (
              <div
                key={citation.id}
                className="bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl p-6 hover-lift transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-gray-700">
                        Confidence: {Math.round(citation.confidence * 100)}%
                      </span>
                      <div className="w-24 h-2 bg-gray-200 rounded-full mt-1">
                        <div 
                          className="h-2 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500"
                          style={{ width: `${citation.confidence * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  {citation.year && (
                    <span className="text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-indigo-600 px-3 py-1 rounded-full">
                      {citation.year}
                    </span>
                  )}
                </div>
                
                <p className="text-gray-900 mb-4 text-lg leading-relaxed">{citation.text}</p>
                
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {citation.authors && (
                      <div className="bg-indigo-50 rounded-lg p-3">
                        <p className="text-sm font-semibold text-indigo-900 mb-1">Authors</p>
                        <p className="text-sm text-indigo-700">{citation.authors}</p>
                      </div>
                    )}
                    
                    {citation.title && (
                      <div className="bg-indigo-50 rounded-lg p-3">
                        <p className="text-sm font-semibold text-indigo-900 mb-1">Title</p>
                        <p className="text-sm text-indigo-700">{citation.title}</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Generated Citations */}
                  <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="text-sm font-semibold text-green-900 mb-2">Generated Citations:</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          <span className="font-medium text-green-800">APA:</span>
                          <span className="text-green-700 ml-2">{citation.authors} ({citation.year}). {citation.title}.</span>
                        </div>
                        <button 
                          onClick={() => navigator.clipboard.writeText(`${citation.authors} (${citation.year}). ${citation.title}.`)}
                          className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                        >
                          Copy
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          <span className="font-medium text-green-800">MLA:</span>
                          <span className="text-green-700 ml-2">{citation.authors}. "{citation.title}." {citation.year}.</span>
                        </div>
                        <button 
                          onClick={() => navigator.clipboard.writeText(`${citation.authors}. "${citation.title}." ${citation.year}.`)}
                          className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                        >
                          Copy
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          <span className="font-medium text-green-800">Chicago:</span>
                          <span className="text-green-700 ml-2">{citation.authors}. "{citation.title}." {citation.year}.</span>
                        </div>
                        <button 
                          onClick={() => navigator.clipboard.writeText(`${citation.authors}. "${citation.title}." ${citation.year}.`)}
                          className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 