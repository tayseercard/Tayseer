-- Create a public bucket for store logos if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for logos bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'logos' );

CREATE POLICY "Owners can upload logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'logos' );

CREATE POLICY "Owners can update logos"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'logos' );

CREATE POLICY "Owners can delete logos"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'logos' );
