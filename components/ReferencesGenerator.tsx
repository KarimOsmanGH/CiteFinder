'use client'

import { useState } from 'react'
import { Download, FileText, Copy, Check, BookOpen, Calendar, User } from 'lucide-react'

interface Citation {
  id: string
  text: string
  confidence: number
  authors?: string
  title?: string
  year?: string
}

interface ReferencesGeneratorProps {
  citations: Citation[]
  selectedPapers?: RelatedPaper[]
}

interface RelatedPaper {
  id: string
  title: string
  authors: string[]
  year: string
  abstract: string
  url: string
  similarity: number
}

type ReferenceFormat = 'apa' | 'mla' | 'chicago' | 'harvard' | 'bibtex'

export default function ReferencesGenerator({ citations, selectedPapers = [] }: ReferencesGeneratorProps) {
  const [selectedFormat, setSelectedFormat] = useState<ReferenceFormat>('apa')
  const [copied, setCopied] = useState(false)

  const formatCitation = (citation: Citation, format: ReferenceFormat): string => {
    const authors = citation.authors || 'Unknown Author'
    const title = citation.title || citation.text
    const year = citation.year || 'n.d.'

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
        return `@article{${citation.id},\n  author = {${authors}},\n  title = {${title}},\n  year = {${year}},\n}`
      default:
        return citation.text
    }
  }

  const generateAllReferences = (format: ReferenceFormat): string => {
    if (selectedPapers.length === 0) return 'No papers selected. Please select papers from the Related Papers section above.'
    
    if (selectedPapers.length === 1) {
      // Single paper - return just that citation
      return formatPaper(selectedPapers[0], format)
    }
    
    // Multiple papers - return all citations with numbering
    const references = selectedPapers.map((paper, index) => {
      const citation = formatPaper(paper, format)
      return `${index + 1}. ${citation}`
    })
    
    return references.join('\n\n')
  }

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

  const copyToClipboard = async () => {
    const reference = generateAllReferences(selectedFormat)
    try {
      await navigator.clipboard.writeText(reference)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  const downloadReferences = () => {
    const reference = generateAllReferences(selectedFormat)
    const blob = new Blob([reference], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reference-${selectedFormat}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const formatOptions = [
    { value: 'apa', label: 'APA', description: 'American Psychological Association' },
    { value: 'mla', label: 'MLA', description: 'Modern Language Association' },
    { value: 'chicago', label: 'Chicago', description: 'Chicago Manual of Style' },
    { value: 'harvard', label: 'Harvard', description: 'Harvard Referencing Style' },
    { value: 'bibtex', label: 'BibTeX', description: 'LaTeX Bibliography Format' }
  ]

  if (selectedPapers.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-gray-400" />
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
        <div>
          <h3 className="text-xl font-bold text-gray-900">Citation Generator</h3>
          <p className="text-gray-600">
            Generate formatted citations in different styles
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-green-600" />
          </div>
          <span className="text-sm font-medium text-gray-700">
            {selectedPapers.length} selected
          </span>
        </div>
      </div>

      {/* Citation Generator */}
      <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-white/30">
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

        {/* Style Buttons */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Citation Style</label>
          <div className="flex flex-wrap gap-2">
            {formatOptions.map((option) => (
              <button
                key={option.value}
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
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    {selectedPapers.length === 1 ? 'Copy Citation' : 'Copy All References'}
                  </>
                )}
              </button>
              <button
                onClick={downloadReferences}
                className="inline-flex items-center px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium transition-all duration-200"
              >
                <Download className="w-4 h-4 mr-2" />
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