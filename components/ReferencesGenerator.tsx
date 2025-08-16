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
}

type ReferenceFormat = 'apa' | 'mla' | 'chicago' | 'harvard' | 'bibtex'

export default function ReferencesGenerator({ citations }: ReferencesGeneratorProps) {
  const [selectedFormat, setSelectedFormat] = useState<ReferenceFormat>('apa')
  const [copied, setCopied] = useState(false)
  const [selectedCitationIndex, setSelectedCitationIndex] = useState(0)

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

  const generateSingleReference = (format: ReferenceFormat): string => {
    if (citations.length === 0) return 'No citations available.'
    
    const validCitations = citations.filter(citation => citation.confidence > 0.3)
    if (validCitations.length === 0) return 'No valid citations available.'
    
    const selectedCitation = validCitations[selectedCitationIndex] || validCitations[0]
    const formatted = formatCitation(selectedCitation, format)
    
    return format === 'bibtex' ? formatted : formatted
  }

  const copyToClipboard = async () => {
    const reference = generateSingleReference(selectedFormat)
    try {
      await navigator.clipboard.writeText(reference)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  const downloadReferences = () => {
    const reference = generateSingleReference(selectedFormat)
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

  if (citations.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Citations Available</h3>
        <p className="text-gray-600">Upload a PDF to extract citations and generate references.</p>
      </div>
    )
  }

  const validCitations = citations.filter(citation => citation.confidence > 0.3)

  if (validCitations.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Valid Citations</h3>
        <p className="text-gray-600">No citations with sufficient confidence were found.</p>
      </div>
    )
  }

  const selectedCitation = validCitations[selectedCitationIndex] || validCitations[0]

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
            {validCitations.length} available
          </span>
        </div>
      </div>

      {/* Citation Selection */}
      <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-white/30">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-gray-900">Select Citation</h4>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSelectedCitationIndex(Math.max(0, selectedCitationIndex - 1))}
              disabled={selectedCitationIndex === 0}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm"
            >
              ← Previous
            </button>
            <span className="text-sm text-gray-600">
              {selectedCitationIndex + 1} of {validCitations.length}
            </span>
            <button
              onClick={() => setSelectedCitationIndex(Math.min(validCitations.length - 1, selectedCitationIndex + 1))}
              disabled={selectedCitationIndex === validCitations.length - 1}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm"
            >
              Next →
            </button>
          </div>
        </div>
        
        {/* Selected Citation Info */}
        <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
          <h5 className="font-semibold text-gray-900 mb-2">{selectedCitation.title || 'Untitled'}</h5>
          <div className="text-sm text-gray-600 space-y-1">
            <div><strong>Authors:</strong> {selectedCitation.authors || 'Unknown'}</div>
            <div><strong>Year:</strong> {selectedCitation.year || 'Unknown'}</div>
            <div><strong>Confidence:</strong> {Math.round(selectedCitation.confidence * 100)}%</div>
          </div>
        </div>

        {/* Style Dropdown */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Citation Style</label>
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value as ReferenceFormat)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {formatOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} - {option.description}
              </option>
            ))}
          </select>
        </div>

        {/* Generated Citation */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h5 className="font-semibold text-gray-900">Generated Citation</h5>
            <div className="flex items-center space-x-2">
              <button
                onClick={copyToClipboard}
                className="inline-flex items-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </>
                )}
              </button>
              <button
                onClick={downloadReferences}
                className="inline-flex items-center px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium transition-colors"
              >
                <Download className="w-4 h-4 mr-1" />
                Download
              </button>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
              {generateSingleReference(selectedFormat)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
} 