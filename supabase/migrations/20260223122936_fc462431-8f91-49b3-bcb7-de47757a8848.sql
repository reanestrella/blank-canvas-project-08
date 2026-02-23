
-- Trigger: auto-create church_features when a new church is created
CREATE OR REPLACE FUNCTION public.auto_create_church_features()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.church_features (church_id, ai_enabled, ai_trial_enabled, ai_trial_start, ai_trial_end)
  VALUES (NEW.id, false, false, null, null)
  ON CONFLICT (church_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_create_church_features
AFTER INSERT ON public.churches
FOR EACH ROW
EXECUTE FUNCTION public.auto_create_church_features();

-- Backfill: create church_features for existing churches that don't have one
INSERT INTO public.church_features (church_id, ai_enabled, ai_trial_enabled, ai_trial_start, ai_trial_end)
SELECT c.id, false, false, null, null
FROM public.churches c
LEFT JOIN public.church_features cf ON cf.church_id = c.id
WHERE cf.id IS NULL;
