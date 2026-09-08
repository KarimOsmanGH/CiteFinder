'use client'

import { ExternalLink, Search, AlertCircle, BookOpen } from 'lucide-react'
import { RelatedPaper } from '@/types'
import { SIMILARITY_THRESHOLDS } from '@/lib/constants'
import { extractSupportingQuote } from '@/lib/utils'

interface RelatedPapersProps {
  papers: RelatedPaper[]
  statementsFound?: string[]
  selectedPapers?: RelatedPaper[]
  onPaperSelection?: (paper: RelatedPaper, isSelected: boolean) => void
}

export default function RelatedPapers({ 
  papers, 
  statementsFound = [], 
  selectedPapers = [], 
  onPaperSelection, 
}: RelatedPapersProps) {
  const filteredPapers = papers
    .filter(paper => paper.similarity >= SIMILARITY_THRESHOLDS.MIN_DISPLAY)
    .sort((a, b) => b.similarity - a.similarity)

  const generalPapers = filteredPapers.filter(paper => !paper.statement)
  
  if (filteredPapers.length > 0 || statementsFound.length === 0) {
    return (
      <div className="space-y-8">
        {statementsFound.map((statement, index) => (
          <StatementSection
            key={index}
            statement={statement}
            index={index}
            papers={filteredPapers.filter(paper => paper.statement === statement)}
            selectedPapers={selectedPapers}
            onPaperSelection={onPaperSelection}
          />
        ))}

        {generalPapers.length > 0 && (
          <GeneralPapersSection
            papers={generalPapers}
            selectedPapers={selectedPapers}
            onPaperSelection={onPaperSelection}
          />
        )}
        
        {filteredPapers.length === 0 && papers.length > 0 && (
          <div className="rounded-2xl border border-brass/30 bg-brass/10 p-6 sm:p-8">
            <div className="mb-3 flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-brass-deep" aria-hidden="true" />
              <h3 className="text-lg font-semibold text-ink">Quality Threshold Not Met</h3>
            </div>
            <p className="text-sm text-ink-soft sm:text-base">
              Found {papers.length} papers, but none meet the {SIMILARITY_THRESHOLDS.MIN_DISPLAY}% similarity threshold for quality academic citations. 
              The statements above were extracted from your content and may need additional research.
            </p>
          </div>
        )}
      </div>
    )
  }
  
  return (
    <div className="py-12 text-center sm:py-16">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-mist sm:h-20 sm:w-20">
        <Search className="h-8 w-8 text-ink-muted sm:h-10 sm:w-10" aria-hidden="true" />
      </div>
      <h3 className="mb-3 text-xl font-semibold text-ink sm:text-2xl">No High-Quality Matches Found</h3>
      <p className="text-base text-ink-muted sm:text-lg">
        {papers.length > 0 
          ? `Found ${papers.length} papers, but none meet the ${SIMILARITY_THRESHOLDS.MIN_DISPLAY}% similarity threshold.`
          : 'No related papers were found in the academic databases.'
        }
      </p>
    </div>
  )
}

interface StatementSectionProps {
  statement: string
  index: number
  papers: RelatedPaper[]
  selectedPapers: RelatedPaper[]
  onPaperSelection?: (paper: RelatedPaper, isSelected: boolean) => void
}

function StatementSection({ statement, index, papers, selectedPapers, onPaperSelection }: StatementSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-ink text-sm font-bold text-white">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h3 className="font-display text-base font-semibold tracking-tight text-ink sm:text-lg">
              Statement {index + 1}
            </h3>
            <span className="text-xs text-ink-muted sm:text-sm">
              {papers.length} supporting paper{papers.length !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-sm leading-relaxed text-ink-soft sm:text-base">
            {statement}
          </p>
        </div>
      </div>
      
      {papers.length > 0 ? (
        <PapersTable 
          papers={papers}
          statement={statement}
          selectedPapers={selectedPapers}
          onPaperSelection={onPaperSelection}
        />
      ) : (
        <div className="rounded-xl border border-ink/10 bg-mist-soft px-4 py-6 text-center">
          <p className="text-sm text-ink-muted">
            No strongly supporting papers found for this statement.
          </p>
        </div>
      )}
    </div>
  )
}

interface GeneralPapersSectionProps {
  papers: RelatedPaper[]
  selectedPapers: RelatedPaper[]
  onPaperSelection?: (paper: RelatedPaper, isSelected: boolean) => void
}

function GeneralPapersSection({ papers, selectedPapers, onPaperSelection }: GeneralPapersSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-teal text-white">
          <BookOpen className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <h3 className="font-display text-base font-semibold tracking-tight text-ink sm:text-lg">
            General Supporting Papers
          </h3>
          <p className="text-sm text-ink-muted">
            Relevant papers not matched to a specific statement
          </p>
        </div>
      </div>

      <PapersTable 
        papers={papers}
        selectedPapers={selectedPapers}
        onPaperSelection={onPaperSelection}
      />
    </div>
  )
}

interface PapersTableProps {
  papers: RelatedPaper[]
  statement?: string
  selectedPapers: RelatedPaper[]
  onPaperSelection?: (paper: RelatedPaper, isSelected: boolean) => void
}

function PapersTable({ papers, statement, selectedPapers, onPaperSelection }: PapersTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-ink/10 bg-surface">
      <div className="hidden border-b border-ink/10 bg-mist px-4 py-3 text-sm font-semibold text-ink md:grid md:grid-cols-12">
        <div className="col-span-1 flex items-center justify-center">Select</div>
        <div className="col-span-5">Title</div>
        <div className="col-span-2 text-center">Year</div>
        <div className="col-span-2 text-center">Match</div>
        <div className="col-span-2 text-center">Actions</div>
      </div>
      
      <div className="max-h-[600px] overflow-y-auto">
        {papers.map((paper) => {
          const isSelected = selectedPapers.some(p => p.id === paper.id)
          const supportingQuote = paper.supportingQuote || 
            (statement ? extractSupportingQuote(statement, paper.abstract) : undefined)
          
          return (
            <div
              key={paper.id}
              className={`border-b border-ink/8 transition-colors last:border-b-0 ${
                isSelected ? 'bg-mist-soft' : 'hover:bg-mist-soft/60'
              }`}
            >
              <div className="hidden items-center gap-4 px-4 py-4 md:grid md:grid-cols-12">
                <div className="col-span-1 flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => onPaperSelection?.(paper, e.target.checked)}
                    className="h-5 w-5 cursor-pointer rounded border-2 border-ink/20 text-teal focus:ring-2 focus:ring-teal/40"
                    aria-label={isSelected ? `Remove ${paper.title} from references` : `Add ${paper.title} to references`}
                  />
                </div>
                
                <div className="col-span-5">
                  <h4 className="line-clamp-3 text-sm font-semibold leading-tight text-ink">
                    {paper.title}
                  </h4>
                </div>
                
                <div className="col-span-2 text-center">
                  <span className="inline-block rounded bg-mist px-2 py-1 text-xs font-semibold text-ink">
                    {paper.year}
                  </span>
                </div>
                
                <div className="col-span-2 text-center">
                  <span className="inline-block rounded bg-mist-deep px-2 py-1 text-xs font-bold text-ink">
                    {paper.similarity}%
                  </span>
                </div>
                
                <div className="col-span-2 flex justify-center gap-2">
                  {paper.url && (
                    <a
                      href={paper.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center rounded border border-teal/20 bg-mist px-3 py-1 text-xs font-medium text-teal transition-colors hover:bg-mist-deep"
                    >
                      <ExternalLink className="mr-1 h-3 w-3" aria-hidden="true" />
                      View
                    </a>
                  )}
                </div>
              </div>
              
              <div className="space-y-3 p-4 md:hidden">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => onPaperSelection?.(paper, e.target.checked)}
                    className="mt-1 h-5 w-5 flex-shrink-0 cursor-pointer rounded border-2 border-ink/20 text-teal focus:ring-2 focus:ring-teal/40"
                    aria-label={isSelected ? `Remove ${paper.title} from references` : `Add ${paper.title} to references`}
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="mb-2 text-sm font-semibold leading-tight text-ink">
                      {paper.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-block rounded bg-mist px-2 py-1 text-xs font-semibold text-ink">
                        {paper.year}
                      </span>
                      <span className="inline-block rounded bg-mist-deep px-2 py-1 text-xs font-bold text-ink">
                        {paper.similarity}% match
                      </span>
                    </div>
                  </div>
                </div>
                
                {supportingQuote && (
                  <div className="rounded-lg border border-teal/20 bg-mist-soft p-3">
                    <p className="mb-1 text-xs font-semibold text-teal">Evidence</p>
                    <p className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-ink-soft">
                      {supportingQuote}
                    </p>
                  </div>
                )}
                
                {paper.url && (
                  <div className="flex justify-end">
                    <a
                      href={paper.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center rounded border border-teal/20 bg-mist px-3 py-2 text-xs font-medium text-teal transition-colors hover:bg-mist-deep"
                    >
                      <ExternalLink className="mr-1 h-3 w-3" aria-hidden="true" />
                      {paper.url.includes('doi.org') ? 'View DOI' : 'Open Paper'}
                    </a>
                  </div>
                )}
              </div>
              
              {supportingQuote && (
                <div className="hidden px-4 pb-4 pt-0 md:block">
                  <div className="rounded-lg border border-teal/20 bg-mist-soft p-3">
                    <p className="mb-1 text-xs font-semibold text-teal">Supporting Evidence</p>
                    <p className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-ink-soft">
                      {supportingQuote}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
