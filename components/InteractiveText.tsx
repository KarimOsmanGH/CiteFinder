'use client'

import { ExternalLink } from 'lucide-react'
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
      <p className="text-center text-ink-muted">No statements were extracted from this document.</p>
    )
  }

  return (
    <div className="max-h-[28rem] space-y-5 overflow-y-auto pr-1">
      {sortedStatements.map((statement, index) => {
        const supportingPapers = relatedPapers.filter(paper => paper.statement === statement.text)
        const topPapers = supportingPapers.slice(0, 3)

        return (
          <div
            key={`${statement.text.slice(0, 20)}-${statement.startIndex}-${index}`}
            className="border-b border-ink/10 pb-5 last:border-b-0 last:pb-0"
          >
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <h3 className="text-sm font-semibold text-ink">
                Statement {index + 1}
              </h3>
              <span className="shrink-0 text-xs text-ink-muted">
                {supportingPapers.length} paper{supportingPapers.length === 1 ? '' : 's'}
              </span>
            </div>

            <p className="text-sm leading-relaxed text-ink-soft">
              {statement.contextBefore && <span className="text-ink-muted">{statement.contextBefore}</span>}
              <mark className="rounded bg-brass/25 px-1 py-0.5 font-semibold text-ink">
                {statement.text}
              </mark>
              {statement.contextAfter && <span className="text-ink-muted">{statement.contextAfter}</span>}
            </p>

            {topPapers.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {topPapers.map((paper) => (
                  <li key={paper.id} className="flex items-start gap-2 text-xs text-ink-muted">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-teal" aria-hidden="true" />
                    <span className="min-w-0">
                      {paper.url ? (
                        <a
                          href={paper.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-medium text-teal hover:underline"
                        >
                          <span className="line-clamp-1">{paper.title}</span>
                          <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                        </a>
                      ) : (
                        <span className="line-clamp-1 font-medium text-ink-soft">{paper.title}</span>
                      )}
                      <span className="text-ink-muted"> · {paper.year} · {paper.similarity}%</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      })}
    </div>
  )
}
