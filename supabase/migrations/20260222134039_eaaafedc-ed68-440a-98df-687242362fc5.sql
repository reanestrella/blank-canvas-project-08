
-- Add trial columns to church_features
ALTER TABLE public.church_features
  ADD COLUMN IF NOT EXISTS ai_trial_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_trial_start timestamp with time zone,
  ADD COLUMN IF NOT EXISTS ai_trial_end timestamp with time zone;

-- Function to enable AI trial for a church
CREATE OR REPLACE FUNCTION public.enable_ai_trial(p_church_id uuid, p_trial_days integer DEFAULT 30)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.church_features (church_id, ai_trial_enabled, ai_trial_start, ai_trial_end)
  VALUES (p_church_id, true, now(), now() + (p_trial_days || ' days')::interval)
  ON CONFLICT (church_id)
  DO UPDATE SET
    ai_trial_enabled = true,
    ai_trial_start = now(),
    ai_trial_end = now() + (p_trial_days || ' days')::interval;
END;
$$;
