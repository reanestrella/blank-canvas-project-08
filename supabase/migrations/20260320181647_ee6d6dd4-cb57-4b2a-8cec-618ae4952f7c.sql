-- Create hero-bg storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('hero-bg', 'hero-bg', true) ON CONFLICT (id) DO NOTHING;

-- Allow public read for hero-bg
CREATE POLICY "Public read hero-bg" ON storage.objects FOR SELECT USING (bucket_id = 'hero-bg');
-- Allow authenticated upload for hero-bg  
CREATE POLICY "Auth upload hero-bg" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'hero-bg');
CREATE POLICY "Auth update hero-bg" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'hero-bg');
CREATE POLICY "Auth delete hero-bg" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'hero-bg');