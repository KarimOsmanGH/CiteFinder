'use client'

import React, { useState } from 'react'
import { Search, ExternalLink, CheckCircle } from 'lucide-react'

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

  // Sort statements by position to avoid overlapping highlights, but keep original order for numbering
  const sortedStatements = [...statementsWithPositions].sort((a, b) => a.startIndex - b.startIndex)
  
  // Create a map to get the original index for numbering
  const statementToOriginalIndex = new Map()
  statementsWithPositions.forEach((statement, originalIndex) => {
    statementToOriginalIndex.set(statement.text, originalIndex)
  })

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
      const papersForStatement = getPapersForStatement(statement)
      
      // Get the correct statement number (1-based index from original array)
      const statementNumber = statementToOriginalIndex.get(statement.text) + 1

      segments.push(
        <span
          key={`statement-${index}`}
          className={`inline px-1 py-0.5 rounded cursor-pointer transition-all duration-200 font-semibold ${
            papersForStatement.length > 0
              ? 'bg-blue-100 hover:bg-blue-200 border border-blue-400 text-gray-900'
              : 'bg-gray-200 hover:bg-gray-300 border border-gray-400 text-gray-700'
          }`}
          onClick={() => {
            console.log('Statement clicked:', statement.text)
            console.log('Papers for statement:', papersForStatement.length)
            if (papersForStatement.length > 0) {
              setSelectedStatement(statement)
            } else {
              alert('No supporting papers found for this statement.')
            }
          }}
          title={
            papersForStatement.length > 0
              ? `Statement ${statementNumber}: Click to view ${papersForStatement.length} supporting paper${papersForStatement.length > 1 ? 's' : ''}`
              : `Statement ${statementNumber}: No supporting papers found`
          }
        >
          <span className="whitespace-pre-wrap">
            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-blue-600 text-white rounded-full mr-1">
              {statementNumber}
            </span>
            {statementText}
          </span>
          {papersForStatement.length > 0 && (
            <span className="ml-1 inline-flex items-center px-1.5 py-0.5 text-xs font-bold bg-blue-600 text-white rounded-full">
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
    // Use the same matching logic as RelatedPapers component
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
    <div className="space-y-6">
      {/* Statements Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Interactive PDF View</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Search className="w-4 h-4" />
            <span>{statementsWithPositions.length} statements detected</span>
          </div>
        </div>
        
        {/* Statement List */}
        {statementsWithPositions.length > 0 && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-medium text-blue-800 mb-3">📋 Statements with in-text citations:</p>
            <div className="space-y-2">
              {statementsWithPositions.map((statement, index) => {
                const papersForStatement = getPapersForStatement(statement)
                return (
                  <div key={index} className="flex items-start text-sm">
                    <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-blue-600 text-white rounded-full mr-3 flex-shrink-0">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <span className="text-gray-800 leading-relaxed">{statement.text}</span>
                      <div className="flex items-center mt-1">
                        <span className="text-xs text-blue-600 font-medium">
                          {papersForStatement.length} supporting paper{papersForStatement.length !== 1 ? 's' : ''}
                        </span>
                        {papersForStatement.length > 0 && (
                          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 text-xs font-bold bg-green-100 text-green-800 rounded-full">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Papers found
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        
        <div className="max-h-96 overflow-y-auto border border-gray-300 rounded-lg bg-gray-50 w-full">
          <div className="p-6 bg-white mx-4 my-4 shadow-sm border border-gray-200">
            {/* PDF-like header */}
            <div className="border-b border-gray-300 pb-2 mb-4">
              <div className="text-xs text-gray-500 font-mono">Interactive PDF View - Click highlighted statements</div>
            </div>
            <div className="font-mono text-sm leading-6 text-gray-800 w-full max-w-none">
              {renderTextWithHighlights()}
            </div>
          </div>
        </div>
        
        <div className="mt-3 text-xs text-gray-500">
          💡 Click on highlighted statements to view supporting academic papers
        </div>
      </div>

      {/* Supporting Papers Section */}
      {selectedStatement && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Supporting Papers</h3>
              <p className="text-sm text-gray-600 mt-1">Selected statement: "{selectedStatement.text}"</p>
            </div>
            <button
              onClick={() => setSelectedStatement(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors text-sm"
            >
              ✕ Close
            </button>
          </div>
          
          <div className="space-y-4">
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
                        className={`border-2 rounded-lg p-4 transition-colors ${
                          isSelected ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white hover:border-blue-300'
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
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                                {paper.similarity}% match
                              </span>
                            </div>
                            
                            {paper.supportingQuote ? (
                              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4 mb-3">
                                <div className="flex items-center mb-2">
                                  <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                                  <p className="text-sm font-bold text-green-800">Supporting Evidence</p>
                                </div>
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
                                className="w-5 h-5 text-green-600 bg-white border-2 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                              />
                              <span className="text-sm text-gray-600">
                                {isSelected ? (
                                  <span className="text-green-700 flex items-center">
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Selected
                                  </span>
                                ) : (
                                  "Select"
                                )}
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
      )}
    </div>
  )
} 