import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { userId, sessionId, action } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    // Check usage limit using the database function
    const { data: canUse, error } = await supabase.rpc('check_usage_limit', {
      p_user_id: userId || null,
      p_session_id: sessionId
    })

    if (error) {
      console.error('Error checking usage limit:', error)
      return NextResponse.json({ error: 'Failed to check usage limit' }, { status: 500 })
    }

    return NextResponse.json({ 
      canUse: canUse,
      message: canUse ? 'Usage allowed' : 'Usage limit exceeded'
    })

  } catch (error) {
    console.error('Error in usage check:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 