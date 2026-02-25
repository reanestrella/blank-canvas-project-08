-- 1) Create church_settings table for persistent config (e.g. cell_offering_account_id)
CREATE TABLE IF NOT EXISTS public.church_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL UNIQUE REFERENCES public.churches(id) ON DELETE CASCADE,
  cell_offering_account_id uuid REFERENCES public.financial_accounts(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2) Create course-covers storage bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-covers', 'course-covers', true)
ON CONFLICT (id) DO NOTHING;

-- 3) Storage policies for course-covers
CREATE POLICY "Anyone can read course covers"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'course-covers');

CREATE POLICY "Authenticated users can upload course covers"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'course-covers' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update course covers"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'course-covers' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete course covers"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'course-covers' AND auth.uid() IS NOT NULL);