
ALTER TABLE public.consolidation_records
  ADD COLUMN IF NOT EXISTS contact_made boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS contact_reason text;
