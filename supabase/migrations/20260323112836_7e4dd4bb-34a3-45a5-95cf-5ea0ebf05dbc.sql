-- PONTO 1: Add cover_image and maps_link to cells
ALTER TABLE public.cells ADD COLUMN IF NOT EXISTS cover_image_url text;
ALTER TABLE public.cells ADD COLUMN IF NOT EXISTS maps_link text;

-- PONTO 2: Add maps_link to churches  
ALTER TABLE public.churches ADD COLUMN IF NOT EXISTS maps_link text;

-- PONTO 7: Devotional progress tracking
CREATE TABLE IF NOT EXISTS public.devotional_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  church_id uuid NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  devotional_date date NOT NULL,
  completed boolean NOT NULL DEFAULT true,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, church_id, devotional_date)
);

ALTER TABLE public.devotional_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own progress" ON public.devotional_progress
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own progress" ON public.devotional_progress
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own progress" ON public.devotional_progress
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Storage bucket for cell covers
INSERT INTO storage.buckets (id, name, public) VALUES ('cell-covers', 'cell-covers', true) ON CONFLICT DO NOTHING;

CREATE POLICY "Anyone can read cell covers" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'cell-covers');

CREATE POLICY "Auth users can upload cell covers" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'cell-covers');

CREATE POLICY "Auth users can update cell covers" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'cell-covers');