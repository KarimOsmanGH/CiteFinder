'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Upload, FileText, Search, Loader2 } from 'lucide-react'
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
}

export default function Home() {
  const [citations, setCitations] = useState<Citation[]>([])
  const [relatedPapers, setRelatedPapers] = useState<RelatedPaper[]>([])
  const [pdfUrl, setPdfUrl] = useState<string>('')
  const [fileName, setFileName] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentStep, setCurrentStep] = useState<'upload' | 'processing' | 'results'>('upload')

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

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-pink-400/20 to-orange-400/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative container mx-auto px-4 py-12">
        {/* Navigation */}
        <nav className="flex justify-end mb-8">
          <div className="flex space-x-3">
            <button 
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-4 py-2 bg-white/70 backdrop-blur-sm hover:bg-white/90 text-gray-700 hover:text-gray-900 font-medium rounded-lg border border-white/30 hover:border-white/50 transition-all duration-200 hover:shadow-md"
            >
              Pricing
            </button>
            <button 
              onClick={() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-4 py-2 bg-white/70 backdrop-blur-sm hover:bg-white/90 text-gray-700 hover:text-gray-900 font-medium rounded-lg border border-white/30 hover:border-white/50 transition-all duration-200 hover:shadow-md"
            >
              FAQ
            </button>
            <Link 
              href="/contact" 
              className="px-4 py-2 bg-white/70 backdrop-blur-sm hover:bg-white/90 text-gray-700 hover:text-gray-900 font-medium rounded-lg border border-white/30 hover:border-white/50 transition-all duration-200 hover:shadow-md"
            >
              Contact
            </Link>
          </div>
        </nav>

        {/* Header */}
        <header className="text-center mb-16 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-glow mb-6" role="img" aria-label="CiteFinder Logo">
            <FileText className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold gradient-text mb-6">
            CiteFinder
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Transform your research workflow. Upload any PDF and instantly extract citations while discovering related papers from the world's largest academic databases. Generate a one-click references page for your research.
          </p>
          
          {/* Feature highlights */}
          <section className="flex justify-center items-center space-x-4 mt-8" aria-label="Key Features">
            <div className="inline-flex items-center px-3 py-1 rounded-full border border-green-200 bg-green-50 text-green-700 text-sm font-medium">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2" aria-hidden="true"></div>
              <span>Free & No Signup</span>
            </div>
            <div className="inline-flex items-center px-3 py-1 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-sm font-medium">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2" aria-hidden="true"></div>
              <span>4 Academic Databases</span>
            </div>
            <div className="inline-flex items-center px-3 py-1 rounded-full border border-purple-200 bg-purple-50 text-purple-700 text-sm font-medium">
              <div className="w-2 h-2 bg-purple-500 rounded-full mr-2" aria-hidden="true"></div>
              <span>Instant Results</span>
            </div>
            <div className="inline-flex items-center px-3 py-1 rounded-full border border-orange-200 bg-orange-50 text-orange-700 text-sm font-medium">
              <div className="w-2 h-2 bg-orange-500 rounded-full mr-2" aria-hidden="true"></div>
              <span>References Generator</span>
            </div>
          </section>
        </header>

        {/* Main Content */}
        <section id="upload" className="max-w-6xl mx-auto" aria-label="Main Application">
          {currentStep === 'upload' && (
            <section className="animate-fade-in-up" aria-label="File Upload">
              <div className="glass rounded-2xl shadow-soft p-8 hover-lift">
                <PDFUploader onFileUpload={handleFileUpload} />
              </div>
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
                  Processing your PDF...
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
                    <p className="text-gray-600">{citations.length} citations extracted from your PDF</p>
                  </div>
                </header>
                <CitationList citations={citations} />
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

                          {/* Stored PDF Information */}
                          {pdfUrl && (
                            <article className="glass rounded-2xl shadow-soft p-8 hover-lift">
                              <header className="flex items-center mb-8">
                                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mr-4" aria-hidden="true">
                                  <FileText className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                  <h2 className="text-3xl font-bold text-gray-900">
                                    Stored PDF
                                  </h2>
                                  <p className="text-gray-600">Your PDF has been securely stored and is available for future access</p>
                                </div>
                              </header>
                              
                              <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-white/30">
                                <div className="flex items-center justify-between mb-4">
                                  <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                      {fileName || 'Uploaded PDF'}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                      Stored securely in Vercel Blob storage
                                    </p>
                                  </div>
                                  <a
                                    href={pdfUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold px-4 py-2 rounded-lg transition-all duration-300 hover-lift"
                                  >
                                    View PDF
                                  </a>
                                </div>
                                
                                <div className="bg-gray-50 rounded-lg p-3">
                                  <p className="text-sm text-gray-600 font-mono break-all">
                                    {pdfUrl}
                                  </p>
                                </div>
                              </div>
                            </article>
                          )}

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
                Simple, Transparent Pricing
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
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold text-2xl">⚡</span>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">Free</h3>
                  <div className="text-4xl font-bold text-gray-900 mb-2">$0</div>
                  <p className="text-gray-600">Forever free for academic research</p>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center">
                    <span className="text-green-500 mr-3">✅</span>
                    <span>Unlimited PDF uploads</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-green-500 mr-3">✅</span>
                    <span>Citation extraction from all formats</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-green-500 mr-3">✅</span>
                    <span>Search across 4 academic databases</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-green-500 mr-3">✅</span>
                    <span>Up to 15 related papers per search</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-green-500 mr-3">✅</span>
                    <span>No registration required</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-green-500 mr-3">✅</span>
                    <span>References Generator</span>
                  </div>
                </div>

                <button 
                  onClick={() => document.getElementById('upload')?.scrollIntoView({ behavior: 'smooth' })}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover-lift shadow-glow"
                >
                  Start Using Free
                </button>
              </div>

              {/* Premium Plan */}
              <div className="glass rounded-2xl shadow-soft p-8 hover-lift relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Coming Soon
                  </span>
                </div>

                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold text-2xl">⭐</span>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">Premium</h3>
                  <div className="text-4xl font-bold text-gray-900 mb-2">$9.99</div>
                  <p className="text-gray-600">Per month for power users</p>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center">
                    <span className="text-purple-500 mr-3">✅</span>
                    <span>Everything in Free plan</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-purple-500 mr-3">✅</span>
                    <span>Unlimited related papers</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-purple-500 mr-3">✅</span>
                    <span>Advanced citation validation</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-purple-500 mr-3">✅</span>
                    <span>Export to BibTeX, EndNote, Mendeley</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-purple-500 mr-3">✅</span>
                    <span>Citation network visualization</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-purple-500 mr-3">✅</span>
                    <span>Priority API access</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-purple-500 mr-3">✅</span>
                    <span>Email support</span>
                  </div>
                </div>

                <button 
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover-lift shadow-glow opacity-50 cursor-not-allowed"
                  disabled
                >
                  Coming Soon
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-16 bg-gradient-to-br from-gray-50 to-blue-50">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold gradient-text mb-6">
                Frequently Asked Questions
              </h2>
              <p className="text-xl text-gray-600">
                Find answers to common questions about CiteFinder
              </p>
            </div>

            <div className="space-y-6">
              {/* FAQ Item 1 */}
              <div className="glass rounded-2xl shadow-soft p-8 hover-lift">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  How do I use CiteFinder?
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  Simply upload a PDF file using our drag-and-drop interface. CiteFinder will automatically extract citations from your document and search for related papers across multiple academic databases. No registration or signup required!
                </p>
              </div>

              {/* FAQ Item 2 */}
              <div className="glass rounded-2xl shadow-soft p-8 hover-lift">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  What citation formats does CiteFinder recognize?
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  CiteFinder recognizes multiple citation formats including APA, MLA, Chicago, Harvard, and simple author-year formats. We also detect citations with 'et al.' and various punctuation styles.
                </p>
              </div>

              {/* FAQ Item 3 */}
              <div className="glass rounded-2xl shadow-soft p-8 hover-lift">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Which academic databases does CiteFinder search?
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  CiteFinder searches across four major academic databases: arXiv (computer science, physics, math), OpenAlex (comprehensive academic database), CrossRef (journal articles and DOIs), and PubMed (biomedical papers).
                </p>
              </div>

              {/* FAQ Item 4 */}
              <div className="glass rounded-2xl shadow-soft p-8 hover-lift">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Is CiteFinder really free?
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  Yes! Our core features are completely free and will remain free. We believe academic research tools should be accessible to everyone. Premium features will be optional add-ons.
                </p>
              </div>

              {/* FAQ Item 5 */}
              <div className="glass rounded-2xl shadow-soft p-8 hover-lift">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Do you store my PDF files?
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  Yes, we store your PDFs securely in Vercel Blob storage and provide you with a public URL for future access. Your files are processed locally and stored securely for your convenience.
                </p>
              </div>

              {/* FAQ Item 6 */}
              <div className="glass rounded-2xl shadow-soft p-8 hover-lift">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Can I generate a references page from the extracted citations?
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  Yes! CiteFinder includes a References Generator that can format your extracted citations into properly formatted reference lists in APA, MLA, Chicago, Harvard, or BibTeX formats. You can copy or download the formatted references.
                </p>
              </div>
            </div>

            <div className="text-center mt-12">
              <Link 
                href="/contact"
                className="inline-flex items-center bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 hover-lift shadow-glow"
              >
                Still Need Help? Contact Us
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
} 