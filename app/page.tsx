'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Upload, FileText, Search, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import PDFUploader from '@/components/PDFUploader'
import CitationList from '@/components/CitationList'
import RelatedPapers from '@/components/RelatedPapers'
import ReferencesGenerator from '@/components/ReferencesGenerator'

interface Citation {
  id: string
  text: string
  authors?: string
  year?: string
  title?: string
  confidence: number
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

interface ProcessResponse {
  citations: Citation[]
  relatedPapers: RelatedPaper[]
  textLength: number
  pages: number
  pdfUrl?: string
  fileName?: string
  topicsFound?: string[]
  existingCitationsCount?: number
  discoveredCitationsCount?: number
}

export default function Home() {
  const [citations, setCitations] = useState<Citation[]>([])
  const [relatedPapers, setRelatedPapers] = useState<RelatedPaper[]>([])
  const [pdfUrl, setPdfUrl] = useState<string>('')
  const [fileName, setFileName] = useState<string>('')
  const [topicsFound, setTopicsFound] = useState<string[]>([])
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
      setTopicsFound(data.topicsFound || [])
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

  const handleTextSearch = async () => {
    console.log('handleTextSearch called with text length:', searchText.length)
    if (!searchText.trim()) {
      console.log('Text is empty, returning')
      return
    }
    
    console.log('Starting text processing...')
    setIsProcessing(true)
    setCurrentStep('processing')
    
    try {
      const response = await fetch('/api/process-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: searchText }),
      })

      if (!response.ok) {
        throw new Error('Failed to process text')
      }

      const data: ProcessResponse = await response.json()
      console.log('Text processing successful, citations found:', data.citations.length)
      setCitations(data.citations)
      setRelatedPapers(data.relatedPapers)
      setTopicsFound(data.topicsFound || [])
      setExistingCitationsCount(data.existingCitationsCount || 0)
      setDiscoveredCitationsCount(data.discoveredCitationsCount || 0)
      setPdfUrl('')
      setFileName('')
      setCurrentStep('results')
    } catch (error) {
      console.error('Error processing text:', error)
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
                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors duration-200"
              >
                Pricing
              </button>
              <button 
                onClick={() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors duration-200"
              >
                FAQ
              </button>
            </div>
          </div>
          
          {/* Right side - could be used for login/signup later */}
          <div className="w-32">
            {/* Placeholder for future elements */}
          </div>
        </nav>

        {/* Header */}
        <header className="text-center mb-16 animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold gradient-text mb-8 mt-16 leading-relaxed py-4">
            Intelligent Citation Discovery
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Upload your paper or paste text, and our AI finds the perfect academic sources to support your content. We intelligently identify concepts that need citations and automatically generate proper references from the world's largest databases.
          </p>
          
          {/* Feature highlights */}
          <section className="flex justify-center items-center space-x-4 mt-8" aria-label="Key Features">
            <div className="inline-flex items-center px-3 py-1 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-sm font-medium">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2" aria-hidden="true"></div>
              <span>Free & No Signup</span>
            </div>
            <div className="inline-flex items-center px-3 py-1 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700 text-sm font-medium">
              <div className="w-2 h-2 bg-indigo-500 rounded-full mr-2" aria-hidden="true"></div>
              <span>Instant Results</span>
            </div>
            <div className="inline-flex items-center px-3 py-1 rounded-full border border-purple-200 bg-purple-50 text-purple-700 text-sm font-medium">
              <div className="w-2 h-2 bg-purple-500 rounded-full mr-2" aria-hidden="true"></div>
              <span>References Generator</span>
            </div>
          </section>
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
                <div className="glass rounded-2xl shadow-soft p-8 hover-lift animate-fade-in">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Upload PDF Document</h3>
                    <p className="text-gray-600">Upload a PDF file to extract citations and find related papers</p>
                  </div>
                  <PDFUploader onFileUpload={handleFileUpload} />
                </div>
              )}

              {/* Text Search Option */}
              {searchMode === 'text' && (
                <div className="glass rounded-2xl shadow-soft p-8 hover-lift animate-fade-in">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Enter Text with Citations</h3>
                    <p className="text-gray-600">Paste text containing citations to extract and find related papers</p>
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
                  Extracting citations and searching across 4 academic databases. This may take a few moments.
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
              {/* Citations Section */}
              <article className="glass rounded-2xl shadow-soft p-8 hover-lift">
                <header className="flex items-center mb-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-4" aria-hidden="true">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">
                      Citations Found
                    </h2>
                    <p className="text-gray-600">{citations.length} citations extracted from your {searchMode === 'pdf' ? 'PDF' : 'text'}</p>
                  </div>
                </header>
                <CitationList 
                  citations={citations} 
                  searchMode={searchMode}
                  topicsFound={topicsFound}
                  existingCitationsCount={existingCitationsCount}
                  discoveredCitationsCount={discoveredCitationsCount}
                />
              </article>

              {/* Related Papers Section */}
              <article className="glass rounded-2xl shadow-soft p-8 hover-lift">
                <header className="flex items-center mb-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mr-4" aria-hidden="true">
                    <Search className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">
                      Related Papers
                    </h2>
                    <p className="text-gray-600">{relatedPapers.length} papers found across academic databases</p>
                  </div>
                </header>
                <RelatedPapers papers={relatedPapers} />
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
                            <ReferencesGenerator citations={citations} />
                          </article>



                          {/* Upload Another Button */}
                          <footer className="text-center">
                <button
                  onClick={() => setCurrentStep('upload')}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 hover-lift shadow-glow"
                  aria-label="Upload another PDF file"
                >
                  Upload Another PDF
                </button>
              </footer>
            </section>
          )}
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-16">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
                                        <h2 className="text-4xl font-bold gradient-text mb-6">
                            Pricing
                          </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                CiteFinder is committed to keeping academic research accessible to everyone. 
                Our core features are completely free, with premium options for power users.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Free Plan */}
              <div className="glass rounded-2xl shadow-soft p-8 hover-lift">
                <div className="text-center mb-8">
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">Free</h3>
                  <div className="text-4xl font-bold text-gray-900 mb-2">$0</div>
                  <p className="text-gray-600">Forever free for academic research</p>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center">
                    <span className="text-blue-500 mr-3">✅</span>
                    <span className="text-gray-700">Unlimited PDF uploads</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-blue-500 mr-3">✅</span>
                    <span className="text-gray-700">Citation extraction from all formats</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-blue-500 mr-3">✅</span>
                    <span className="text-gray-700">Search across 4 academic databases</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-blue-500 mr-3">✅</span>
                    <span className="text-gray-700">Up to 15 related papers per search</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-blue-500 mr-3">✅</span>
                    <span className="text-gray-700">No registration required</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-blue-500 mr-3">✅</span>
                    <span className="text-gray-700">References Generator</span>
                  </div>
                </div>

                <button 
                  onClick={() => document.getElementById('upload')?.scrollIntoView({ behavior: 'smooth' })}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover-lift shadow-glow"
                >
                  Start Using Free
                </button>
              </div>

              {/* Premium Plan */}
              <div className="glass rounded-2xl shadow-soft p-8 hover-lift relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Coming Soon
                  </span>
                </div>

                <div className="text-center mb-8">
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">Premium</h3>
                  <div className="text-4xl font-bold text-gray-900 mb-2">$9.99</div>
                  <p className="text-gray-600">Per month for power users</p>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center">
                    <span className="text-indigo-500 mr-3">✅</span>
                    <span className="text-gray-700">Everything in Free plan</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-indigo-500 mr-3">✅</span>
                    <span className="text-gray-700">Unlimited related papers</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-indigo-500 mr-3">✅</span>
                    <span className="text-gray-700">Advanced citation validation</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-indigo-500 mr-3">✅</span>
                    <span className="text-gray-700">Export to BibTeX, EndNote, Mendeley</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-indigo-500 mr-3">✅</span>
                    <span className="text-gray-700">Citation network visualization</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-indigo-500 mr-3">✅</span>
                    <span className="text-gray-700">Priority API access</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-indigo-500 mr-3">✅</span>
                    <span className="text-gray-700">Email support</span>
                  </div>
                </div>

                <button 
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover-lift shadow-glow opacity-50 cursor-not-allowed"
                  disabled
                >
                  Coming Soon
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-16">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold gradient-text mb-6">
                Frequently Asked Questions
              </h2>
              <p className="text-xl text-gray-600">
                Find answers to common questions about CiteFinder
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
                      Simply upload a PDF file using our drag-and-drop interface. CiteFinder will automatically extract citations from your document and search for related papers across multiple academic databases. No registration or signup required!
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
                    <p className="text-gray-700 leading-relaxed">
                      CiteFinder searches across four major academic databases: arXiv (computer science, physics, math), OpenAlex (comprehensive academic database), CrossRef (journal articles and DOIs), and PubMed (biomedical papers).
                    </p>
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
                    Do you store my PDF files?
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
                      Yes, we store your PDFs securely in Vercel Blob storage and provide you with a public URL for future access. Your files are processed locally and stored securely for your convenience.
                    </p>
                  </div>
                )}
              </div>

              {/* FAQ Item 5 */}
              <div className="glass rounded-2xl shadow-soft overflow-hidden">
                <button
                  onClick={() => toggleFaq(4)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-white/20 transition-colors"
                >
                  <h3 className="text-xl font-bold text-gray-900">
                    Can I generate a references page from the extracted citations?
                  </h3>
                  {expandedFaq === 4 ? (
                    <ChevronUp className="w-6 h-6 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-gray-600" />
                  )}
                </button>
                {expandedFaq === 4 && (
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