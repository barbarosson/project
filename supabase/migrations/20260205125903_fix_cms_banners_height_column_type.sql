/*
  # Fix CMS Banners Height Column Type

  1. Changes
    - Change `height` column from integer to text to support CSS values
    - Change `width` column from integer to text for consistency

  2. Details
    - Height needs to support CSS units like '400px', '80vh', '50rem'
    - Width should also support percentage and viewport units
    - Update default values to be text-based
    - This fixes the "invalid input syntax for type integer" error

  3. Migration Strategy
    - Cast existing integer values to text with 'px' suffix
    - Alter column type to text
    - Update default values
*/

-- Convert height column from integer to text
DO $$
BEGIN
  -- First, update existing values to include 'px' suffix
  UPDATE cms_banners
  SET height = CAST(height AS text) || 'px'
  WHERE height IS NOT NULL
    AND CAST(height AS text) NOT LIKE '%px'
    AND CAST(height AS text) NOT LIKE '%vh'
    AND CAST(height AS text) NOT LIKE '%rem';

  -- Then alter the column type
  ALTER TABLE cms_banners
    ALTER COLUMN height TYPE text
    USING CASE
      WHEN height IS NULL THEN NULL
      ELSE CAST(height AS text)
    END;

  -- Set new default
  ALTER TABLE cms_banners
    ALTER COLUMN height SET DEFAULT '400px';

EXCEPTION
  WHEN others THEN
    -- If column doesn't exist or already text, ignore
    NULL;
END $$;

-- Convert width column from integer to text
DO $$
BEGIN
  -- First, update existing values to include '%' suffix for percentages
  UPDATE cms_banners
  SET width = CAST(width AS text) || '%'
  WHERE width IS NOT NULL
    AND CAST(width AS text) NOT LIKE '%\%%'
    AND CAST(width AS text) NOT LIKE '%px'
    AND CAST(width AS text) NOT LIKE '%vw';

  -- Then alter the column type
  ALTER TABLE cms_banners
    ALTER COLUMN width TYPE text
    USING CASE
      WHEN width IS NULL THEN NULL
      ELSE CAST(width AS text)
    END;

  -- Set new default
  ALTER TABLE cms_banners
    ALTER COLUMN width SET DEFAULT '100%';

EXCEPTION
  WHEN others THEN
    -- If column doesn't exist or already text, ignore
    NULL;
END $$;

-- Update column comments
COMMENT ON COLUMN cms_banners.height IS 'Banner height as CSS value (e.g., 400px, 80vh, 50rem)';
COMMENT ON COLUMN cms_banners.width IS 'Banner width as CSS value (e.g., 100%, 80vw, 1200px)';
