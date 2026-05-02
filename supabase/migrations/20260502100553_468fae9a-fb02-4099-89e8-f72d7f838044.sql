ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS is_gift boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS due_date date,
  ADD COLUMN IF NOT EXISTS grace_period_days integer NOT NULL DEFAULT 3;

CREATE INDEX IF NOT EXISTS idx_subscriptions_due_date ON public.subscriptions(due_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);