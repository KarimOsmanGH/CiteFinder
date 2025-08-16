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

  // Only show for anonymous users after interaction
  if (!isVisible) {
    return null
  }

  // Anonymous user - small notification
  return (
    <div className="fixed top-4 right-4 bg-orange-50 border border-orange-200 rounded-lg p-3 shadow-lg max-w-sm z-50 animate-slide-in-right">
      <div className="flex items-start justify-between">
        <div className="flex items-start">
          <Lock className="w-4 h-4 text-orange-600 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-orange-800 text-sm">Anonymous User</h4>
            <p className="text-orange-700 text-xs mt-1">1 citation per 24 hours • Sign up for unlimited access</p>
          </div>
        </div>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-orange-400 hover:text-orange-600 ml-2"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex space-x-2 mt-3">
        <button className="bg-blue-500 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-blue-600 transition-all duration-200">
          Sign Up Free
        </button>
        <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1.5 rounded text-xs font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200">
          Premium $15/mo
        </button>
      </div>
    </div>
  )
} 