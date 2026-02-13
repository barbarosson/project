/*
  # Add Anonymous Read Policy for CMS Banners

  1. Changes
    - Add public read-only policy for anonymous users
    - Allow them to view only active banners
  
  2. Security
    - Anonymous users can only view active banners (SELECT only)
    - Cannot create, update, or delete banners
*/

-- Create policy for anonymous users to view active banners
CREATE POLICY "Public can view active banners"
  ON cms_banners
  FOR SELECT
  TO anon
  USING (is_active = true);
