-- Create users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'past_due')),
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'premium')),
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create usage_logs table
CREATE TABLE public.usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('pdf_upload', 'text_process', 'citation_generate')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- Create indexes
CREATE INDEX idx_usage_logs_user_id ON public.usage_logs(user_id);
CREATE INDEX idx_usage_logs_session_id ON public.usage_logs(session_id);
CREATE INDEX idx_usage_logs_timestamp ON public.usage_logs(timestamp);
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for subscriptions
CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" ON public.subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for usage_logs
CREATE POLICY "Users can view own usage logs" ON public.usage_logs
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert own usage logs" ON public.usage_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name');
  
  INSERT INTO public.subscriptions (user_id, plan)
  VALUES (NEW.id, 'free');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile and subscription on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to check usage limits
CREATE OR REPLACE FUNCTION public.check_usage_limit(
  p_user_id UUID DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL
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
    -- For anonymous users: 3 citations per 24 hours
    SELECT COUNT(*) INTO usage_count
    FROM public.usage_logs
    WHERE session_id = p_session_id
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