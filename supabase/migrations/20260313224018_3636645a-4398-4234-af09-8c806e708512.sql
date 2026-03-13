
-- Add branding and SaaS fields to churches table
ALTER TABLE public.churches
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#1e3a5f',
  ADD COLUMN IF NOT EXISTS secondary_color text DEFAULT '#d97706',
  ADD COLUMN IF NOT EXISTS ministry_name text,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Auto-generate unique slugs using id suffix
UPDATE public.churches
SET slug = lower(replace(replace(replace(name, ' ', '-'), '.', ''), ',', '')) || '-' || left(id::text, 8)
WHERE slug IS NULL;

-- Now add unique constraint
ALTER TABLE public.churches ADD CONSTRAINT churches_slug_key UNIQUE (slug);

-- Create index on slug for fast lookup
CREATE INDEX IF NOT EXISTS idx_churches_slug ON public.churches(slug);
