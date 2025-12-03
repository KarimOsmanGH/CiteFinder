'use client'

import { ExternalLink, Search, CheckCircle, AlertCircle, BookOpen } from 'lucide-react'
import { useState, useMemo } from 'react'
import { RelatedPaper, StatementWithPosition } from '@/types'
import { SIMILARITY_THRESHOLDS } from '@/lib/constants'
import { extractKeyTermsFromStatement, extractSupportingQuote } from '@/lib/utils'

interface RelatedPapersProps {
  papers: RelatedPaper[]
  statementsFound?: string[]
  selectedPapers?: RelatedPaper[]
  onPaperSelection?: (paper: RelatedPaper, isSelected: boolean) => void
  selectedStatement?: StatementWithPosition | null
  onClearStatementSelection?: () => void
}

export default function RelatedPapers({ 
  papers, 
  statementsFound = [], 
  selectedPapers = [], 
  onPaperSelection, 
  selectedStatement, 
  onClearStatementSelection 
}: RelatedPapersProps) {
  const [sortBy, setSortBy] = useState<'similarity' | 'year' | 'title'>('similarity')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filterByStatement, setFilterByStatement] = useState<string>('all')
  const [showOnlySelected, setShowOnlySelected] = useState(false)
  
  // Filter papers with quality threshold
  const filteredPapers = papers.filter(paper => paper.similarity >= SIMILARITY_THRESHOLDS.MIN_DISPLAY)
  
  // Apply additional filters and sorting
  const processedPapers = useMemo(() => {
    let result = [...filteredPapers]
    
    if (selectedStatement) {
      result = result.filter(paper => paper.statement === selectedStatement.text)
    } else if (filterByStatement !== 'all') {
      result = result.filter(paper => paper.statement === filterByStatement)
    }
    
    if (showOnlySelected) {
      result = result.filter(paper => selectedPapers.some(p => p.id === paper.id))
    }
    
    result.sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'similarity':
          comparison = a.similarity - b.similarity
          break
        case 'year':
          comparison = parseInt(a.year) - parseInt(b.year)
          break
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })
    
    return result
  }, [filteredPapers, selectedStatement, filterByStatement, showOnlySelected, selectedPapers, sortBy, sortOrder])
  
  const limitedPapers = processedPapers
  const generalPapers = limitedPapers.filter(paper => !paper.statement)
  
  if (limitedPapers.length > 0 || statementsFound.length === 0) {
    return (
      <div className="space-y-8">
        {/* Selected Statement Indicator */}
        {selectedStatement && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="w-6 h-6 text-green-600 mr-3" aria-hidden="true" />
                <div>
                  <h4 className="text-lg font-bold text-green-800">Selected Statement</h4>
                  <p className="text-green-700 text-sm mt-1">Showing papers that support this statement</p>
                </div>
              </div>
              <button
                onClick={onClearStatementSelection}
                className="px-3 py-1 text-sm bg-green-100 hover:bg-green-200 text-green-800 rounded-lg transition-colors"
              >
                Clear Selection
              </button>
            </div>
            <div className="mt-3 p-3 bg-white rounded-lg border border-green-200">
              <p className="text-gray-800 italic">&ldquo;{selectedStatement.text}&rdquo;</p>
            </div>
          </div>
        )}
        
        {/* Statements and Papers */}
        {statementsFound.map((statement, index) => (
          <StatementSection
            key={index}
            statement={statement}
            index={index}
            papers={limitedPapers.filter(paper => paper.statement === statement)}
            selectedPapers={selectedPapers}
            onPaperSelection={onPaperSelection}
          />
        ))}

        {/* General Papers Section */}
        {generalPapers.length > 0 && (
          <GeneralPapersSection
            papers={generalPapers}
            selectedPapers={selectedPapers}
            onPaperSelection={onPaperSelection}
          />
        )}
        
        {/* Summary Footer */}
        <div className="bg-gradient-to-r from-gray-100 to-blue-100 border-2 border-gray-300 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-4 sm:gap-6">
            <div>
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Selection Summary</h3>
              <p className="text-gray-600 text-sm sm:text-base lg:text-lg">
                {selectedPapers.length} of {limitedPapers.length} papers selected for references
              </p>
            </div>
            <div>
              <div className="bg-blue-200 border-2 border-blue-300 rounded-lg sm:rounded-xl p-3 sm:p-4">
                <p className="text-blue-800 font-semibold mb-1 text-sm sm:text-base">Next Step</p>
                <p className="text-blue-700 text-xs sm:text-sm">
                  Use the References Generator below to create your formatted bibliography
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Quality Threshold Notice */}
        {filteredPapers.length === 0 && papers.length > 0 && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-8">
            <div className="flex items-center mb-4">
              <AlertCircle className="w-8 h-8 text-yellow-600 mr-4" aria-hidden="true" />
              <h3 className="text-xl font-semibold text-yellow-800">Quality Threshold Not Met</h3>
            </div>
            <p className="text-yellow-700 text-base">
              Found {papers.length} papers, but none meet the {SIMILARITY_THRESHOLDS.MIN_DISPLAY}% similarity threshold for quality academic citations. 
              The statements above were extracted from your content and may need additional research.
            </p>
          </div>
        )}
      </div>
    )
  }
  
  // No papers found
  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <Search className="w-10 h-10 text-gray-400" aria-hidden="true" />
      </div>
      <h3 className="text-2xl font-semibold text-gray-900 mb-4">No High-Quality Matches Found</h3>
      <p className="text-gray-600 text-lg mb-6">
        {papers.length > 0 
          ? `Found ${papers.length} papers, but none meet the ${SIMILARITY_THRESHOLDS.MIN_DISPLAY}% similarity threshold.`
          : 'No related papers were found in the academic databases.'
        }
      </p>
    </div>
  )
}

// Statement Section Component
interface StatementSectionProps {
  statement: string
  index: number
  papers: RelatedPaper[]
  selectedPapers: RelatedPaper[]
  onPaperSelection?: (paper: RelatedPaper, isSelected: boolean) => void
}

function StatementSection({ statement, index, papers, selectedPapers, onPaperSelection }: StatementSectionProps) {
  return (
    <div className="space-y-4">
      {/* Statement Card */}
      <div className="relative overflow-hidden rounded-xl border-2 border-blue-300 bg-gradient-to-br from-blue-100 to-blue-100 p-4 sm:p-6 lg:p-8 shadow-lg">
        <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-400 opacity-10 rounded-full" aria-hidden="true" />
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg">
            <span className="text-white text-lg sm:text-xl font-bold">{index + 1}</span>
          </div>
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3">
              <h3 className="text-lg sm:text-xl font-bold text-blue-900 tracking-wide uppercase">Statement {index + 1}</h3>
              <div className="px-3 py-1 bg-blue-200 text-blue-800 text-xs sm:text-sm font-semibold rounded-full w-fit">
                {papers.length} supporting paper{papers.length !== 1 ? 's' : ''}
              </div>
            </div>
            <p className="text-sm sm:text-base lg:text-lg leading-relaxed text-blue-900 font-medium">
              {statement}
            </p>
          </div>
        </div>
      </div>
      
      {/* Papers Table */}
      {papers.length > 0 ? (
        <PapersTable 
          papers={papers}
          statement={statement}
          selectedPapers={selectedPapers}
          onPaperSelection={onPaperSelection}
        />
      ) : (
        <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6 sm:p-10 text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <Search className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" aria-hidden="true" />
          </div>
          <h4 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2 sm:mb-3">No Supporting Papers Found</h4>
          <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto">
            We couldn&apos;t find academic papers that strongly support this statement.
          </p>
        </div>
      )}
    </div>
  )
}

// General Papers Section
interface GeneralPapersSectionProps {
  papers: RelatedPaper[]
  selectedPapers: RelatedPaper[]
  onPaperSelection?: (paper: RelatedPaper, isSelected: boolean) => void
}

function GeneralPapersSection({ papers, selectedPapers, onPaperSelection }: GeneralPapersSectionProps) {
  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-100 to-emerald-50 p-4 sm:p-6 lg:p-8 shadow-lg">
        <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-400 opacity-10 rounded-full" aria-hidden="true" />
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg">
            <BookOpen className="w-6 h-6 text-white" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-emerald-900 tracking-wide uppercase">General Supporting Papers</h3>
            <p className="text-sm sm:text-base text-emerald-800">
              These papers are relevant but were not matched to a specific statement
            </p>
          </div>
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

// Papers Table Component
interface PapersTableProps {
  papers: RelatedPaper[]
  statement?: string
  selectedPapers: RelatedPaper[]
  onPaperSelection?: (paper: RelatedPaper, isSelected: boolean) => void
}

function PapersTable({ papers, statement, selectedPapers, onPaperSelection }: PapersTableProps) {
  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden shadow-lg">
      {/* Table Header - Desktop */}
      <div className="hidden md:grid md:grid-cols-12 bg-gradient-to-r from-gray-200 to-gray-100 border-b-2 border-gray-400 px-4 py-3 font-semibold text-gray-800 text-sm">
        <div className="col-span-1 flex items-center justify-center">Select</div>
        <div className="col-span-5">Title</div>
        <div className="col-span-2 text-center">Year</div>
        <div className="col-span-2 text-center">Match</div>
        <div className="col-span-2 text-center">Actions</div>
      </div>
      
      {/* Table Body */}
      <div className="overflow-y-auto max-h-[600px]">
        {papers.map((paper) => {
          const isSelected = selectedPapers.some(p => p.id === paper.id)
          const supportingQuote = paper.supportingQuote || 
            (statement ? extractSupportingQuote(statement, paper.abstract) : undefined)
          
          return (
            <div
              key={paper.id}
              className={`border-b border-gray-200 last:border-b-0 transition-all duration-200 ${
                isSelected ? 'bg-green-50' : 'hover:bg-gray-50'
              }`}
            >
              {/* Desktop View */}
              <div className="hidden md:grid md:grid-cols-12 px-4 py-4 items-center gap-4">
                <div className="col-span-1 flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => onPaperSelection?.(paper, e.target.checked)}
                    className="w-5 h-5 text-green-600 bg-white border-2 border-gray-300 rounded focus:ring-green-500 focus:ring-2 hover:bg-green-50 transition-colors cursor-pointer"
                    aria-label={isSelected ? `Remove ${paper.title} from references` : `Add ${paper.title} to references`}
                  />
                </div>
                
                <div className="col-span-5">
                  <h4 className="font-bold text-gray-900 text-sm leading-tight line-clamp-3">
                    {paper.title}
                  </h4>
                </div>
                
                <div className="col-span-2 text-center">
                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                    {paper.year}
                  </span>
                </div>
                
                <div className="col-span-2 text-center">
                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded">
                    {paper.similarity}%
                  </span>
                </div>
                
                <div className="col-span-2 flex justify-center gap-2">
                  {paper.url && (
                    <a
                      href={paper.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" aria-hidden="true" />
                      View
                    </a>
                  )}
                </div>
              </div>
              
              {/* Mobile View */}
              <div className="md:hidden p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => onPaperSelection?.(paper, e.target.checked)}
                      className="w-5 h-5 mt-1 text-green-600 bg-white border-2 border-gray-300 rounded focus:ring-green-500 focus:ring-2 hover:bg-green-50 transition-colors cursor-pointer flex-shrink-0"
                      aria-label={isSelected ? `Remove ${paper.title} from references` : `Add ${paper.title} to references`}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 text-sm mb-2 leading-tight">
                        {paper.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                          {paper.year}
                        </span>
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded">
                          {paper.similarity}% match
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {supportingQuote && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" aria-hidden="true" />
                      <p className="text-xs font-bold text-green-800">Evidence</p>
                    </div>
                    <p className="text-xs text-green-700 italic leading-relaxed">&ldquo;{supportingQuote}&rdquo;</p>
                  </div>
                )}
                
                {paper.url && (
                  <div className="flex justify-end">
                    <a
                      href={paper.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" aria-hidden="true" />
                      {paper.url.includes('doi.org') ? 'View DOI' : 'Open Paper'}
                    </a>
                  </div>
                )}
              </div>
              
              {/* Supporting Evidence - Desktop */}
              {supportingQuote && (
                <div className="hidden md:block px-4 pb-4 pt-0">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2" aria-hidden="true" />
                      <p className="text-xs font-bold text-green-800">Supporting Evidence</p>
                    </div>
                    <p className="text-xs text-green-700 italic leading-relaxed">&ldquo;{supportingQuote}&rdquo;</p>
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
