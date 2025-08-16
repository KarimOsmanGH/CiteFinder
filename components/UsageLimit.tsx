'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, Crown, Lock, CheckCircle, X } from 'lucide-react'

interface UsageLimitProps {
  sessionId: string
  isAuthenticated?: boolean
  subscriptionPlan?: 'free' | 'premium'
  showAfterInteraction?: boolean
}

export default function UsageLimit({ 
  sessionId, 
  isAuthenticated = false, 
  subscriptionPlan = 'free',
  showAfterInteraction = false 
}: UsageLimitProps) {
  const [usageCount, setUsageCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const checkUsage = async () => {
      try {
        // Check if Supabase is configured
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
          console.log('Supabase not configured, showing development mode')
          setUsageCount(0)
          setIsLoading(false)
          return
        }

        const response = await fetch('/api/usage/check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: null, // Will be updated when auth is implemented
            sessionId,
            action: 'citation_generate'
          }),
        })

        if (response.ok) {
          // For now, we'll show a simple message
          // In a real implementation, you'd get the actual usage count
          setUsageCount(0)
        }
      } catch (error) {
        console.error('Error checking usage:', error)
        // Show development mode if there's an error
        setUsageCount(0)
      } finally {
        setIsLoading(false)
      }
    }

    if (sessionId) {
      checkUsage()
    }
  }, [sessionId])

  // Show the alert after user interaction
  useEffect(() => {
    if (showAfterInteraction && !isLoading) {
      setIsVisible(true)
    }
  }, [showAfterInteraction, isLoading])

  if (isLoading) {
    return null // Don't show anything while loading
  }

  // Check if Supabase is configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return null // Don't show development mode banner
  }

  if (subscriptionPlan === 'premium') {
    return null // Don't show anything for premium users
  }

  if (isAuthenticated) {
    return null // Don't show anything for authenticated users in development
  }

  // Anonymous user - permanent banner
  return (
    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Lock className="w-5 h-5 text-orange-600 mr-3 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-orange-800 text-base">Anonymous User</h4>
            <p className="text-orange-700 text-sm mt-1">1 citation per 24 hours • Sign up for unlimited access</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-all duration-200">
            Sign Up Free
          </button>
          <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200">
            Premium $15/mo
          </button>
        </div>
      </div>
    </div>
  )
} 