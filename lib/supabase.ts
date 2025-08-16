import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface User {
  id: string
  email: string
  name?: string
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  user_id: string
  status: 'active' | 'cancelled' | 'expired' | 'past_due'
  plan: 'free' | 'premium'
  start_date: string
  end_date?: string
  stripe_customer_id?: string
  stripe_subscription_id?: string
  created_at: string
  updated_at: string
}

export interface UsageLog {
  id: string
  user_id?: string
  session_id: string
  action: 'pdf_upload' | 'text_process' | 'citation_generate'
  timestamp: string
  metadata?: any
} 