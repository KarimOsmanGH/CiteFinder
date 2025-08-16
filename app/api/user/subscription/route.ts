import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    // Get subscription for the user
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (subError && subError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching subscription:', subError)
      return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 })
    }

    // Return subscription or default to free plan
    return NextResponse.json(subscription || {
      plan: 'free',
      status: 'active',
      user_id: user.id
    })
  } catch (error) {
    console.error('Error in subscription API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 