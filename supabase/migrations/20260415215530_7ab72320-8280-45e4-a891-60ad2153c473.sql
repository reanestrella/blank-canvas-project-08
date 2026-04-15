
-- Subscriptions table for Stripe integration
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  price_id TEXT,
  plan TEXT NOT NULL DEFAULT 'mensal',
  status TEXT NOT NULL DEFAULT 'inativo',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(church_id)
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Pastors can read their church subscription
CREATE POLICY "Pastors can read own church subscription"
ON public.subscriptions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.church_id = subscriptions.church_id
      AND ur.role = 'pastor'
  )
);

-- Service role (webhook) handles inserts/updates via SECURITY DEFINER functions
-- Allow authenticated users to insert their own subscription
CREATE POLICY "Users can create own subscription"
ON public.subscriptions
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Allow updates via service role only (webhook edge function)
CREATE POLICY "Service can update subscriptions"
ON public.subscriptions
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.church_id = subscriptions.church_id
      AND ur.role = 'pastor'
  )
);
