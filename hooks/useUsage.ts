import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export function useUsage() {
  const [sessionId, setSessionId] = useState<string>('')
  const [usageLimit, setUsageLimit] = useState<number>(1)
  const [usageCount, setUsageCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(false)

  // Generate session ID for anonymous users
  useEffect(() => {
    if (!sessionId) {
      const storedSessionId = localStorage.getItem('citefinder_session_id')
      if (storedSessionId) {
        setSessionId(storedSessionId)
      } else {
        const newSessionId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        localStorage.setItem('citefinder_session_id', newSessionId)
        setSessionId(newSessionId)
      }
    }
  }, [sessionId])

  const checkUsage = async (action: 'pdf_upload' | 'text_process' | 'citation_generate') => {
    setIsLoading(true)
    try {
      // Check if Supabase is configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        console.log('Supabase not configured, allowing usage')
        return true
      }

      const response = await fetch('/api/usage/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: null, // Will be updated when auth is implemented
          sessionId,
          action
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to check usage')
      }

      return data.canUse
    } catch (error) {
      console.error('Error checking usage:', error)
      // Allow usage if there's an error (fallback)
      return true
    } finally {
      setIsLoading(false)
    }
  }

  const logUsage = async (action: 'pdf_upload' | 'text_process' | 'citation_generate', metadata?: any) => {
    try {
      const response = await fetch('/api/usage/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: null, // Will be updated when auth is implemented
          sessionId,
          action,
          metadata
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to log usage')
      }

      return data.success
    } catch (error) {
      console.error('Error logging usage:', error)
      return false
    }
  }

  const canUseService = async (action: 'pdf_upload' | 'text_process' | 'citation_generate') => {
    const canUse = await checkUsage(action)
    
    if (canUse) {
      await logUsage(action)
    }
    
    return canUse
  }

  return {
    sessionId,
    usageLimit,
    usageCount,
    isLoading,
    checkUsage,
    logUsage,
    canUseService
  }
} 