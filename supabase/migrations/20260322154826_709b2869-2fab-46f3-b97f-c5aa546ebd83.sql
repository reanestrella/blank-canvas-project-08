
-- Add registration status to profiles for approval flow
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS registration_status text DEFAULT 'ativo';

-- Create video-bg bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('video-bg', 'video-bg', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for video-bg
CREATE POLICY "Anyone can read video-bg"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'video-bg');

CREATE POLICY "Authenticated can upload video-bg"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'video-bg');

CREATE POLICY "Authenticated can update video-bg"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'video-bg');

CREATE POLICY "Authenticated can delete video-bg"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'video-bg');

-- Additional RLS: allow user to see own schedule_volunteers by member linkage
-- This ensures even if church-wide SELECT already exists, personal access always works
CREATE POLICY "User sees own schedule entries"
  ON public.schedule_volunteers FOR SELECT
  TO authenticated
  USING (
    member_id IN (
      SELECT m.id FROM public.members m
      JOIN public.profiles p ON (p.member_id = m.id OR lower(p.email) = lower(m.email))
      WHERE p.user_id = auth.uid()
    )
  );
