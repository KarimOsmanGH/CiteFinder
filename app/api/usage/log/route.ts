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
  // NextRequest.ip may exist depending on runtime; fallback to localhost in dev
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
    const { userId, sessionId, action, metadata } = await request.json()

    if (!sessionId || !action) {
      return NextResponse.json({ error: 'Session ID and action are required' }, { status: 400 })
    }

    // Check if Supabase is configured
    if (!supabase) {
      return NextResponse.json({ success: true, message: 'Supabase not configured, skipping log' })
    }

    const ip = getClientIp(request)
    const userAgent = getUserAgent(request)
    const ipHash = hashIpAndUa(ip, userAgent)

    // Log the usage
    const { data, error } = await supabase
      .from('usage_logs')
      .insert({
        user_id: userId || null,
        session_id: sessionId,
        action: action,
        metadata: metadata || null,
        ip_hash: ipHash,
        user_agent: userAgent
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