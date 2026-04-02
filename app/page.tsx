'use client'

import { useState } from 'react'
import { FileText, Loader2, ChevronDown, ChevronUp, BookOpen, AlertTriangle } from 'lucide-react'
import PDFUploader from '@/components/PDFUploader'
import RelatedPapers from '@/components/RelatedPapers'
import InteractiveText from '@/components/InteractiveText'
import ReferencesGenerator from '@/components/ReferencesGenerator'
import { useToast } from '@/components/ui/Toast'
import { RelatedPaper, Citation, StatementWithPosition, ProcessResponse } from '@/types'

export default function Home() {
  const { showToast } = useToast()
  const [citations, setCitations] = useState<Citation[]>([])
  const [relatedPapers, setRelatedPapers] = useState<RelatedPaper[]>([])
  const [selectedPapers, setSelectedPapers] = useState<RelatedPaper[]>([])
  const [statementsFound, setStatementsFound] = useState<string[]>([])
  const [statementsWithPositions, setStatementsWithPositions] = useState<StatementWithPosition[]>([])
  const [warnings, setWarnings] = useState<string[]>([])
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
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to process PDF')
      }

      const data: ProcessResponse = await response.json()
      setCitations(data.citations)
      setRelatedPapers(data.relatedPapers)
      setStatementsFound(data.statementsFound || [])
      setStatementsWithPositions(data.statementsWithPositions || [])
      setWarnings(data.warnings || [])
      setCurrentStep('results')
      showToast('PDF processed successfully!', 'success')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      showToast(`Error processing PDF: ${errorMessage}`, 'error')
      setCurrentStep('upload')
    } finally {
      setIsProcessing(false)
    }
  }

  const toggleFaq = (index: number) => {
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
    if (!searchText.trim()) {
      showToast('Please enter some text to analyze', 'warning')
      return
    }
    
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
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to process text')
      }

      const data: ProcessResponse = await response.json()
      
      setCitations(data.citations || [])
      setRelatedPapers(data.relatedPapers || [])
      setStatementsFound(data.statementsFound || [])
      setStatementsWithPositions(data.statementsWithPositions || [])
      setWarnings(data.warnings || [])
      setCurrentStep('results')
      showToast('Text analyzed successfully!', 'success')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      showToast(`Error processing text: ${errorMessage}`, 'error')
      setCurrentStep('upload')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBackToUpload = () => {
    setCurrentStep('upload')
    setSelectedPapers([])
    setWarnings([])
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-blue-100">
      <div className="relative container mx-auto px-4 py-8">
        {/* Navigation */}
        <nav className="flex justify-between items-center mb-4" role="navigation" aria-label="Main navigation">
          <div className="flex items-center space-x-3 sm:space-x-6 lg:space-x-8">
            {/* Logo */}
            <div className="flex items-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center mr-2 sm:mr-3">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" aria-hidden="true" />
              </div>
              <span className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">CiteFinder</span>
            </div>
            
            {/* Menu Items */}
            <div className="flex space-x-2 sm:space-x-4">
              <button 
                onClick={() => document.getElementById('upload')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 text-xs sm:text-sm lg:text-base text-gray-700 hover:text-gray-900 font-medium transition-colors duration-200"
              >
                Home
              </button>
              <button 
                onClick={() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 text-xs sm:text-sm lg:text-base text-gray-700 hover:text-gray-900 font-medium transition-colors duration-200"
              >
                FAQ
              </button>
            </div>
          </div>
        </nav>

        {/* Header */}
        <header className="text-center mb-8 sm:mb-12 lg:mb-16 animate-fade-in-up px-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold gradient-text mb-4 sm:mb-6 lg:mb-8 mt-8 sm:mt-12 lg:mt-16 leading-tight sm:leading-relaxed py-2 sm:py-4">
            Academic Source Finder
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Automatically extract statements from your paper, find sources from the world&apos;s largest academic databases, and generate citations.
          </p>
        </header>

        {/* Main Content */}
        <section id="upload" className="max-w-6xl mx-auto" aria-label="Main Application">
          {currentStep === 'upload' && (
            <section className="animate-fade-in-up" aria-label="Search Options">
              {/* Search Mode Toggle */}
              <div className="flex justify-center mb-8">
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-1 border border-gray-300 shadow-sm" role="tablist">
                  <button
                    role="tab"
                    aria-selected={searchMode === 'pdf'}
                    onClick={() => setSearchMode('pdf')}
                    className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                      searchMode === 'pdf'
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    Upload PDF
                  </button>
                  <button
                    role="tab"
                    aria-selected={searchMode === 'text'}
                    onClick={() => setSearchMode('text')}
                    className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                      searchMode === 'text'
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    Enter Text
                  </button>
                </div>
              </div>
              
              {/* PDF Upload Option */}
              {searchMode === 'pdf' && (
                <div 
                  className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-soft p-4 hover-lift animate-fade-in max-w-2xl mx-auto border border-gray-200"
                  role="tabpanel"
                  aria-labelledby="Upload PDF"
                >
                  <PDFUploader onFileUpload={handleFileUpload} />
                </div>
              )}

              {/* Text Search Option */}
              {searchMode === 'text' && (
                <div 
                  className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-soft p-8 hover-lift animate-fade-in border border-gray-200"
                  role="tabpanel"
                  aria-labelledby="Enter Text"
                >
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Enter Your Text</h3>
                    <p className="text-gray-600">Paste your content and our AI will identify statements that need academic backing, then find sources to support them</p>
                  </div>
                  <div className="space-y-4">
                    <label htmlFor="search-text" className="sr-only">Enter your academic text</label>
                    <textarea
                      id="search-text"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      placeholder="Paste your paper content here... Our AI will find academic sources to support your ideas and generate proper citations."
                      className="w-full h-48 p-4 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                    />
                    <button
                      onClick={handleTextSearch}
                      disabled={!searchText.trim()}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 hover-lift shadow-glow disabled:cursor-not-allowed"
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
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-soft p-12 text-center border border-gray-200">
                <div className="relative mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto animate-pulse-slow" role="status" aria-label="Processing">
                    <Loader2 className="w-10 h-10 text-white animate-spin" />
                  </div>
                  <div className="absolute inset-0 w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full opacity-20 animate-ping mx-auto" aria-hidden="true"></div>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Processing your {searchMode === 'pdf' ? 'PDF' : 'text'}...
                </h2>
                <p className="text-lg text-gray-600 max-w-md mx-auto">
                  Extracting citations and searching across academic databases. This may take a few moments.
                </p>
                
                {/* Progress indicators */}
                <div className="flex justify-center space-x-2 mt-8" aria-label="Progress indicators" role="status">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" aria-hidden="true"></div>
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}} aria-hidden="true"></div>
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}} aria-hidden="true"></div>
                </div>
              </div>
            </section>
          )}

          {currentStep === 'results' && (
            <section className="animate-fade-in" aria-label="Results">
              {/* Back to Upload Button */}
              <div className="text-center mb-8">
                <button
                  onClick={handleBackToUpload}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-semibold rounded-xl transition-all duration-300 hover-lift shadow-glow"
                >
                  ← Back to Upload
                </button>
              </div>

              {/* Two-Column Layout */}
              <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
                
                {/* Left Sidebar - Progress & Navigation */}
                <aside className="w-full lg:w-80 flex-shrink-0" aria-label="Progress sidebar">
                  <div className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-soft p-4 sm:p-6 lg:sticky lg:top-8 border border-gray-200">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center">
                      <span className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-2 sm:mr-3">
                        <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" aria-hidden="true" />
                      </span>
                      Your Progress
                    </h3>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4 lg:gap-6">
                      {/* Step 1: Statements */}
                      <div>
                        <div className="flex items-center mb-2 lg:mb-3">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm mr-2 sm:mr-3 flex-shrink-0" aria-hidden="true">
                            ✓
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-semibold text-gray-900 text-xs sm:text-sm truncate">Step 1: Statements</h4>
                            <p className="text-xs text-gray-600">{statementsFound.length} extracted</p>
                          </div>
                        </div>
                        <button
                          onClick={() => document.getElementById('statements-section')?.scrollIntoView({ behavior: 'smooth' })}
                          className="w-full text-left px-3 sm:px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs sm:text-sm transition-colors"
                        >
                          View →
                        </button>
                      </div>

                      {/* Step 2: Papers */}
                      <div>
                        <div className="flex items-center mb-2 lg:mb-3">
                          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm mr-2 sm:mr-3 flex-shrink-0 ${
                            relatedPapers.length > 0 ? 'bg-green-500' : 'bg-gray-400'
                          }`} aria-hidden="true">
                            {relatedPapers.length > 0 ? '✓' : '2'}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-semibold text-gray-900 text-xs sm:text-sm truncate">Step 2: Papers</h4>
                            <p className="text-xs text-gray-600">{relatedPapers.length} found</p>
                          </div>
                        </div>
                        <button
                          onClick={() => document.getElementById('papers-section')?.scrollIntoView({ behavior: 'smooth' })}
                          className="w-full text-left px-3 sm:px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-xs sm:text-sm transition-colors"
                        >
                          View →
                        </button>
                      </div>

                      {/* Step 3: Selection */}
                      <div>
                        <div className="flex items-center mb-2 lg:mb-3">
                          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm mr-2 sm:mr-3 flex-shrink-0 ${
                            selectedPapers.length > 0 ? 'bg-green-500' : 'bg-gray-400'
                          }`} aria-hidden="true">
                            {selectedPapers.length > 0 ? '✓' : '3'}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-semibold text-gray-900 text-xs sm:text-sm truncate">Step 3: Selection</h4>
                            <p className="text-xs text-gray-600">{selectedPapers.length} selected</p>
                          </div>
                        </div>
                        <div className="px-3 sm:px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs sm:text-sm">
                          Select papers
                        </div>
                      </div>

                      {/* Step 4: Generate */}
                      <div>
                        <div className="flex items-center mb-2 lg:mb-3">
                          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm mr-2 sm:mr-3 flex-shrink-0 ${
                            selectedPapers.length > 0 ? 'bg-green-500' : 'bg-gray-400'
                          }`} aria-hidden="true">
                            {selectedPapers.length > 0 ? '✓' : '4'}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-semibold text-gray-900 text-xs sm:text-sm truncate">Step 4: Generate</h4>
                            <p className="text-xs text-gray-600">Create refs</p>
                          </div>
                        </div>
                        <button
                          onClick={() => document.getElementById('references-section')?.scrollIntoView({ behavior: 'smooth' })}
                          className={`w-full text-left px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm transition-colors ${
                            selectedPapers.length > 0 
                              ? 'bg-blue-50 hover:bg-blue-100 text-blue-700' 
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                          disabled={selectedPapers.length === 0}
                        >
                          {selectedPapers.length > 0 ? 'Generate →' : 'Select first'}
                        </button>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="hidden sm:block mt-6 lg:mt-8 pt-4 lg:pt-6 border-t border-gray-200">
                      <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">Summary</h4>
                      <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Statements:</span>
                          <span className="font-semibold text-gray-900">{statementsFound.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Papers Found:</span>
                          <span className="font-semibold text-gray-900">{relatedPapers.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Selected:</span>
                          <span className="font-semibold text-green-600">{selectedPapers.length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </aside>

                {/* Right Content - Main Results */}
                <main className="flex-1 min-w-0 space-y-4 sm:space-y-6 lg:space-y-8">
                  {warnings.length > 0 && (
                    <article className="bg-amber-50 border border-amber-200 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-700 mt-0.5 flex-shrink-0" aria-hidden="true" />
                        <div>
                          <h3 className="text-base sm:text-lg font-semibold text-amber-900">Processing notes</h3>
                          <ul className="mt-2 space-y-1 text-sm text-amber-800 list-disc list-inside">
                            {warnings.map((warning, index) => (
                              <li key={`${warning}-${index}`}>{warning}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </article>
                  )}

                  
                  {/* Interactive Content View Section */}
                  <div id="statements-section">
                    {statementsWithPositions.length > 0 && (
                      <article className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-soft p-4 sm:p-6 lg:p-8 hover-lift border border-gray-200">
                        <header className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6 lg:mb-8">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0" aria-hidden="true">
                            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          </div>
                          <div>
                            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                              {searchMode === 'pdf' ? 'Interactive PDF View' : 'Interactive Text View'}
                            </h2>
                            <p className="text-sm sm:text-base text-gray-600">Review your content with highlighted statements and supporting papers</p>
                          </div>
                        </header>
                        <InteractiveText 
                          statementsWithPositions={statementsWithPositions}
                          relatedPapers={relatedPapers}
                        />
                      </article>
                    )}

                    {/* Fallback for text mode without highlights */}
                    {searchMode === 'text' && statementsWithPositions.length === 0 && statementsFound.length > 0 && (
                      <article className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-soft p-4 sm:p-6 lg:p-8 hover-lift border border-gray-200">
                        <header className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6 lg:mb-8">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0" aria-hidden="true">
                            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          </div>
                          <div>
                            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                              Extracted Statements
                            </h2>
                            <p className="text-sm sm:text-base text-gray-600">Review the statements extracted from your text</p>
                          </div>
                        </header>
                        <div className="space-y-4">
                          {statementsFound.map((statement, index) => (
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
                          ))}
                        </div>
                      </article>
                    )}
                  </div>

                  {/* Supporting Papers Section */}
                  <article id="papers-section" className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-soft p-4 sm:p-6 lg:p-8 hover-lift border border-gray-200">
                    <header className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6 lg:mb-8">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0" aria-hidden="true">
                        <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                          Supporting Papers
                        </h2>
                        <p className="text-sm sm:text-base text-gray-600">Select academic papers to support your statements and claims</p>
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
                  <article id="references-section" className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-soft p-4 sm:p-6 lg:p-8 hover-lift border border-gray-200">
                    <header className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6 lg:mb-8">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0" aria-hidden="true">
                        <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                          References Generator
                        </h2>
                        <p className="text-sm sm:text-base text-gray-600">Generate formatted references from your selected papers</p>
                      </div>
                    </header>
                    <ReferencesGenerator citations={citations} selectedPapers={selectedPapers} />
                  </article>
                </main>
              </div>
            </section>
          )}
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-16" aria-labelledby="faq-heading">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 id="faq-heading" className="text-4xl font-bold gradient-text mb-6">
                Frequently Asked Questions
              </h2>
              <p className="text-xl text-gray-600">
                Common questions about using CiteFinder for your research.
              </p>
            </div>

            <div className="space-y-4" role="list">
              {/* FAQ Item 1 */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-soft overflow-hidden border border-gray-200">
                <button
                  onClick={() => toggleFaq(0)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-white/20 transition-colors"
                  aria-expanded={expandedFaq === 0}
                  aria-controls="faq-content-0"
                >
                  <h3 className="text-xl font-bold text-gray-900">
                    How do I use CiteFinder?
                  </h3>
                  {expandedFaq === 0 ? (
                    <ChevronUp className="w-6 h-6 text-gray-600" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-gray-600" aria-hidden="true" />
                  )}
                </button>
                {expandedFaq === 0 && (
                  <div id="faq-content-0" className="px-6 pb-6">
                    <p className="text-gray-700 leading-relaxed">
                      Upload a PDF or paste text. We automatically extract key statements that need academic backing, search the world&apos;s largest academic databases (arXiv, OpenAlex, CrossRef, PubMed) to find supporting sources, and generate citations and references for you.
                    </p>
                  </div>
                )}
              </div>

              {/* FAQ Item 2 */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-soft overflow-hidden border border-gray-200">
                <button
                  onClick={() => toggleFaq(1)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-white/20 transition-colors"
                  aria-expanded={expandedFaq === 1}
                  aria-controls="faq-content-1"
                >
                  <h3 className="text-xl font-bold text-gray-900">
                    Which academic databases does CiteFinder search?
                  </h3>
                  {expandedFaq === 1 ? (
                    <ChevronUp className="w-6 h-6 text-gray-600" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-gray-600" aria-hidden="true" />
                  )}
                </button>
                {expandedFaq === 1 && (
                  <div id="faq-content-1" className="px-6 pb-6">
                    <p className="text-gray-700 leading-relaxed mb-4">
                      CiteFinder searches across major academic databases:
                    </p>
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-center"><span className="w-3 h-3 bg-orange-500 rounded-full mr-3"></span><strong>arXiv</strong> - Computer science, physics, mathematics</li>
                      <li className="flex items-center"><span className="w-3 h-3 bg-blue-500 rounded-full mr-3"></span><strong>OpenAlex</strong> - Comprehensive academic database</li>
                      <li className="flex items-center"><span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span><strong>CrossRef</strong> - Journal articles and DOIs</li>
                      <li className="flex items-center"><span className="w-3 h-3 bg-purple-500 rounded-full mr-3"></span><strong>PubMed</strong> - Biomedical and life sciences</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* FAQ Item 3 */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-soft overflow-hidden border border-gray-200">
                <button
                  onClick={() => toggleFaq(2)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-white/20 transition-colors"
                  aria-expanded={expandedFaq === 2}
                  aria-controls="faq-content-2"
                >
                  <h3 className="text-xl font-bold text-gray-900">
                    Can I generate formatted references?
                  </h3>
                  {expandedFaq === 2 ? (
                    <ChevronUp className="w-6 h-6 text-gray-600" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-gray-600" aria-hidden="true" />
                  )}
                </button>
                {expandedFaq === 2 && (
                  <div id="faq-content-2" className="px-6 pb-6">
                    <p className="text-gray-700 leading-relaxed">
                      Yes! CiteFinder includes a References Generator that formats your selected papers into APA, MLA, Chicago, Harvard, or BibTeX formats. You can copy or download the formatted references.
                    </p>
                  </div>
                )}
              </div>

              {/* FAQ Item 4 */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-soft overflow-hidden border border-gray-200">
                <button
                  onClick={() => toggleFaq(3)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-white/20 transition-colors"
                  aria-expanded={expandedFaq === 3}
                  aria-controls="faq-content-3"
                >
                  <h3 className="text-xl font-bold text-gray-900">
                    Is my data secure?
                  </h3>
                  {expandedFaq === 3 ? (
                    <ChevronUp className="w-6 h-6 text-gray-600" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-gray-600" aria-hidden="true" />
                  )}
                </button>
                {expandedFaq === 3 && (
                  <div id="faq-content-3" className="px-6 pb-6">
                    <p className="text-gray-700 leading-relaxed">
                      Yes! We never store your PDF files or text content. All processing happens temporarily, and your documents are deleted immediately after processing. Your research data remains private and secure.
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
