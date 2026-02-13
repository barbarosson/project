/*
  # Fix cms_banners NOT NULL Constraints for Assets Manager
  
  ## Summary
  Assets Manager uses simple fields (title, alt_text) instead of localized fields (title_en/tr).
  This migration removes NOT NULL constraints from localized fields to allow flexible usage.
  
  ## Changes
  
  1. **Modified Columns**
     - `title_en` → Changed from NOT NULL to nullable
     - `title_tr` → Changed from NOT NULL to nullable
  
  2. **Reasoning**
     - Assets can use either simple `title` or localized `title_en/title_tr`
     - Not all assets require multi-language support
     - Maintains backward compatibility with existing data
  
  ## Notes
  - Simple asset uploads only need `title` field
  - Full CMS banners can still use localized fields
  - No data loss - only constraint relaxation
*/

-- Make title_en nullable
ALTER TABLE cms_banners ALTER COLUMN title_en DROP NOT NULL;

-- Make title_tr nullable  
ALTER TABLE cms_banners ALTER COLUMN title_tr DROP NOT NULL;