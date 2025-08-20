'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { FileText, Upload, Clock, Crown, User, LogOut, ArrowLeft, Loader2, ChevronDown, ChevronUp, Settings } from 'lucide-react'
import PDFUploader from '@/components/PDFUploader'
import RelatedPapers from '@/components/RelatedPapers'
import ReferencesGenerator from '@/components/ReferencesGenerator'
import UsageLimit from '@/components/UsageLimit'
import { useUsage } from '@/hooks/useUsage'

interface UsageLog {
  id: string
  action: string
  timestamp: string
  metadata?: any
}

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
  statement?: string
}

interface ProcessResponse {
  citations: Citation[]
  relatedPapers: RelatedPaper[]
  textLength: number
  pages: number
  pdfUrl?: string
  fileName?: string
  statementsFound?: string[]
  existingCitationsCount?: number
  discoveredCitationsCount?: number
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [usageLogs, setUsageLogs] = useState<UsageLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [subscription, setSubscription] = useState<any>(null)
  
  // Main app functionality state
  const [citations, setCitations] = useState<Citation[]>([])
  const [relatedPapers, setRelatedPapers] = useState<RelatedPaper[]>([])
  const [selectedPapers, setSelectedPapers] = useState<RelatedPaper[]>([])
  const [pdfUrl, setPdfUrl] = useState<string>('')
  const [fileName, setFileName] = useState<string>('')
  const [statementsFound, setStatementsFound] = useState<string[]>([])
  const [existingCitationsCount, setExistingCitationsCount] = useState<number>(0)
  const [discoveredCitationsCount, setDiscoveredCitationsCount] = useState<number>(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentStep, setCurrentStep] = useState<'upload' | 'processing' | 'results'>('upload')
  const [searchText, setSearchText] = useState<string>('')
  const [searchMode, setSearchMode] = useState<'pdf' | 'text'>('pdf')
  
  // Usage tracking
  const { sessionId, canUseService, subscriptionPlan, isAuthenticated } = useUsage()
  const [hasInteracted, setHasInteracted] = useState(false)

  useEffect(() => {
    // In development, bypass authentication check
    if (process.env.NODE_ENV === 'development') {
      fetchUserData()
      return
    }
    
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (session && process.env.NODE_ENV !== 'development') {
      fetchUserData()
    }
  }, [session])

  const fetchUserData = async () => {
    try {
      // Fetch usage logs
      const logsResponse = await fetch('/api/usage/history')
      if (logsResponse.ok) {
        const logs = await logsResponse.json()
        setUsageLogs(logs)
      }

      // Fetch subscription info
      const subResponse = await fetch('/api/user/subscription')
      if (subResponse.ok) {
        const sub = await subResponse.json()
        setSubscription(sub)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Main app functionality methods
  const handleFileUpload = async (file: File) => {
    // Mark that user has interacted
    setHasInteracted(true)
    
    // Check usage limit first
    const canUse = await canUseService('pdf_upload')
    if (!canUse) {
      alert('Usage limit exceeded. Anonymous users get 3 citations per 24 hours. Please sign up for unlimited access.')
      return
    }

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
      setExistingCitationsCount(data.existingCitationsCount || 0)
      setDiscoveredCitationsCount(data.discoveredCitationsCount || 0)
      setPdfUrl(data.pdfUrl || '')
      setFileName(data.fileName || '')
      setCurrentStep('results')
    } catch (error) {
      console.error('Error processing PDF:', error)
      alert('Failed to process PDF. Please try again.')
      setCurrentStep('upload')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleTextSearch = async () => {
    if (!searchText.trim()) return

    // Mark that user has interacted
    setHasInteracted(true)
    
    // Check usage limit first
    const canUse = await canUseService('text_process')
    if (!canUse) {
      alert('Usage limit exceeded. Anonymous users get 3 citations per 24 hours. Please sign up for unlimited access.')
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
        throw new Error('Failed to process text')
      }

      const data: ProcessResponse = await response.json()
      setCitations(data.citations)
      setRelatedPapers(data.relatedPapers)
      setStatementsFound(data.statementsFound || [])
      setExistingCitationsCount(data.existingCitationsCount || 0)
      setDiscoveredCitationsCount(data.discoveredCitationsCount || 0)
      setCurrentStep('results')
    } catch (error) {
      console.error('Error processing text:', error)
      alert('Failed to process text. Please try again.')
      setCurrentStep('upload')
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePaperSelection = (paper: RelatedPaper, isSelected: boolean) => {
    if (isSelected) {
      setSelectedPapers(prev => [...prev, paper])
    } else {
      setSelectedPapers(prev => prev.filter(p => p.id !== paper.id))
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  // In development, allow access without session
  if (!session && process.env.NODE_ENV !== 'development') {
    return null
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'pdf_upload':
        return <Upload className="w-4 h-4" />
      case 'text_process':
        return <FileText className="w-4 h-4" />
      case 'citation_generate':
        return <FileText className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'pdf_upload':
        return 'PDF Upload'
      case 'text_process':
        return 'Text Processing'
      case 'citation_generate':
        return 'Citation Generated'
      default:
        return action
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/70 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/')}
                className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-3">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">Dashboard</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {session?.user?.image ? (
                  <img 
                    src={session.user.image} 
                    alt={session.user.name || 'User'} 
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
                <span className="text-sm font-medium text-gray-700">
                  {session?.user?.name || session?.user?.email || 'Dev User'}
                </span>
              </div>
              <button
                onClick={() => router.push('/dashboard/settings')}
                className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={() => router.push('/')}
                className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
                title="Back to Home"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back!</h1>
          <p className="text-gray-600">Upload your paper or paste text to find academic sources and generate citations</p>
        </div>

        {/* Main Application */}
        <section id="upload" className="max-w-6xl mx-auto" aria-label="Main Application">
          {currentStep === 'upload' && (
            <section className="animate-fade-in-up" aria-label="Search Options">
              {/* Search Mode Toggle */}
              <div className="flex justify-center mb-8">
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-1 border border-gray-300 shadow-sm">
                  <button
                    onClick={() => setSearchMode('pdf')}
                    className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                      searchMode === 'pdf'
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    Upload PDF
                  </button>
                  <button
                    onClick={() => setSearchMode('text')}
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
                  {/* Usage Limit Banner */}
                  <UsageLimit 
                    sessionId={sessionId} 
                    isAuthenticated={isAuthenticated}
                    subscriptionPlan={subscriptionPlan}
                  />
                  
                  {/* Premium User Indicator */}
                  {subscriptionPlan === 'premium' && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <Crown className="w-5 h-5 text-purple-600" />
                        <span className="text-purple-800 font-medium">Premium User - Unlimited Access</span>
                      </div>
                    </div>
                  )}
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
              {/* Citations list removed per new UX: we only show statements with related papers below */}

              {/* Related Papers Section */}
              <article className="bg-white rounded-2xl shadow-soft p-8 hover-lift border border-gray-200">
                <RelatedPapers 
                  papers={relatedPapers} 
                  statementsFound={statementsFound}
                  selectedPapers={selectedPapers}
                  onPaperSelection={handlePaperSelection}
                />
              </article>

              {/* References Generator Section */}
              <article className="bg-white rounded-2xl shadow-soft p-8 hover-lift border border-gray-200">
                <header className="flex items-center mb-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mr-4" aria-hidden="true">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">
                      References Generator
                    </h2>
                    <p className="text-gray-600">Generate properly formatted references for your selected papers</p>
                  </div>
                </header>
                <ReferencesGenerator 
                  selectedPapers={selectedPapers}
                  citations={citations}
                />
              </article>
            </section>
          )}
        </section>
      </div>
    </div>
  )
} 