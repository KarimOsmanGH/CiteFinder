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

export default function Home() {
  const [citations, setCitations] = useState<Citation[]>([])
  const [relatedPapers, setRelatedPapers] = useState<RelatedPaper[]>([])
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

      const data = await response.json()
      setCitations(data.citations)
      setRelatedPapers(data.relatedPapers)
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
          <div className="flex space-x-4">
            <Link 
              href="/pricing" 
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Pricing
            </Link>
            <Link 
              href="/faq" 
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              FAQ
            </Link>
            <Link 
              href="/contact" 
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
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
        <section className="max-w-6xl mx-auto" aria-label="Main Application">
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
      </div>
    </main>
  )
} 