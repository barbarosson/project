/*
  # Add Comprehensive Typography Settings

  1. New Columns
    - font_family: Font family for different elements
    - font_size_text: Font size as text (e.g., '16px', '1rem')
    - font_weight: Font weight (100-900 or 'normal', 'bold')
    - font_color: Text color
    - line_height_value: Line height value
    - letter_spacing_value: Letter spacing
    - text_transform: Text transformation (uppercase, lowercase, capitalize)
    - text_decoration: Text decoration (none, underline, line-through)
  
  2. Purpose
    - Enable granular control over typography across the application
    - Support different font settings for body, headings, buttons, etc.
*/

-- Add typography columns
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ui_styles' AND column_name = 'font_family'
  ) THEN
    ALTER TABLE ui_styles ADD COLUMN font_family text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ui_styles' AND column_name = 'font_size_text'
  ) THEN
    ALTER TABLE ui_styles ADD COLUMN font_size_text text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ui_styles' AND column_name = 'font_weight'
  ) THEN
    ALTER TABLE ui_styles ADD COLUMN font_weight text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ui_styles' AND column_name = 'font_color'
  ) THEN
    ALTER TABLE ui_styles ADD COLUMN font_color text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ui_styles' AND column_name = 'line_height_value'
  ) THEN
    ALTER TABLE ui_styles ADD COLUMN line_height_value text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ui_styles' AND column_name = 'letter_spacing_value'
  ) THEN
    ALTER TABLE ui_styles ADD COLUMN letter_spacing_value text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ui_styles' AND column_name = 'text_transform'
  ) THEN
    ALTER TABLE ui_styles ADD COLUMN text_transform text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ui_styles' AND column_name = 'text_decoration'
  ) THEN
    ALTER TABLE ui_styles ADD COLUMN text_decoration text;
  END IF;
END $$;

-- Insert default typography styles
INSERT INTO ui_styles (
  element_name, 
  category, 
  property, 
  font_family, 
  font_size_text, 
  font_weight, 
  font_color, 
  line_height_value,
  letter_spacing_value,
  is_global
)
VALUES 
  ('body', 'typography', 'font', 'Inter, system-ui, sans-serif', '16px', '400', '#1F2937', '1.5', '0px', true),
  ('h1', 'typography', 'font', 'Inter, system-ui, sans-serif', '48px', '700', '#111827', '1.2', '-0.02em', true),
  ('h2', 'typography', 'font', 'Inter, system-ui, sans-serif', '36px', '700', '#111827', '1.3', '-0.01em', true),
  ('h3', 'typography', 'font', 'Inter, system-ui, sans-serif', '30px', '600', '#111827', '1.3', '0px', true),
  ('h4', 'typography', 'font', 'Inter, system-ui, sans-serif', '24px', '600', '#111827', '1.4', '0px', true),
  ('h5', 'typography', 'font', 'Inter, system-ui, sans-serif', '20px', '600', '#111827', '1.4', '0px', true),
  ('h6', 'typography', 'font', 'Inter, system-ui, sans-serif', '18px', '600', '#111827', '1.4', '0px', true),
  ('button', 'typography', 'font', 'Inter, system-ui, sans-serif', '14px', '500', '#FFFFFF', '1.5', '0.01em', true),
  ('input', 'typography', 'font', 'Inter, system-ui, sans-serif', '14px', '400', '#111827', '1.5', '0px', true),
  ('label', 'typography', 'font', 'Inter, system-ui, sans-serif', '14px', '500', '#374151', '1.5', '0px', true),
  ('caption', 'typography', 'font', 'Inter, system-ui, sans-serif', '12px', '400', '#6B7280', '1.5', '0px', true),
  ('small', 'typography', 'font', 'Inter, system-ui, sans-serif', '12px', '400', '#9CA3AF', '1.5', '0px', true),
  ('code', 'typography', 'font', 'Monaco, Courier, monospace', '14px', '400', '#DC2626', '1.5', '0px', true),
  ('link', 'typography', 'font', 'Inter, system-ui, sans-serif', '14px', '400', '#3B82F6', '1.5', '0px', true)
ON CONFLICT DO NOTHING;