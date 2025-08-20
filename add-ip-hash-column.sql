-- Add missing columns to usage_logs table for IP-based tracking
ALTER TABLE public.usage_logs 
ADD COLUMN IF NOT EXISTS ip_hash TEXT,
ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- Create index for ip_hash column
CREATE INDEX IF NOT EXISTS idx_usage_logs_ip_hash ON public.usage_logs(ip_hash); 