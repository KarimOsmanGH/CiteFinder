'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { FileText, Upload, Clock, Crown, User, LogOut, ArrowLeft } from 'lucide-react'

interface UsageLog {
  id: string
  action: string
  timestamp: string
  metadata?: any
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [usageLogs, setUsageLogs] = useState<UsageLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [subscription, setSubscription] = useState<any>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
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

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!session) {
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
                <span className="text-xl font-bold text-gray-900">CiteFinder</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {session.user?.image ? (
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
                  {session.user?.name || session.user?.email}
                </span>
              </div>
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

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back!</h1>
          <p className="text-gray-600">Manage your account and view your usage history</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Account Info */}
          <div className="lg:col-span-1">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-soft p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Account Information
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Name</label>
                  <p className="text-gray-900">{session.user?.name || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-gray-900">{session.user?.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Member Since</label>
                  <p className="text-gray-900">{formatDate(new Date().toISOString())}</p>
                </div>
              </div>
            </div>

            {/* Subscription Status */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-soft p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Crown className="w-5 h-5 mr-2" />
                Subscription
              </h2>
              {subscription ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Plan</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      subscription.plan === 'premium' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {subscription.plan === 'premium' ? 'Premium' : 'Free'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Status</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      subscription.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {subscription.status}
                    </span>
                  </div>
                  {subscription.plan === 'premium' && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Next Billing</span>
                      <span className="text-gray-900 text-sm">
                        {subscription.nextBillingDate ? formatDate(subscription.nextBillingDate) : 'N/A'}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-600 text-sm">Loading subscription information...</p>
              )}
            </div>
          </div>

          {/* Usage History */}
          <div className="lg:col-span-2">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-soft p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Recent Activity
              </h2>
              
              {usageLogs.length > 0 ? (
                <div className="space-y-3">
                  {usageLogs.slice(0, 10).map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="text-blue-500">
                          {getActionIcon(log.action)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{getActionLabel(log.action)}</p>
                          <p className="text-sm text-gray-600">{formatDate(log.timestamp)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No activity yet</p>
                  <button
                    onClick={() => router.push('/')}
                    className="mt-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-300 hover-lift shadow-glow"
                  >
                    Start Using CiteFinder
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 