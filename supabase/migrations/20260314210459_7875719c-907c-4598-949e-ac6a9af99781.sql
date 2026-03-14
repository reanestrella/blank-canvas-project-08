
-- Create storage bucket for church logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('church-logos', 'church-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to church-logos bucket
CREATE POLICY "Authenticated users can upload church logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'church-logos');

-- Allow public to read church logos
CREATE POLICY "Public can read church logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'church-logos');

-- Allow authenticated users to update their church logos
CREATE POLICY "Authenticated users can update church logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'church-logos');

-- Allow authenticated users to delete church logos
CREATE POLICY "Authenticated users can delete church logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'church-logos');
