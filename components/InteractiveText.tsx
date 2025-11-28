'use client'

import { Search, ExternalLink, CheckCircle } from 'lucide-react'
import { RelatedPaper, StatementWithPosition } from '@/types'

interface InteractiveTextProps {
  statementsWithPositions: StatementWithPosition[]
  relatedPapers: RelatedPaper[]
}

export default function InteractiveText({
  statementsWithPositions,
  relatedPapers
}: InteractiveTextProps) {
  const sortedStatements = [...statementsWithPositions].sort((a, b) => a.startIndex - b.startIndex)

  if (sortedStatements.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
        <p className="text-gray-600">No statements were extracted from this document.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Search className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Contextual Statement View</h3>
              <p className="text-sm text-gray-600">Review each extracted claim with nearby context</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 max-h-[28rem] overflow-y-auto pr-1">
          {sortedStatements.map((statement, index) => {
            const supportingPapers = relatedPapers.filter(paper => paper.statement === statement.text)
            const snippetAvailable = statement.contextBefore || statement.contextAfter || statement.snippet
            return (
              <div
                key={`${statement.text}-${statement.startIndex}-${index}`}
                className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 font-semibold flex items-center justify-center">
                      {index + 1}
                    </div>
                    <span className="text-sm font-semibold text-blue-800 uppercase tracking-wide">Statement {index + 1}</span>
                  </div>
                  <div className="text-sm font-medium text-gray-600">
                    {supportingPapers.length} supporting paper{supportingPapers.length === 1 ? '' : 's'}
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  {snippetAvailable ? (
                    <p className="text-sm text-gray-800 leading-relaxed">
                      {statement.contextBefore && <span>{statement.contextBefore}</span>}
                      <span className="bg-yellow-100 px-1 py-0.5 rounded text-gray-900 font-semibold">
                        {statement.text}
                      </span>
                      {statement.contextAfter && <span>{statement.contextAfter}</span>}
                      {!statement.contextBefore && !statement.contextAfter && statement.snippet && (
                        <span>{statement.snippet}</span>
                      )}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-800 leading-relaxed">{statement.text}</p>
                  )}
                </div>

                {supportingPapers.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-green-700">
                      <CheckCircle className="w-4 h-4" />
                      Top supporting papers
                    </div>
                    {supportingPapers.slice(0, 3).map((paper) => (
                      <div key={paper.id} className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-sm font-semibold text-green-900">{paper.title}</p>
                        <p className="text-xs text-green-700">
                          {paper.authors.join(', ')} • {paper.year} • {paper.similarity}% match
                        </p>
                        {paper.url && (
                          <a
                            href={paper.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-xs text-green-700 mt-2 hover:underline"
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            View paper
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 text-sm text-gray-500 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-gray-400" />
                    No supporting papers found yet
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}