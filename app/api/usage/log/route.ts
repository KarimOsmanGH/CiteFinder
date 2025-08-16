import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { userId, sessionId, action, metadata } = await request.json()

    if (!sessionId || !action) {
      return NextResponse.json({ error: 'Session ID and action are required' }, { status: 400 })
    }

    // Log the usage
    const { data, error } = await supabase
      .from('usage_logs')
      .insert({
        user_id: userId || null,
        session_id: sessionId,
        action: action,
        metadata: metadata || null
      })

    if (error) {
      console.error('Error logging usage:', error)
      return NextResponse.json({ error: 'Failed to log usage' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Usage logged successfully'
    })

  } catch (error) {
    console.error('Error in usage logging:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 