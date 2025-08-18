'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { User, Crown, ArrowLeft, Settings } from 'lucide-react'

export default function DashboardSettings() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [subscription, setSubscription] = useState<any>(null)

  // Only allow in development
  useEffect(() => {
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



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/70 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-3">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">Settings</span>
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
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Settings</h1>
          <p className="text-gray-600">Manage your account information and subscription</p>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Account Info */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-soft p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Account Information
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Name</label>
                <p className="text-gray-900">{session?.user?.name || 'Dev User'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Email</label>
                <p className="text-gray-900">{session?.user?.email || 'dev@citefinder.app'}</p>
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
      </div>
    </div>
  )
} 