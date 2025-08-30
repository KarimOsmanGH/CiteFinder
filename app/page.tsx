'use client'

import { useState } from 'react'
import { Upload, FileText, Search, Loader2, ChevronDown, ChevronUp, BookOpen } from 'lucide-react'
import PDFUploader from '@/components/PDFUploader'
import CitationList from '@/components/CitationList'
import RelatedPapers from '@/components/RelatedPapers'
import InteractiveText from '@/components/InteractiveText'
import ReferencesGenerator from '@/components/ReferencesGenerator'
import { RelatedPaper, Citation, StatementWithPosition } from '@/types'

interface ProcessResponse {
  citations: Citation[]
  relatedPapers: RelatedPaper[]
  originalText?: string
  statementsWithPositions?: Array<{
    text: string
    startIndex: number
    endIndex: number
    confidence: number
  }>
  textLength: number
  pages: number
  pdfUrl?: string
  fileName?: string
  statementsFound?: string[]
  existingCitationsCount?: number
  discoveredCitationsCount?: number
}

export default function Home() {
  const [citations, setCitations] = useState<Citation[]>([])
  const [relatedPapers, setRelatedPapers] = useState<RelatedPaper[]>([])
  const [selectedPapers, setSelectedPapers] = useState<RelatedPaper[]>([])
  const [pdfUrl, setPdfUrl] = useState<string>('')
  const [fileName, setFileName] = useState<string>('')
  const [statementsFound, setStatementsFound] = useState<string[]>([])
  const [originalText, setOriginalText] = useState<string>('')
  const [statementsWithPositions, setStatementsWithPositions] = useState<StatementWithPosition[]>([])
  const [existingCitationsCount, setExistingCitationsCount] = useState<number>(0)
  const [discoveredCitationsCount, setDiscoveredCitationsCount] = useState<number>(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentStep, setCurrentStep] = useState<'upload' | 'processing' | 'results'>('upload')
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const [searchText, setSearchText] = useState<string>('')
  const [searchMode, setSearchMode] = useState<'pdf' | 'text'>('pdf')

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true)
    setCurrentStep('processing')
    
    try {
      const formData = new FormData()
      formData.append('pdf', file)

      const response = await fetch('/api/process-pdf', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to process PDF')
      }

      const data: ProcessResponse = await response.json()
      setCitations(data.citations)
      setRelatedPapers(data.relatedPapers)
      setStatementsFound(data.statementsFound || [])
      setOriginalText(data.originalText || '')
      setStatementsWithPositions(data.statementsWithPositions || [])
      setExistingCitationsCount(data.existingCitationsCount || 0)
      setDiscoveredCitationsCount(data.discoveredCitationsCount || 0)
      setPdfUrl(data.pdfUrl || '')
      setFileName(data.fileName || '')
      setCurrentStep('results')
    } catch (error) {
      console.error('Error processing PDF:', error)
      alert('Error processing PDF. Please try again.')
      setCurrentStep('upload')
    } finally {
      setIsProcessing(false)
    }
  }

  const toggleFaq = (index: number) => {
    console.log('Toggling FAQ:', index, 'Current expanded:', expandedFaq)
    setExpandedFaq(expandedFaq === index ? null : index)
  }

  const handlePaperSelection = (paper: RelatedPaper, isSelected: boolean) => {
    if (isSelected) {
      setSelectedPapers(prev => [...prev, paper])
    } else {
      setSelectedPapers(prev => prev.filter(p => p.id !== paper.id))
    }
  }

  const handleTextSearch = async () => {
    console.log('🔍 handleTextSearch called with text length:', searchText.length)
    console.log('🔍 Search text:', searchText)
    if (!searchText.trim()) {
      console.log('❌ Text is empty, returning')
      return
    }
    
    console.log('✅ Starting text processing...')
    setIsProcessing(true)
    setCurrentStep('processing')
    
    try {
      console.log('🔍 Making API call to /api/process-text...')
      const response = await fetch('/api/process-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: searchText }),
      })

      console.log('🔍 API response status:', response.status)
      console.log('🔍 API response ok:', response.ok)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API error response:', errorText)
        throw new Error('Failed to process text')
      }

      const data: ProcessResponse = await response.json()
      console.log('✅ API response received:')
      console.log('  - Citations:', data.citations?.length || 0)
      console.log('  - Related papers:', data.relatedPapers?.length || 0)
      console.log('  - Statements found:', data.statementsFound?.length || 0)
      console.log('  - Existing citations:', data.existingCitationsCount || 0)
      console.log('  - Discovered citations:', data.discoveredCitationsCount || 0)
      
      setCitations(data.citations || [])
      setRelatedPapers(data.relatedPapers || [])
      setStatementsFound(data.statementsFound || [])
      setExistingCitationsCount(data.existingCitationsCount || 0)
      setDiscoveredCitationsCount(data.discoveredCitationsCount || 0)
      setPdfUrl('')
      setFileName('')
      setCurrentStep('results')
    } catch (error) {
      console.error('❌ Error processing text:', error)
      alert('Error processing text. Please try again.')
      setCurrentStep('upload')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">

      <div className="relative container mx-auto px-4 py-8">
        {/* Navigation */}
        <nav className="flex justify-between items-center mb-4">
          {/* Logo and Menu Items */}
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-3">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">CiteFinder</span>
            </div>
            
            {/* Menu Items */}
            <div className="flex space-x-4">
              <button 
                onClick={() => document.getElementById('upload')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors duration-200"
              >
                Home
              </button>
              <button 
                onClick={() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors duration-200"
              >
                FAQ
              </button>
            </div>
          </div>
        </nav>

        {/* Header */}
        <header className="text-center mb-16 animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold gradient-text mb-8 mt-16 leading-relaxed py-4">
            Academic Source Finder
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Automatically extract statements from your paper, find sources from the world's largest academic databases, and generate citations.
          </p>
        </header>

        {/* Main Content */}
        <section id="upload" className="max-w-6xl mx-auto" aria-label="Main Application">
          {currentStep === 'upload' && (
            <section className="animate-fade-in-up" aria-label="Search Options">
              {/* Search Mode Toggle */}
              <div className="flex justify-center mb-8">
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-1 border border-gray-300 shadow-sm">
                  <button
                    onClick={() => {
                      console.log('Switching to PDF mode, current mode:', searchMode)
                      setSearchMode('pdf')
                    }}
                    className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                      searchMode === 'pdf'
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    Upload PDF
                  </button>
                  <button
                    onClick={() => {
                      console.log('Switching to text mode, current mode:', searchMode)
                      setSearchMode('text')
                    }}
                    className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                      searchMode === 'text'
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    Enter Text
                  </button>
                </div>
              </div>
              
              {/* PDF Upload Option */}
              {searchMode === 'pdf' && (
                <div className="glass rounded-2xl shadow-soft p-4 hover-lift animate-fade-in max-w-2xl mx-auto">
                  <PDFUploader onFileUpload={handleFileUpload} />
                </div>
              )}

              {/* Text Search Option */}
              {searchMode === 'text' && (
                <div className="glass rounded-2xl shadow-soft p-8 hover-lift animate-fade-in">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Enter Your Text</h3>
                    <p className="text-gray-600">Paste your content and our AI will identify statements that need academic backing, then find sources to support them</p>
                  </div>
                  <div className="space-y-4">
                    <textarea
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      placeholder="Paste your paper content here... Our AI will find academic sources to support your ideas and generate proper citations."
                      className="w-full h-48 p-4 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/70 backdrop-blur-sm text-gray-900"
                    />
                    <button
                      onClick={handleTextSearch}
                      disabled={!searchText.trim()}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 hover-lift shadow-glow disabled:cursor-not-allowed"
                    >
                      Find Sources & Generate Citations
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {currentStep === 'processing' && (
            <section className="animate-fade-in" aria-label="Processing Status">
              <div className="glass rounded-2xl shadow-soft p-12 text-center">
                <div className="relative mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto animate-pulse-slow" role="status" aria-label="Processing">
                    <Loader2 className="w-10 h-10 text-white animate-spin" />
                  </div>
                  <div className="absolute inset-0 w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full opacity-20 animate-ping" aria-hidden="true"></div>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Processing your {searchMode === 'pdf' ? 'PDF' : 'text'}...
                </h2>
                <p className="text-lg text-gray-600 max-w-md mx-auto">
                  Extracting citations and searching across academic databases. This may take a few moments.
                </p>
                
                {/* Progress indicators */}
                <div className="flex justify-center space-x-2 mt-8" aria-label="Progress indicators">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" aria-hidden="true"></div>
                  <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}} aria-hidden="true"></div>
                  <div className="w-3 h-3 bg-pink-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}} aria-hidden="true"></div>
                </div>
              </div>
            </section>
          )}

          {currentStep === 'results' && (
            <section className="space-y-8 animate-fade-in" aria-label="Results">
              {/* Back to Upload Button */}
              <div className="text-center mb-8">
                <button
                  onClick={() => setCurrentStep('upload')}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-semibold rounded-xl transition-all duration-300 hover-lift shadow-glow"
                >
                  ← Back to Upload
                </button>
              </div>

              {/* Interactive Content View Section */}
              {searchMode === 'pdf' && (
                <article className="glass rounded-2xl shadow-soft p-8 hover-lift">
                  <header className="flex items-center mb-8">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-4" aria-hidden="true">
                      <Search className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900">
                        Interactive PDF View
                      </h2>
                      <p className="text-gray-600">Review your content with highlighted statements and supporting papers</p>
                    </div>
                  </header>
                  <InteractiveText 
                    originalText={originalText}
                    statementsWithPositions={statementsWithPositions}
                    relatedPapers={relatedPapers}
                    selectedPapers={selectedPapers}
                    onPaperSelection={handlePaperSelection}
                  />
                </article>
              )}

              {/* Extracted Statements Section for Text Input */}
              {searchMode === 'text' && (
                <article className="glass rounded-2xl shadow-soft p-8 hover-lift">
                  <header className="flex items-center mb-8">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-4" aria-hidden="true">
                      <Search className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900">
                        Extracted Statements
                      </h2>
                      <p className="text-gray-600">Review the statements extracted from your text and find supporting papers</p>
                    </div>
                  </header>
                  <div className="space-y-4">
                    {statementsFound && statementsFound.length > 0 ? (
                      statementsFound.map((statement, index) => (
                        <div key={index} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center mb-2">
                                <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold bg-blue-600 text-white rounded-full mr-2">
                                  {index + 1}
                                </span>
                                <span className="text-sm font-medium text-blue-800">Statement {index + 1}</span>
                              </div>
                              <p className="text-gray-800 leading-relaxed">{statement}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                        <p className="text-gray-600">No statements were extracted from your text.</p>
                      </div>
                    )}
                  </div>
                </article>
              )}

              {/* Supporting Papers Section */}
              <article className="glass rounded-2xl shadow-soft p-8 hover-lift">
                <header className="flex items-center mb-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mr-4" aria-hidden="true">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">
                      Supporting Papers
                    </h2>
                    <p className="text-gray-600">Select academic papers to support your statements and claims</p>
                  </div>
                </header>
                <RelatedPapers 
                  papers={relatedPapers} 
                  statementsFound={statementsFound}
                  selectedPapers={selectedPapers}
                  onPaperSelection={handlePaperSelection}
                />
              </article>

              {/* References Generator Section */}
              <article className="glass rounded-2xl shadow-soft p-8 hover-lift">
                <header className="flex items-center mb-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mr-4" aria-hidden="true">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">
                      References Generator
                    </h2>
                    <p className="text-gray-600">Generate formatted references from your extracted citations</p>
                  </div>
                </header>
                <ReferencesGenerator citations={citations} selectedPapers={selectedPapers} />
              </article>
            </section>
          )}
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-16">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold gradient-text mb-6">
                Frequently Asked Questions
              </h2>
              <p className="text-xl text-gray-600">
                Automatically extract statements from your paper, find sources from the world's largest academic databases, and generate citations.
              </p>

            </div>

            <div className="space-y-4">
              {/* FAQ Item 1 */}
              <div className="glass rounded-2xl shadow-soft overflow-hidden">
                <button
                  onClick={() => toggleFaq(0)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-white/20 transition-colors"
                >
                  <h3 className="text-xl font-bold text-gray-900">
                    How do I use CiteFinder?
                  </h3>
                  {expandedFaq === 0 ? (
                    <ChevronUp className="w-6 h-6 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-gray-600" />
                  )}
                </button>
                {expandedFaq === 0 && (
                  <div className="px-6 pb-6">
                    <p className="text-gray-700 leading-relaxed">
                      Upload a PDF or paste text. We automatically extract key statements that need academic backing, search the world's largest academic databases (arXiv, OpenAlex, CrossRef, PubMed) to find supporting sources, and generate citations and references for you.
                    </p>
                  </div>
                )}
              </div>

              {/* FAQ Item 2 */}
              <div className="glass rounded-2xl shadow-soft overflow-hidden">
                <button
                  onClick={() => toggleFaq(1)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-white/20 transition-colors"
                >
                  <h3 className="text-xl font-bold text-gray-900">
                    What citation formats does CiteFinder recognize?
                  </h3>
                  {expandedFaq === 1 ? (
                    <ChevronUp className="w-6 h-6 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-gray-600" />
                  )}
                </button>
                {expandedFaq === 1 && (
                  <div className="px-6 pb-6">
                    <p className="text-gray-700 leading-relaxed">
                      CiteFinder recognizes multiple citation formats including APA, MLA, Chicago, Harvard, and simple author-year formats. We also detect citations with 'et al.' and various punctuation styles.
                    </p>
                  </div>
                )}
              </div>

              {/* FAQ Item 3 */}
              <div className="glass rounded-2xl shadow-soft overflow-hidden">
                <button
                  onClick={() => toggleFaq(2)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-white/20 transition-colors"
                >
                  <h3 className="text-xl font-bold text-gray-900">
                    Which academic databases does CiteFinder search?
                  </h3>
                  {expandedFaq === 2 ? (
                    <ChevronUp className="w-6 h-6 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-gray-600" />
                  )}
                </button>
                {expandedFaq === 2 && (
                  <div className="px-6 pb-6">
                    <p className="text-gray-700 leading-relaxed mb-4">
                      CiteFinder searches across major academic databases to find the most relevant sources for your research:
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                        <a 
                          href="https://arxiv.org" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors"
                        >
                          arXiv
                        </a>
                        <span className="text-gray-600 ml-2">- Computer science, physics, mathematics, and quantitative biology</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                        <a 
                          href="https://openalex.org" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors"
                        >
                          OpenAlex
                        </a>
                        <span className="text-gray-600 ml-2">- Comprehensive academic database with millions of papers</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                        <a 
                          href="https://crossref.org" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors"
                        >
                          CrossRef
                        </a>
                        <span className="text-gray-600 ml-2">- Journal articles and DOIs from publishers worldwide</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                        <a 
                          href="https://pubmed.ncbi.nlm.nih.gov" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors"
                        >
                          PubMed
                        </a>
                        <span className="text-gray-600 ml-2">- Biomedical and life sciences research papers</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

                            {/* FAQ Item 4 */}
                <div className="glass rounded-2xl shadow-soft overflow-hidden">
                  <button
                    onClick={() => toggleFaq(3)}
                    className="w-full p-6 text-left flex items-center justify-between hover:bg-white/20 transition-colors"
                  >
                    <h3 className="text-xl font-bold text-gray-900">
                      Can I generate a references page from the extracted citations?
                    </h3>
                    {expandedFaq === 3 ? (
                      <ChevronUp className="w-6 h-6 text-gray-600" />
                    ) : (
                      <ChevronDown className="w-6 h-6 text-gray-600" />
                    )}
                  </button>
                  {expandedFaq === 3 && (
                  <div className="px-6 pb-6">
                    <p className="text-gray-700 leading-relaxed">
                      Yes! CiteFinder includes a References Generator that can format your extracted citations into properly formatted reference lists in APA, MLA, Chicago, Harvard, or BibTeX formats. You can copy or download the formatted references.
                    </p>
                  </div>
                )}
              </div>
            </div>


          </div>
        </section>
      </div>
    </main>
  )
} 