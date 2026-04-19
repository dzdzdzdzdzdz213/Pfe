-- 07_guest_uploads.sql
-- Allow anonymous users (guests) to upload files (prescriptions) during public booking

-- Ensure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', true) 
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing generic insert policy if it exists
DROP POLICY IF EXISTS "Anyone can insert documents" ON storage.objects;

-- Create policy to allow ANYONE (including anon guests) to upload to the documents bucket
CREATE POLICY "Anyone can insert documents" 
ON storage.objects FOR INSERT 
TO public
WITH CHECK (bucket_id = 'documents');

-- Ensure anyone can read documents from the public bucket
DROP POLICY IF EXISTS "Anyone can view documents" ON storage.objects;
CREATE POLICY "Anyone can view documents" 
ON storage.objects FOR SELECT 
TO public
USING (bucket_id = 'documents');

-- Also ensure that anonymous users can insert reservations
DROP POLICY IF EXISTS "Anyone can insert appointments" ON rendez_vous;
CREATE POLICY "Anyone can insert appointments" 
ON rendez_vous FOR INSERT 
TO public
WITH CHECK (true);

