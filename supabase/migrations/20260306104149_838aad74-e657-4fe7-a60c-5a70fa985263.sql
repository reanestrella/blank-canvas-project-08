
-- Fix RLS on worship/schedule tables (project convention: RLS disabled)
ALTER TABLE IF EXISTS public.schedule_songs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.worship_songs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.worship_sets DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.worship_set_songs DISABLE ROW LEVEL SECURITY;

-- Kids Ministry: studies table
CREATE TABLE IF NOT EXISTS public.kids_studies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  age_group text,
  study_date date,
  file_url text,
  suggestions jsonb DEFAULT '[]'::jsonb,
  created_by_member_id uuid REFERENCES public.members(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Storage bucket for kids study files
INSERT INTO storage.buckets (id, name, public)
VALUES ('kids-studies', 'kids-studies', true)
ON CONFLICT (id) DO NOTHING;
