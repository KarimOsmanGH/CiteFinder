import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if Supabase is configured
    if (!supabase) {
      return NextResponse.json([])
    }

    // Get user ID from email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get usage logs for the user
    const { data: logs, error: logsError } = await supabase
      .from('usage_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false })
      .limit(50)

    if (logsError) {
      console.error('Error fetching usage logs:', logsError)
      return NextResponse.json({ error: 'Failed to fetch usage logs' }, { status: 500 })
    }

    return NextResponse.json(logs || [])
  } catch (error) {
    console.error('Error in usage history API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 