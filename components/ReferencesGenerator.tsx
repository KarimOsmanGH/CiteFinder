'use client'

import { useState } from 'react'
import { Download, FileText, Copy, Check, BookOpen } from 'lucide-react'
import { Citation, RelatedPaper } from '@/types'

type ReferenceFormat = 'apa' | 'mla' | 'chicago' | 'harvard' | 'bibtex'

interface ReferencesGeneratorProps {
  citations: Citation[]
  selectedPapers?: RelatedPaper[]
}

const FORMAT_OPTIONS = [
  { value: 'apa', label: 'APA', description: 'American Psychological Association' },
  { value: 'mla', label: 'MLA', description: 'Modern Language Association' },
  { value: 'chicago', label: 'Chicago', description: 'Chicago Manual of Style' },
  { value: 'harvard', label: 'Harvard', description: 'Harvard Referencing Style' },
  { value: 'bibtex', label: 'BibTeX', description: 'LaTeX Bibliography Format' }
] as const

export default function ReferencesGenerator({ citations, selectedPapers = [] }: ReferencesGeneratorProps) {
  const [selectedFormat, setSelectedFormat] = useState<ReferenceFormat>('apa')
  const [copied, setCopied] = useState(false)

  const formatPaper = (paper: RelatedPaper, format: ReferenceFormat): string => {
    const authors = paper.authors.join(', ')
    const title = paper.title
    const year = paper.year

    switch (format) {
      case 'apa':
        return `${authors}. (${year}). ${title}.`
      case 'mla':
        return `${authors}. "${title}." ${year}.`
      case 'chicago':
        return `${authors}. "${title}." ${year}.`
      case 'harvard':
        return `${authors} (${year}) ${title}.`
      case 'bibtex':
        return `@article{${paper.id},\n  author = {${authors}},\n  title = {${title}},\n  year = {${year}},\n}`
      default:
        return `${authors}. (${year}). ${title}.`
    }
  }

  const generateAllReferences = (format: ReferenceFormat): string => {
    if (selectedPapers.length === 0) {
      return 'No papers selected. Please select papers from the Related Papers section above.'
    }
    
    if (selectedPapers.length === 1) {
      return formatPaper(selectedPapers[0], format)
    }
    
    return selectedPapers
      .map((paper, index) => `${index + 1}. ${formatPaper(paper, format)}`)
      .join('\n\n')
  }

  const getPrimaryAuthorLastName = (authors: string[]): string => {
    if (!authors || authors.length === 0) return 'Author'
    const first = authors[0]
    const parts = first.split(' ').filter(Boolean)
    return parts.length ? parts[parts.length - 1] : first
  }

  const formatInTextCitation = (paper: RelatedPaper, format: ReferenceFormat): string => {
    const primaryLast = getPrimaryAuthorLastName(paper.authors)
    const year = paper.year || 'n.d.'
    
    switch (format) {
      case 'apa':
        return `(${primaryLast}, ${year})`
      case 'mla':
        return `(${primaryLast})`
      case 'chicago':
        return `(${primaryLast} ${year})`
      case 'harvard':
        return `(${primaryLast}, ${year})`
      case 'bibtex':
        return `\\cite{${paper.id}}`
      default:
        return `(${primaryLast}, ${year})`
    }
  }

  const copyToClipboard = async () => {
    const reference = generateAllReferences(selectedFormat)
    try {
      await navigator.clipboard.writeText(reference)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const downloadReferences = () => {
    const reference = generateAllReferences(selectedFormat)
    const blob = new Blob([reference], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `references-${selectedFormat}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (selectedPapers.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-gray-400" aria-hidden="true" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Papers Selected</h3>
        <p className="text-gray-600">Please select papers from the Related Papers section above to generate citations.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-green-600" aria-hidden="true" />
          </div>
          <span className="text-sm font-medium text-gray-700">
            {selectedPapers.length} selected
          </span>
        </div>
      </div>

      {/* Citation Generator */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        {/* Selected Papers Summary */}
        <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
          <h4 className="font-semibold text-gray-900 mb-2">Selected Papers ({selectedPapers.length})</h4>
          <div className="space-y-2">
            {selectedPapers.map((paper, index) => (
              <div key={paper.id} className="text-sm text-gray-600 border-l-2 border-blue-200 pl-3">
                <div className="font-medium">{index + 1}. {paper.title}</div>
                <div className="text-xs text-gray-500">
                  {paper.authors.join(', ')} • {paper.year} • {Math.round(paper.similarity)}% match
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Statements with In-text Citations */}
        {selectedPapers.some(p => p.statement) && (
          <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
            <h4 className="font-semibold text-gray-900 mb-2">Statements with in-text citations</h4>
            <div className="space-y-3">
              {(() => {
                const papersByStatement = selectedPapers
                  .filter(p => p.statement)
                  .reduce((groups, paper) => {
                    const statement = paper.statement!
                    if (!groups[statement]) {
                      groups[statement] = []
                    }
                    groups[statement].push(paper)
                    return groups
                  }, {} as Record<string, RelatedPaper[]>)

                return Object.entries(papersByStatement).map(([statement, papers]) => (
                  <div key={statement.slice(0, 30)} className="flex items-start justify-between">
                    <div className="flex-1 mr-4">
                      <p className="text-sm text-gray-800 mb-1">{statement}</p>
                      <p className="text-sm text-gray-600">
                        {papers.map((paper, index) => (
                          <span key={paper.id}>
                            {formatInTextCitation(paper, selectedFormat)}
                            {index < papers.length - 1 ? '; ' : ''}
                          </span>
                        ))}
                      </p>
                    </div>
                    <button
                      onClick={() => navigator.clipboard.writeText(
                        `${statement} ${papers.map(p => formatInTextCitation(p, selectedFormat)).join('; ')}`
                      )}
                      className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded transition-colors flex-shrink-0"
                    >
                      Copy
                    </button>
                  </div>
                ))
              })()}
            </div>
          </div>
        )}

        {/* Style Buttons */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Citation Style</label>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Citation format">
            {FORMAT_OPTIONS.map((option) => (
              <button
                key={option.value}
                role="radio"
                aria-checked={selectedFormat === option.value}
                onClick={() => setSelectedFormat(option.value as ReferenceFormat)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedFormat === option.value
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title={option.description}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Generated References */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h5 className="font-semibold text-gray-900">
              {selectedPapers.length === 1 ? 'Generated Citation' : 'Generated References'}
            </h5>
            <div className="flex items-center space-x-3">
              <button
                onClick={copyToClipboard}
                className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  copied 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" aria-hidden="true" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" aria-hidden="true" />
                    {selectedPapers.length === 1 ? 'Copy Citation' : 'Copy All'}
                  </>
                )}
              </button>
              <button
                onClick={downloadReferences}
                className="inline-flex items-center px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium transition-all duration-200"
              >
                <Download className="w-4 h-4 mr-2" aria-hidden="true" />
                Download
              </button>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
              {generateAllReferences(selectedFormat)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
