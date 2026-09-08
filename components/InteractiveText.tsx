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
      <div className="bg-surface border border-ink/10 rounded-xl p-6 text-center">
        <p className="text-ink-muted">No statements were extracted from this document.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-surface border border-ink/10 rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-ink rounded-lg flex items-center justify-center">
              <Search className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-lg font-display font-semibold text-ink">Contextual Statement View</h3>
              <p className="text-sm text-ink-muted">Review each extracted claim with nearby context</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 max-h-[28rem] overflow-y-auto pr-1">
          {sortedStatements.map((statement, index) => {
            const supportingPapers = relatedPapers.filter(paper => paper.statement === statement.text)
            
            return (
              <article
                key={`${statement.text.slice(0, 20)}-${statement.startIndex}-${index}`}
                className="border border-ink/10 rounded-xl p-4 bg-surface"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-mist text-ink font-semibold flex items-center justify-center">
                      {index + 1}
                    </div>
                    <span className="text-sm font-semibold text-ink tracking-wide">
                      Statement {index + 1}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-ink-muted">
                    {supportingPapers.length} supporting paper{supportingPapers.length === 1 ? '' : 's'}
                  </div>
                </div>

                <div className="rounded-lg border border-ink/10 bg-mist-soft p-3">
                  <p className="text-sm leading-relaxed text-ink-soft">
                    {statement.contextBefore && <span>{statement.contextBefore}</span>}
                    <mark className="rounded bg-brass/25 px-1 py-0.5 font-semibold text-ink">
                      {statement.text}
                    </mark>
                    {statement.contextAfter && <span>{statement.contextAfter}</span>}
                  </p>
                </div>

                {supportingPapers.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-teal">
                      <CheckCircle className="w-4 h-4" aria-hidden="true" />
                      Top supporting papers
                    </div>
                    {supportingPapers.slice(0, 3).map((paper) => (
                      <div key={paper.id} className="rounded-lg border border-teal/20 bg-mist-soft p-3">
                        <p className="text-sm font-semibold text-ink">{paper.title}</p>
                        <p className="text-xs text-ink-muted">
                          {paper.authors.join(', ')} • {paper.year} • {paper.similarity}% match
                        </p>
                        {paper.url && (
                          <a
                            href={paper.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center text-xs text-teal hover:underline"
                          >
                            <ExternalLink className="w-3 h-3 mr-1" aria-hidden="true" />
                            View paper
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 flex items-center gap-2 text-sm text-ink-muted">
                    <CheckCircle className="h-4 w-4 text-ink-muted/60" aria-hidden="true" />
                    No supporting papers found yet
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </div>
    </div>
  )
}
