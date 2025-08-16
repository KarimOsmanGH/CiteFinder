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

  const generateReferences = (format: ReferenceFormat): string => {
    if (citations.length === 0) return 'No citations available.'
    
    const formattedCitations = citations
      .filter(citation => citation.confidence > 0.3) // Only include citations with decent confidence
      .map((citation, index) => {
        const formatted = formatCitation(citation, format)
        return format === 'bibtex' 
          ? formatted 
          : `${index + 1}. ${formatted}`
      })
      .join('\n\n')

    return formattedCitations
  }

  const copyToClipboard = async () => {
    const references = generateReferences(selectedFormat)
    try {
      await navigator.clipboard.writeText(references)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  const downloadReferences = () => {
    const references = generateReferences(selectedFormat)
    const blob = new Blob([references], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `references-${selectedFormat}.txt`
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">References Generator</h3>
          <p className="text-gray-600">
            Generate a formatted references page from {validCitations.length} extracted citations
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-green-600" />
          </div>
          <span className="text-sm font-medium text-gray-700">
            {validCitations.length} citations
          </span>
        </div>
      </div>

      {/* Format Selection */}
      <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-white/30">
        <h4 className="font-semibold text-gray-900 mb-4">Select Reference Format</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {formatOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedFormat(option.value as ReferenceFormat)}
              className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                selectedFormat === option.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white/50 hover:border-gray-300 hover:bg-white/70'
              }`}
            >
              <div className="font-semibold text-gray-900">{option.label}</div>
              <div className="text-sm text-gray-600">{option.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-white/30">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-gray-900">Preview</h4>
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
        
        <div className="bg-white rounded-lg p-4 border border-gray-200 max-h-96 overflow-y-auto">
          <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
            {generateReferences(selectedFormat)}
          </pre>
        </div>
      </div>

      {/* Citation Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 border border-white/30">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">{validCitations.length}</div>
              <div className="text-sm text-gray-600">Valid Citations</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 border border-white/30">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
              <User className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">
                {new Set(validCitations.map(c => c.authors).filter(Boolean)).size}
              </div>
              <div className="text-sm text-gray-600">Unique Authors</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 border border-white/30">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
              <Calendar className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">
                {new Set(validCitations.map(c => c.year).filter(Boolean)).size}
              </div>
              <div className="text-sm text-gray-600">Publication Years</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 