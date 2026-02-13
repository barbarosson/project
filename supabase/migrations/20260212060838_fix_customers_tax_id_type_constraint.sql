/*
  # Fix customers tax_id_type constraint

  1. Changes
    - Drop existing check constraint that doesn't allow NULL
    - Add new constraint that allows NULL and accepts both uppercase and lowercase values
    - Make tax_id_type nullable to support optional field
  
  2. Security
    - No RLS changes needed
*/

-- Drop old constraint
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_tax_id_type_check;

-- Add new constraint that allows NULL and both cases
ALTER TABLE customers 
ADD CONSTRAINT customers_tax_id_type_check 
CHECK (tax_id_type IS NULL OR tax_id_type IN ('VKN', 'TCKN', 'vkn', 'tckn', 'foreign', 'FOREIGN'));
