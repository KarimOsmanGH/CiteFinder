'use client'

import { useState } from 'react'
import { FileText, Loader2, ChevronDown, ChevronUp, BookOpen, AlertTriangle, ArrowLeft } from 'lucide-react'
import PDFUploader from '@/components/PDFUploader'
import RelatedPapers from '@/components/RelatedPapers'
import InteractiveText from '@/components/InteractiveText'
import ReferencesGenerator from '@/components/ReferencesGenerator'
import { useToast } from '@/components/ui/Toast'
import { RelatedPaper, Citation, StatementWithPosition, ProcessResponse } from '@/types'

type FaqItem = {
  question: string
  answer?: string
  preface?: string
  list?: { label: string; detail: string; color: string }[]
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'How do I use CiteFinder?',
    answer:
      "Upload a PDF or paste text. We automatically extract key statements that need academic backing, search the world's largest academic databases (arXiv, OpenAlex, CrossRef, PubMed) to find supporting sources, and generate citations and references for you.",
  },
  {
    question: 'Which academic databases does CiteFinder search?',
    preface: 'CiteFinder searches across major academic databases:',
    list: [
      { label: 'arXiv', detail: 'Computer science, physics, mathematics', color: 'bg-brass' },
      { label: 'OpenAlex', detail: 'Comprehensive academic database', color: 'bg-teal' },
      { label: 'CrossRef', detail: 'Journal articles and DOIs', color: 'bg-ink-soft' },
      { label: 'PubMed', detail: 'Biomedical and life sciences', color: 'bg-ink-muted' },
    ],
  },
  {
    question: 'Can I generate formatted references?',
    answer:
      'Yes! CiteFinder includes a References Generator that formats your selected papers into APA, MLA, Chicago, Harvard, or BibTeX formats. You can copy or download the formatted references.',
  },
  {
    question: 'Is my data secure?',
    answer:
      'Yes! We never store your PDF files or text content. All processing happens temporarily, and your documents are deleted immediately after processing. Your research data remains private and secure.',
  },
]

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
    <main className="site-shell">
      <div className="relative container mx-auto px-4 pb-8 pt-6 sm:pt-8">
        {/* Navigation */}
        <nav className="mb-6 flex items-center justify-between sm:mb-8" role="navigation" aria-label="Main navigation">
          <a href="#upload" className="group flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink text-white transition-transform duration-300 group-hover:scale-105 sm:h-10 sm:w-10" aria-hidden="true">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
            </span>
            <span className="brand-mark text-lg text-ink sm:text-xl">CiteFinder</span>
          </a>
          
          <div className="flex items-center gap-1 sm:gap-2">
            <button 
              onClick={() => document.getElementById('upload')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-3 py-2 text-sm font-medium text-ink-muted transition-colors duration-200 hover:text-ink sm:px-4"
            >
              Home
            </button>
            <button 
              onClick={() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-3 py-2 text-sm font-medium text-ink-muted transition-colors duration-200 hover:text-ink sm:px-4"
            >
              FAQ
            </button>
          </div>
        </nav>

        {/* Hero — brand first, one composition */}
        {currentStep === 'upload' && (
          <header className="relative mx-auto mb-10 max-w-4xl text-center sm:mb-14">
            <div
              className="pointer-events-none absolute inset-x-0 -top-6 mx-auto h-[min(70vw,420px)] max-w-3xl rounded-[40%] bg-[radial-gradient(ellipse_at_center,rgba(31,107,92,0.14),transparent_70%)] animate-drift"
              aria-hidden="true"
            />
            <p className="brand-mark animate-fade-up text-[clamp(2.75rem,10vw,5.5rem)] font-bold text-ink">
              CiteFinder
            </p>
            <div className="section-rule mx-auto mt-5 max-w-[8rem] animate-rule-draw animate-delay-1" aria-hidden="true" />
            <h1 className="mt-6 animate-fade-up animate-delay-1 font-display text-xl font-semibold tracking-tight text-ink-soft sm:text-2xl md:text-3xl">
              Find sources for every claim.
            </h1>
            <p className="mx-auto mt-4 max-w-2xl animate-fade-up animate-delay-2 text-base leading-relaxed text-ink-muted sm:text-lg">
              Extract statements from your paper, search the world&apos;s largest academic databases, and generate citations.
            </p>
          </header>
        )}

        {/* Main Content */}
        <section id="upload" className="mx-auto max-w-6xl" aria-label="Main Application">
          {currentStep === 'upload' && (
            <section className="animate-fade-up animate-delay-3" aria-label="Search Options">
              <div className="mb-6 flex justify-center sm:mb-8">
                <div className="mode-toggle rounded-xl" role="tablist">
                  <button
                    role="tab"
                    aria-selected={searchMode === 'pdf'}
                    onClick={() => setSearchMode('pdf')}
                    className="rounded-lg"
                  >
                    Upload PDF
                  </button>
                  <button
                    role="tab"
                    aria-selected={searchMode === 'text'}
                    onClick={() => setSearchMode('text')}
                    className="rounded-lg"
                  >
                    Enter Text
                  </button>
                </div>
              </div>
              
              {searchMode === 'pdf' && (
                <div 
                  className="panel mx-auto max-w-2xl animate-fade-in rounded-2xl p-4 sm:p-5"
                  role="tabpanel"
                  aria-label="Upload PDF"
                >
                  <PDFUploader onFileUpload={handleFileUpload} />
                </div>
              )}

              {searchMode === 'text' && (
                <div 
                  className="panel mx-auto max-w-3xl animate-fade-in rounded-2xl p-6 sm:p-8"
                  role="tabpanel"
                  aria-label="Enter Text"
                >
                  <div className="mb-5 text-center">
                    <h2 className="font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl">
                      Paste your draft
                    </h2>
                    <p className="mt-2 text-sm text-ink-muted sm:text-base">
                      We&apos;ll flag claims that need backing and find supporting sources.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <label htmlFor="search-text" className="sr-only">Enter your academic text</label>
                    <textarea
                      id="search-text"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      placeholder="Paste your paper content here..."
                      className="h-48 w-full resize-none rounded-xl border border-ink/10 bg-surface p-4 text-ink placeholder:text-ink-muted/50 focus:border-teal focus:ring-2 focus:ring-teal/30"
                    />
                    <button
                      onClick={handleTextSearch}
                      disabled={!searchText.trim() || isProcessing}
                      className="btn-primary w-full rounded-xl px-8 py-3.5 text-base"
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
              <div className="panel mx-auto max-w-xl rounded-2xl p-10 text-center sm:p-12">
                <div className="relative mb-8 inline-flex">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ink animate-pulse-slow" role="status" aria-label="Processing">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                  </div>
                </div>
                <h2 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                  Processing your {searchMode === 'pdf' ? 'PDF' : 'text'}…
                </h2>
                <p className="mx-auto mt-3 max-w-md text-ink-muted">
                  Extracting statements and searching academic databases. This may take a moment.
                </p>
                <div className="mt-8 flex justify-center gap-2" aria-label="Progress indicators" role="status">
                  <div className="h-2 w-2 rounded-full bg-teal animate-pulse" aria-hidden="true" />
                  <div className="h-2 w-2 rounded-full bg-teal animate-pulse" style={{ animationDelay: '0.2s' }} aria-hidden="true" />
                  <div className="h-2 w-2 rounded-full bg-teal animate-pulse" style={{ animationDelay: '0.4s' }} aria-hidden="true" />
                </div>
              </div>
            </section>
          )}

          {currentStep === 'results' && (
            <section className="animate-fade-in" aria-label="Results">
              <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <p className="brand-mark text-2xl text-ink sm:text-3xl">CiteFinder</p>
                  <p className="mt-1 text-sm text-ink-muted">Your sources are ready to review</p>
                </div>
                <button
                  onClick={handleBackToUpload}
                  className="inline-flex items-center gap-2 rounded-xl border border-ink/15 bg-surface px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-ink/30 hover:bg-mist-soft"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  Back to Upload
                </button>
              </div>

              <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
                <aside className="w-full flex-shrink-0 lg:w-72" aria-label="Progress sidebar">
                  <div className="panel rounded-2xl p-5 lg:sticky lg:top-8">
                    <h3 className="mb-5 flex items-center gap-2.5 font-display text-lg font-semibold text-ink">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-white" aria-hidden="true">
                        <FileText className="h-4 w-4" />
                      </span>
                      Progress
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-1 lg:gap-5">
                      {[
                        { id: 'statements-section', title: 'Statements', meta: `${statementsFound.length} extracted`, done: statementsFound.length > 0, action: 'View', enabled: true },
                        { id: 'papers-section', title: 'Papers', meta: `${relatedPapers.length} found`, done: relatedPapers.length > 0, action: 'View', enabled: true },
                        { id: null, title: 'Selection', meta: `${selectedPapers.length} selected`, done: selectedPapers.length > 0, action: 'Select papers', enabled: false },
                        { id: 'references-section', title: 'Generate', meta: 'Create refs', done: selectedPapers.length > 0, action: selectedPapers.length > 0 ? 'Generate' : 'Select first', enabled: selectedPapers.length > 0 },
                      ].map((step) => (
                        <div key={step.title}>
                          <div className="mb-2 flex items-center gap-2.5">
                            <div
                              className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                                step.done ? 'bg-teal' : 'bg-ink-muted/40'
                              }`}
                              aria-hidden="true"
                            >
                              {step.done ? '✓' : '·'}
                            </div>
                            <div className="min-w-0">
                              <h4 className="truncate text-sm font-semibold text-ink">{step.title}</h4>
                              <p className="text-xs text-ink-muted">{step.meta}</p>
                            </div>
                          </div>
                          {step.id ? (
                            <button
                              onClick={() => document.getElementById(step.id!)?.scrollIntoView({ behavior: 'smooth' })}
                              disabled={!step.enabled}
                              className={`w-full rounded-lg px-3 py-2 text-left text-xs transition-colors sm:text-sm ${
                                step.enabled
                                  ? 'bg-mist text-teal hover:bg-mist-deep'
                                  : 'cursor-not-allowed bg-mist-soft text-ink-muted/50'
                              }`}
                            >
                              {step.action} →
                            </button>
                          ) : (
                            <div className="rounded-lg bg-mist px-3 py-2 text-xs text-teal sm:text-sm">
                              {step.action}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 hidden border-t border-ink/10 pt-5 sm:block">
                      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">Summary</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-ink-muted">Statements</span>
                          <span className="font-semibold text-ink">{statementsFound.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-ink-muted">Papers</span>
                          <span className="font-semibold text-ink">{relatedPapers.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-ink-muted">Selected</span>
                          <span className="font-semibold text-teal">{selectedPapers.length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </aside>

                <div className="min-w-0 flex-1 space-y-6">
                  {warnings.length > 0 && (
                    <article className="rounded-2xl border border-brass/30 bg-brass/10 p-4 sm:p-6">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-brass-deep" aria-hidden="true" />
                        <div>
                          <h3 className="text-base font-semibold text-ink sm:text-lg">Processing notes</h3>
                          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-ink-soft">
                            {warnings.map((warning, index) => (
                              <li key={`${warning}-${index}`}>{warning}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </article>
                  )}

                  <div id="statements-section">
                    {statementsWithPositions.length > 0 && (
                      <article className="panel rounded-2xl p-5 sm:p-6 lg:p-8">
                        <header className="mb-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
                          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-ink text-white" aria-hidden="true">
                            <BookOpen className="h-5 w-5" />
                          </div>
                          <div>
                            <h2 className="font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl">
                              {searchMode === 'pdf' ? 'Interactive PDF View' : 'Interactive Text View'}
                            </h2>
                            <p className="text-sm text-ink-muted sm:text-base">Highlighted statements with supporting papers</p>
                          </div>
                        </header>
                        <InteractiveText 
                          statementsWithPositions={statementsWithPositions}
                          relatedPapers={relatedPapers}
                        />
                      </article>
                    )}

                    {searchMode === 'text' && statementsWithPositions.length === 0 && statementsFound.length > 0 && (
                      <article className="panel rounded-2xl p-5 sm:p-6 lg:p-8">
                        <header className="mb-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
                          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-ink text-white" aria-hidden="true">
                            <BookOpen className="h-5 w-5" />
                          </div>
                          <div>
                            <h2 className="font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl">
                              Extracted Statements
                            </h2>
                            <p className="text-sm text-ink-muted sm:text-base">Review the statements extracted from your text</p>
                          </div>
                        </header>
                        <div className="space-y-3">
                          {statementsFound.map((statement, index) => (
                            <div key={index} className="rounded-xl border border-teal/15 bg-mist-soft p-4">
                              <div className="mb-2 flex items-center gap-2">
                                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-teal text-xs font-bold text-white">
                                  {index + 1}
                                </span>
                                <span className="text-sm font-medium text-teal">Statement {index + 1}</span>
                              </div>
                              <p className="leading-relaxed text-ink-soft">{statement}</p>
                            </div>
                          ))}
                        </div>
                      </article>
                    )}
                  </div>

                  <article id="papers-section" className="panel rounded-2xl p-5 sm:p-6 lg:p-8">
                    <header className="mb-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-teal text-white" aria-hidden="true">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl">
                          Supporting Papers
                        </h2>
                        <p className="text-sm text-ink-muted sm:text-base">Select papers to back your claims</p>
                      </div>
                    </header>
                    <RelatedPapers 
                      papers={relatedPapers} 
                      statementsFound={statementsFound}
                      selectedPapers={selectedPapers}
                      onPaperSelection={handlePaperSelection}
                    />
                  </article>

                  <article id="references-section" className="panel rounded-2xl p-5 sm:p-6 lg:p-8">
                    <header className="mb-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-ink text-white" aria-hidden="true">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl">
                          References Generator
                        </h2>
                        <p className="text-sm text-ink-muted sm:text-base">Format references from your selected papers</p>
                      </div>
                    </header>
                    <ReferencesGenerator citations={citations} selectedPapers={selectedPapers} />
                  </article>
                </div>
              </div>
            </section>
          )}
        </section>

        {/* FAQ */}
        <section id="faq" className="py-16 sm:py-20" aria-labelledby="faq-heading">
          <div className="mx-auto max-w-3xl">
            <div className="mb-10 text-center sm:mb-12">
              <h2 id="faq-heading" className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                Questions
              </h2>
              <p className="mt-3 text-ink-muted">
                Common questions about using CiteFinder for your research.
              </p>
            </div>

            <div className="divide-y divide-ink/10 border-y border-ink/10" role="list">
              {FAQ_ITEMS.map((item, index) => (
                <div key={item.question} role="listitem">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="flex w-full items-center justify-between gap-4 py-5 text-left transition-colors hover:text-teal"
                    aria-expanded={expandedFaq === index}
                    aria-controls={`faq-content-${index}`}
                  >
                    <h3 className="font-display text-lg font-semibold tracking-tight text-ink sm:text-xl">
                      {item.question}
                    </h3>
                    {expandedFaq === index ? (
                      <ChevronUp className="h-5 w-5 flex-shrink-0 text-ink-muted" aria-hidden="true" />
                    ) : (
                      <ChevronDown className="h-5 w-5 flex-shrink-0 text-ink-muted" aria-hidden="true" />
                    )}
                  </button>
                  {expandedFaq === index && (
                    <div id={`faq-content-${index}`} className="animate-fade-in pb-5 pr-8">
                      {item.preface && (
                        <p className="mb-3 leading-relaxed text-ink-soft">{item.preface}</p>
                      )}
                      {item.answer && (
                        <p className="leading-relaxed text-ink-soft">{item.answer}</p>
                      )}
                      {item.list && (
                        <ul className="space-y-2 text-ink-soft">
                          {item.list.map((entry) => (
                            <li key={entry.label} className="flex items-center gap-3">
                              <span className={`h-2.5 w-2.5 rounded-full ${entry.color}`} aria-hidden="true" />
                              <span><strong className="font-semibold text-ink">{entry.label}</strong> — {entry.detail}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
