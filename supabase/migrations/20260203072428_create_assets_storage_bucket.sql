/*
  # Create Assets Storage Bucket

  1. Storage Setup
    - Creates `assets` bucket for storing images, banners, logos
    - Enables public access for serving images
    - Sets up RLS policies for authenticated users to upload
    - Allows anonymous users to view/download assets

  2. Security
    - Authenticated users can upload files
    - Everyone can view assets (public bucket)
    - File size limits applied
*/

-- Create the assets bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'assets',
  'assets',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

-- Drop existing policies if any
DROP POLICY IF EXISTS "Authenticated users can upload assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete assets" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view assets" ON storage.objects;

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'assets');

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'assets');

-- Allow authenticated users to delete assets
CREATE POLICY "Authenticated users can delete assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'assets');

-- Allow everyone to view assets (public bucket)
CREATE POLICY "Anyone can view assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'assets');