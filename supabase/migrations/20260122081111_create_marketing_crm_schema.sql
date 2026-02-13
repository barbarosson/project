/*
  # Marketing & CRM System

  ## Overview
  This migration creates a comprehensive marketing and CRM system with sales proposals,
  campaign management, and customer segmentation capabilities.

  ## Changes

  1. **New Tables**
     
     **proposals**
     - `id` (uuid, primary key)
     - `proposal_number` (text, unique) - e.g., "PROP-2024-001"
     - `customer_id` (uuid, references customers)
     - `title` (text) - proposal title/subject
     - `description` (text) - detailed description
     - `status` (text) - 'draft', 'sent', 'accepted', 'rejected'
     - `valid_until` (date) - proposal expiration date
     - `subtotal` (numeric)
     - `vat_total` (numeric)
     - `total` (numeric)
     - `notes` (text) - internal notes
     - `terms` (text) - terms and conditions
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)
     - `sent_at` (timestamptz) - when sent to customer
     - `responded_at` (timestamptz) - when customer responded
     - `converted_invoice_id` (uuid) - reference to created invoice if accepted

     **proposal_line_items**
     - `id` (uuid, primary key)
     - `proposal_id` (uuid, references proposals)
     - `product_id` (uuid, references products, nullable)
     - `product_name` (text)
     - `description` (text)
     - `quantity` (numeric)
     - `unit_price` (numeric)
     - `discount_percent` (numeric, default 0)
     - `vat_rate` (numeric)
     - `line_total` (numeric)
     - `vat_amount` (numeric)
     - `total_with_vat` (numeric)

     **campaigns**
     - `id` (uuid, primary key)
     - `name` (text) - campaign name
     - `type` (text) - 'email', 'discount', 'announcement'
     - `status` (text) - 'draft', 'active', 'paused', 'completed'
     - `target_segment` (text) - 'all', 'champions', 'at_risk', 'new_leads'
     - `subject` (text) - email subject or campaign headline
     - `message` (text) - campaign message/content
     - `discount_rate` (numeric) - if discount campaign
     - `start_date` (date)
     - `end_date` (date)
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)

     **customer_segments**
     - `id` (uuid, primary key)
     - `customer_id` (uuid, references customers)
     - `segment` (text) - 'champion', 'at_risk', 'new_lead', 'regular'
     - `total_spent` (numeric)
     - `last_purchase_date` (date)
     - `days_since_last_purchase` (integer)
     - `purchase_count` (integer)
     - `calculated_at` (timestamptz)

  2. **Security**
     - Enable RLS on all new tables
     - Add policies for authenticated access

  3. **Notes**
     - Customer segmentation will be calculated based on invoice history
     - Proposals can be converted to invoices when accepted
     - Campaigns can target specific customer segments
*/

-- Create proposals table
CREATE TABLE IF NOT EXISTS proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_number text UNIQUE NOT NULL,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected')),
  valid_until date,
  subtotal numeric DEFAULT 0,
  vat_total numeric DEFAULT 0,
  total numeric DEFAULT 0,
  notes text,
  terms text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  sent_at timestamptz,
  responded_at timestamptz,
  converted_invoice_id uuid
);

-- Create proposal_line_items table
CREATE TABLE IF NOT EXISTS proposal_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  description text,
  quantity numeric NOT NULL CHECK (quantity > 0),
  unit_price numeric NOT NULL,
  discount_percent numeric DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  vat_rate numeric NOT NULL DEFAULT 18,
  line_total numeric NOT NULL,
  vat_amount numeric NOT NULL,
  total_with_vat numeric NOT NULL
);

-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'email' CHECK (type IN ('email', 'discount', 'announcement')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  target_segment text NOT NULL DEFAULT 'all' CHECK (target_segment IN ('all', 'champions', 'at_risk', 'new_leads', 'regular')),
  subject text,
  message text,
  discount_rate numeric DEFAULT 0 CHECK (discount_rate >= 0 AND discount_rate <= 100),
  start_date date,
  end_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create customer_segments table
CREATE TABLE IF NOT EXISTS customer_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  segment text NOT NULL CHECK (segment IN ('champion', 'at_risk', 'new_lead', 'regular')),
  total_spent numeric DEFAULT 0,
  last_purchase_date date,
  days_since_last_purchase integer,
  purchase_count integer DEFAULT 0,
  calculated_at timestamptz DEFAULT now(),
  UNIQUE(customer_id)
);

-- Enable RLS
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_segments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$
BEGIN
  DROP POLICY IF EXISTS "Anyone can view proposals" ON proposals;
  DROP POLICY IF EXISTS "Anyone can insert proposals" ON proposals;
  DROP POLICY IF EXISTS "Anyone can update proposals" ON proposals;
  DROP POLICY IF EXISTS "Anyone can delete proposals" ON proposals;
  
  DROP POLICY IF EXISTS "Anyone can view proposal line items" ON proposal_line_items;
  DROP POLICY IF EXISTS "Anyone can insert proposal line items" ON proposal_line_items;
  DROP POLICY IF EXISTS "Anyone can update proposal line items" ON proposal_line_items;
  DROP POLICY IF EXISTS "Anyone can delete proposal line items" ON proposal_line_items;
  
  DROP POLICY IF EXISTS "Anyone can view campaigns" ON campaigns;
  DROP POLICY IF EXISTS "Anyone can insert campaigns" ON campaigns;
  DROP POLICY IF EXISTS "Anyone can update campaigns" ON campaigns;
  DROP POLICY IF EXISTS "Anyone can delete campaigns" ON campaigns;
  
  DROP POLICY IF EXISTS "Anyone can view customer segments" ON customer_segments;
  DROP POLICY IF EXISTS "Anyone can insert customer segments" ON customer_segments;
  DROP POLICY IF EXISTS "Anyone can update customer segments" ON customer_segments;
  DROP POLICY IF EXISTS "Anyone can delete customer segments" ON customer_segments;
END $$;

-- RLS Policies for proposals
CREATE POLICY "Anyone can view proposals"
  ON proposals FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert proposals"
  ON proposals FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update proposals"
  ON proposals FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete proposals"
  ON proposals FOR DELETE
  USING (true);

-- RLS Policies for proposal_line_items
CREATE POLICY "Anyone can view proposal line items"
  ON proposal_line_items FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert proposal line items"
  ON proposal_line_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update proposal line items"
  ON proposal_line_items FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete proposal line items"
  ON proposal_line_items FOR DELETE
  USING (true);

-- RLS Policies for campaigns
CREATE POLICY "Anyone can view campaigns"
  ON campaigns FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert campaigns"
  ON campaigns FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update campaigns"
  ON campaigns FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete campaigns"
  ON campaigns FOR DELETE
  USING (true);

-- RLS Policies for customer_segments
CREATE POLICY "Anyone can view customer segments"
  ON customer_segments FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert customer segments"
  ON customer_segments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update customer segments"
  ON customer_segments FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete customer segments"
  ON customer_segments FOR DELETE
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_proposals_customer_id ON proposals(customer_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_created_at ON proposals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_proposal_line_items_proposal_id ON proposal_line_items(proposal_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_customer_segments_customer_id ON customer_segments(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_segments_segment ON customer_segments(segment);

-- Insert sample proposals
DO $$
DECLARE
  customer_rec RECORD;
  proposal_id uuid;
  counter INTEGER := 1;
BEGIN
  FOR customer_rec IN (SELECT id, name FROM customers LIMIT 3)
  LOOP
    proposal_id := gen_random_uuid();
    
    INSERT INTO proposals (
      id,
      proposal_number,
      customer_id,
      title,
      description,
      status,
      valid_until,
      subtotal,
      vat_total,
      total,
      terms,
      created_at
    ) VALUES (
      proposal_id,
      'PROP-2024-' || LPAD(counter::text, 3, '0'),
      customer_rec.id,
      CASE 
        WHEN counter = 1 THEN 'Enterprise Software Implementation'
        WHEN counter = 2 THEN 'Annual Support Package'
        ELSE 'Cloud Migration Services'
      END,
      'Comprehensive solution tailored to your business needs',
      CASE 
        WHEN counter = 1 THEN 'sent'
        WHEN counter = 2 THEN 'accepted'
        ELSE 'draft'
      END,
      CURRENT_DATE + INTERVAL '30 days',
      CASE 
        WHEN counter = 1 THEN 25000
        WHEN counter = 2 THEN 15000
        ELSE 35000
      END,
      CASE 
        WHEN counter = 1 THEN 4500
        WHEN counter = 2 THEN 2700
        ELSE 6300
      END,
      CASE 
        WHEN counter = 1 THEN 29500
        WHEN counter = 2 THEN 17700
        ELSE 41300
      END,
      'Payment terms: Net 30 days. 50% upfront, 50% upon completion.',
      now() - (counter || ' days')::interval
    );
    
    counter := counter + 1;
  END LOOP;
END $$;