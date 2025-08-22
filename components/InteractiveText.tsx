'use client'

import React, { useState } from 'react'
import { Search, ExternalLink } from 'lucide-react'

interface StatementWithPosition {
  text: string
  startIndex: number
  endIndex: number
  confidence: number
}

interface RelatedPaper {
  id: string
  title: string
  authors: string[]
  year: string
  abstract: string
  url?: string
  similarity: number
  supportingQuote?: string
  statement?: string
}

interface InteractiveTextProps {
  originalText: string
  statementsWithPositions: StatementWithPosition[]
  relatedPapers: RelatedPaper[]
  onPaperSelection?: (paper: RelatedPaper, isSelected: boolean) => void
  selectedPapers?: RelatedPaper[]
}

export default function InteractiveText({
  originalText,
  statementsWithPositions,
  relatedPapers,
  onPaperSelection,
  selectedPapers = []
}: InteractiveTextProps) {
  const [selectedStatement, setSelectedStatement] = useState<StatementWithPosition | null>(null)
  const [showModal, setShowModal] = useState(false)

  // Sort statements by position to avoid overlapping highlights
  const sortedStatements = [...statementsWithPositions].sort((a, b) => a.startIndex - b.startIndex)

  // Function to render text with highlighted statements
  const renderTextWithHighlights = () => {
    if (sortedStatements.length === 0) {
      return (
        <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
          {originalText}
        </div>
      )
    }

    const segments: JSX.Element[] = []
    let lastIndex = 0

    sortedStatements.forEach((statement, index) => {
      // Add text before the statement
      if (statement.startIndex > lastIndex) {
        const beforeText = originalText.slice(lastIndex, statement.startIndex)
        segments.push(
          <span key={`before-${index}`} className="whitespace-pre-wrap">
            {beforeText}
          </span>
        )
      }

      // Add the highlighted statement
      const statementText = originalText.slice(statement.startIndex, statement.endIndex)
      const papersForStatement = relatedPapers.filter(paper => 
        paper.statement === statement.text || 
        (paper.similarity >= 30 && !paper.statement) // Fallback for papers without statement
      )

      segments.push(
        <span
          key={`statement-${index}`}
          className={`inline-block px-2 py-1 rounded-md cursor-pointer transition-all duration-200 font-medium ${
            papersForStatement.length > 0
              ? 'bg-yellow-200 hover:bg-yellow-300 border-2 border-yellow-400 text-gray-900 shadow-sm'
              : 'bg-gray-200 hover:bg-gray-300 border-2 border-gray-400 text-gray-700'
          }`}
          onClick={() => {
            console.log('Statement clicked:', statement.text)
            console.log('Papers for statement:', papersForStatement.length)
            if (papersForStatement.length > 0) {
              setSelectedStatement(statement)
              setShowModal(true)
            } else {
              alert('No supporting papers found for this statement.')
            }
          }}
          title={
            papersForStatement.length > 0
              ? `Click to view ${papersForStatement.length} supporting paper${papersForStatement.length > 1 ? 's' : ''}`
              : 'No supporting papers found'
          }
        >
          <span className="whitespace-pre-wrap">{statementText}</span>
          {papersForStatement.length > 0 && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 text-xs font-bold bg-blue-600 text-white rounded-full">
              {papersForStatement.length}
            </span>
          )}
        </span>
      )

      lastIndex = statement.endIndex
    })

    // Add remaining text after the last statement
    if (lastIndex < originalText.length) {
      const afterText = originalText.slice(lastIndex)
      segments.push(
        <span key="after" className="whitespace-pre-wrap">
          {afterText}
        </span>
      )
    }

    return segments
  }

  const getPapersForStatement = (statement: StatementWithPosition) => {
    const papers = relatedPapers.filter(paper => 
      paper.statement === statement.text || 
      (paper.similarity >= 30 && !paper.statement)
    )
    console.log('Papers for statement:', statement.text.substring(0, 50))
    console.log('Total papers:', relatedPapers.length)
    console.log('Filtered papers:', papers.length)
    console.log('Paper details:', papers.map(p => ({ title: p.title.substring(0, 30), similarity: p.similarity, statement: p.statement?.substring(0, 30) })))
    return papers
  }

  return (
    <div className="space-y-6 w-full">
      {/* Interactive Text Display */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Document Analysis</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Search className="w-4 h-4" />
            <span>{statementsWithPositions.length} statements detected</span>
          </div>
        </div>
        
        <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-white w-full">
          <div className="text-sm leading-relaxed text-gray-900 w-full">
            {renderTextWithHighlights()}
          </div>
        </div>
        
        <div className="mt-3 text-xs text-gray-500">
          💡 Click on highlighted statements to view supporting academic papers
        </div>
      </div>

      {/* Papers Modal */}
      {showModal && selectedStatement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Supporting Papers</h3>
                <p className="text-sm text-gray-600 mt-1">Statement: "{selectedStatement.text}"</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {(() => {
                const papers = getPapersForStatement(selectedStatement)
                if (papers.length === 0) {
                  return (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Supporting Papers Found</h3>
                      <p className="text-gray-600">
                        We couldn't find academic papers that strongly support this statement. Try rephrasing or adding more context.
                      </p>
                    </div>
                  )
                }

                return (
                  <div className="space-y-4">
                    {papers.map((paper) => {
                      const isSelected = selectedPapers.some(p => p.id === paper.id)
                      return (
                        <div
                          key={paper.id}
                          className={`border rounded-lg p-4 transition-colors ${
                            isSelected ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 mb-2">{paper.title}</h4>
                              <div className="flex items-center text-sm text-gray-600 mb-2">
                                <span className="font-medium">{paper.authors.join(', ')}</span>
                                <span className="mx-2">•</span>
                                <span>{paper.year}</span>
                                <span className="mx-2">•</span>
                                <span className="text-blue-600">{paper.similarity}% match</span>
                              </div>
                              
                              {paper.supportingQuote ? (
                                <div className="bg-green-50 border border-green-200 rounded p-3 mb-3">
                                  <p className="text-sm text-green-800 font-medium mb-1">Supporting Evidence:</p>
                                  <p className="text-sm text-green-700 italic">"{paper.supportingQuote}"</p>
                                </div>
                              ) : (
                                <p className="text-sm text-gray-600 mb-3">{paper.abstract}</p>
                              )}
                            </div>
                            
                            <div className="flex flex-col items-end space-y-2 ml-4">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => onPaperSelection?.(paper, e.target.checked)}
                                  className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-600">
                                  {isSelected ? "Selected" : "Select"}
                                </span>
                              </div>
                              
                              {paper.url && (
                                <a
                                  href={paper.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center px-3 py-1 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                                >
                                  <ExternalLink className="w-3 h-3 mr-1" />
                                  View
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 