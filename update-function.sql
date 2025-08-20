-- Drop the old check_usage_limit function first to avoid overloading conflicts
DROP FUNCTION IF EXISTS public.check_usage_limit(p_user_id UUID, p_session_id TEXT);

-- Create the new check_usage_limit function with p_ip_hash parameter
CREATE OR REPLACE FUNCTION public.check_usage_limit(
  p_user_id UUID DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_ip_hash TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  user_subscription public.subscriptions;
  usage_count INTEGER;
  is_anonymous BOOLEAN;
BEGIN
  -- Check if user is anonymous
  is_anonymous := p_user_id IS NULL;
  
  IF is_anonymous THEN
    -- For anonymous users: 3 citations per 24 hours by either session or ip_hash
    SELECT COUNT(*) INTO usage_count
    FROM public.usage_logs
    WHERE (session_id = p_session_id OR (p_ip_hash IS NOT NULL AND ip_hash = p_ip_hash))
      AND action = 'citation_generate'
      AND timestamp > NOW() - INTERVAL '24 hours';
    
    RETURN usage_count < 3;
  ELSE
    -- For registered users: check subscription
    SELECT * INTO user_subscription
    FROM public.subscriptions
    WHERE user_id = p_user_id;
    
    IF user_subscription.plan = 'premium' AND user_subscription.status = 'active' THEN
      RETURN TRUE; -- Unlimited for premium users
    ELSE
      -- Free users: 3 citations per 24 hours
      SELECT COUNT(*) INTO usage_count
      FROM public.usage_logs
      WHERE user_id = p_user_id
        AND action = 'citation_generate'
        AND timestamp > NOW() - INTERVAL '24 hours';
      
      RETURN usage_count < 3;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 