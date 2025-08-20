import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

export const runtime = 'nodejs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null

function getClientIp(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for') || ''
  const ipFromXff = xff.split(',')[0]?.trim()
  if (ipFromXff) return ipFromXff
  // @ts-ignore
  return (request as any).ip || '127.0.0.1'
}

function getUserAgent(request: NextRequest): string {
  return request.headers.get('user-agent') || 'unknown'
}

function hashIpAndUa(ip: string, userAgent: string): string {
  const salt = process.env.USAGE_HASH_SALT || 'default_salt_change_me'
  return crypto.createHmac('sha256', salt).update(`${ip}|${userAgent}`).digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    const { userId, sessionId, action } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    // Check if Supabase is configured
    if (!supabase) {
      return NextResponse.json({ canUse: true, message: 'Supabase not configured, allowing usage' })
    }

    const ipHash = hashIpAndUa(getClientIp(request), getUserAgent(request))

    // Check usage limit using the database function
    const { data: canUse, error } = await supabase.rpc('check_usage_limit', {
      p_user_id: userId || null,
      p_session_id: sessionId,
      p_ip_hash: ipHash
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