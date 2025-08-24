'use client'

import React, { useState } from 'react'
import { Search, ExternalLink, CheckCircle } from 'lucide-react'
import { RelatedPaper, StatementWithPosition } from '@/types'

interface InteractiveTextProps {
  originalText: string
  statementsWithPositions: StatementWithPosition[]
  relatedPapers: RelatedPaper[]
  onPaperSelection?: (paper: RelatedPaper, isSelected: boolean) => void
  selectedPapers?: RelatedPaper[]
  onStatementSelect?: (statement: StatementWithPosition | null) => void
  selectedStatement?: StatementWithPosition | null
}

export default function InteractiveText({
  originalText,
  statementsWithPositions,
  relatedPapers,
  onPaperSelection,
  selectedPapers = [],
  onStatementSelect,
  selectedStatement
}: InteractiveTextProps) {
  // Sort statements by position to avoid overlapping highlights
  const sortedStatements = [...statementsWithPositions].sort((a, b) => a.startIndex - b.startIndex)
  
  // Create a map to get the correct statement number based on position in text
  const statementToNumber = new Map()
  sortedStatements.forEach((statement, index) => {
    statementToNumber.set(statement.text, index + 1)
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
      
      // Get the correct statement number (1-based index from position in text)
      const statementNumber = statementToNumber.get(statement.text)

      segments.push(
        <span
          key={`statement-${index}`}
          className={`inline px-1 py-0.5 rounded cursor-pointer transition-all duration-200 font-semibold ${
            selectedStatement?.text === statement.text
              ? 'bg-green-200 hover:bg-green-300 border-2 border-green-500 text-gray-900 shadow-md'
              : papersForStatement.length > 0
              ? 'bg-blue-100 hover:bg-blue-200 border border-blue-400 text-gray-900'
              : 'bg-gray-200 hover:bg-gray-300 border border-gray-400 text-gray-700'
          }`}
          onClick={() => {
            console.log('Statement clicked:', statement.text)
            console.log('Papers for statement:', papersForStatement.length)
            
            if (papersForStatement.length === 0) {
              alert('No supporting papers found for this statement.')
              return
            }
            
            // Toggle selection - if already selected, deselect it
            if (selectedStatement?.text === statement.text) {
              onStatementSelect?.(null)
            } else {
              onStatementSelect?.(statement)
            }
          }}
          title={
            papersForStatement.length > 0
              ? `Statement ${statementNumber}: ${papersForStatement.length} supporting paper${papersForStatement.length > 1 ? 's' : ''} available - Click to view papers`
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
        </div>
        

        
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
    </div>
  )
} 