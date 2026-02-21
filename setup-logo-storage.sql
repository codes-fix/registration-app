-- Create Storage Buckets for Logos
-- Run this in Supabase SQL Editor

-- 1. Create bucket for organization logos (already may exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('organization-logos', 'organization-logos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Create bucket for site logos (super admin)
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-logos', 'site-logos', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Set up RLS policies for organization logos
-- Drop existing policies first
DROP POLICY IF EXISTS "Authenticated users can upload organization logos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view organization logos" ON storage.objects;
DROP POLICY IF EXISTS "Organization owners can update logos" ON storage.objects;
DROP POLICY IF EXISTS "Organization owners can delete logos" ON storage.objects;

-- Create policies
CREATE POLICY "Authenticated users can upload organization logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'organization-logos');

CREATE POLICY "Anyone can view organization logos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'organization-logos');

CREATE POLICY "Organization owners can update logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'organization-logos');

CREATE POLICY "Organization owners can delete logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'organization-logos');

-- 4. Set up RLS policies for site logos (super admin only)
-- Drop existing policies first
DROP POLICY IF EXISTS "Super admins can upload site logos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view site logos" ON storage.objects;
DROP POLICY IF EXISTS "Super admins can update site logos" ON storage.objects;
DROP POLICY IF EXISTS "Super admins can delete site logos" ON storage.objects;

-- Create policies
CREATE POLICY "Super admins can upload site logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'site-logos' 
  AND auth.uid() IN (
    SELECT id FROM user_profiles WHERE role = 'super_admin'
  )
);

CREATE POLICY "Anyone can view site logos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'site-logos');

CREATE POLICY "Super admins can update site logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'site-logos'
  AND auth.uid() IN (
    SELECT id FROM user_profiles WHERE role = 'super_admin'
  )
);

CREATE POLICY "Super admins can delete site logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'site-logos'
  AND auth.uid() IN (
    SELECT id FROM user_profiles WHERE role = 'super_admin'
  )
);

-- 5. Create a table to store site settings (for super admin)
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url TEXT,
  site_name TEXT DEFAULT 'EventReg',
  primary_color TEXT DEFAULT '#22C55E',
  secondary_color TEXT DEFAULT '#EAB308',
  accent_color TEXT DEFAULT '#991B1B',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Insert default site settings
INSERT INTO site_settings (logo_url, site_name)
VALUES (NULL, 'EventReg')
ON CONFLICT DO NOTHING;

-- RLS for site_settings
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view site settings" ON site_settings;
DROP POLICY IF EXISTS "Super admins can update site settings" ON site_settings;

-- Create policies
CREATE POLICY "Anyone can view site settings"
ON site_settings
FOR SELECT
TO public
USING (true);

CREATE POLICY "Super admins can update site settings"
ON site_settings
FOR UPDATE
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM user_profiles WHERE role = 'super_admin'
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM user_profiles WHERE role = 'super_admin'
  )
);

-- Verify buckets were created
SELECT id, name, public FROM storage.buckets WHERE id IN ('organization-logos', 'site-logos');

-- Verify site_settings table
SELECT * FROM site_settings;
