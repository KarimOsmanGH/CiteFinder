'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, Crown, Lock, CheckCircle, X } from 'lucide-react'

interface UsageLimitProps {
  sessionId: string
  isAuthenticated?: boolean
  subscriptionPlan?: 'anonymous' | 'free' | 'premium'
  showAfterInteraction?: boolean
}

export default function UsageLimit({ 
  sessionId, 
  isAuthenticated = false, 
  subscriptionPlan = 'anonymous',
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

  if (isAuthenticated && subscriptionPlan === 'free') {
    // Show a different message for authenticated free users
    return (
      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gradient-to-br from-gray-50 to-blue-50 shadow-sm mt-4 hover:border-blue-400 hover:bg-gradient-to-br hover:from-gray-50 hover:to-blue-50">
        <div className="flex flex-col items-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Free Plan</h3>
          
          <p className="text-base text-gray-600 mb-4 max-w-md">
            3 citations per 24 hours • Upgrade for unlimited access
          </p>
          
          <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 w-full max-w-md border border-white/20">
            <div className="flex justify-center">
              <button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-lg text-sm font-medium transition-all duration-200 shadow-glow">
                Upgrade to Premium
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Anonymous user - permanent banner
  return (
    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gradient-to-br from-gray-50 to-blue-50 shadow-sm mt-4 hover:border-blue-400 hover:bg-gradient-to-br hover:from-gray-50 hover:to-blue-50">
      <div className="flex flex-col items-center">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Anonymous User</h3>
        
        <p className="text-base text-gray-600 mb-4 max-w-md">
          3 citations per 24 hours • Sign up for unlimited access
        </p>
        
        <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 w-full max-w-md border border-white/20">
          <div className="flex justify-center">
            <button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-lg text-sm font-medium transition-all duration-200 shadow-glow">
              Get unlimited access
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 