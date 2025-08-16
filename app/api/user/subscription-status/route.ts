import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

// Initialize Supabase client conditionally
let supabase: any = null
if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  const { createClient } = require('@supabase/supabase-js')
  supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

export async function GET(request: NextRequest) {
  try {
    // For now, return anonymous status since auth is not fully implemented
    // This will be updated when NextAuth is properly configured
    return NextResponse.json({
      isAuthenticated: false,
      subscriptionPlan: 'anonymous',
      usageLimit: 3,
      usageCount: 0,
      canUseService: true // Allow usage for now
    })



  } catch (error) {
    console.error('Error in subscription status API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 