/*
  # Expand Site Config for Complete Landing Page CMS

  ## Changes
  
  Add comprehensive content fields for all landing page sections:
  
  1. **Hero Section**
    - hero_title_en / hero_title_tr
    - hero_subtitle_en / hero_subtitle_tr
    - hero_cta_text_en / hero_cta_text_tr
    - hero_image_url
  
  2. **Features Section**
    - features_title_en / features_title_tr
    - features_subtitle_en / features_subtitle_tr
  
  3. **How It Works Section**
    - how_it_works_title_en / how_it_works_title_tr
    - how_it_works_subtitle_en / how_it_works_subtitle_tr
  
  4. **Pricing Section**
    - pricing_title_en / pricing_title_tr
    - pricing_subtitle_en / pricing_subtitle_tr
  
  5. **FAQ Section**
    - faq_title_en / faq_title_tr
    - faq_subtitle_en / faq_subtitle_tr
  
  6. **Final CTA Section**
    - final_cta_title_en / final_cta_title_tr
    - final_cta_subtitle_en / final_cta_subtitle_tr
    - final_cta_button_text_en / final_cta_button_text_tr
  
  7. **Social Proof Section**
    - social_proof_title_en / social_proof_title_tr
    - social_proof_subtitle_en / social_proof_subtitle_tr

  ## Security
  - No RLS changes needed (already configured)
*/

-- Add Hero Section fields
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'hero_title_en') THEN
    ALTER TABLE site_config ADD COLUMN hero_title_en text DEFAULT 'Transform Your Business with Smart ERP';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'hero_title_tr') THEN
    ALTER TABLE site_config ADD COLUMN hero_title_tr text DEFAULT 'İşletmenizi Akıllı ERP ile Dönüştürün';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'hero_subtitle_en') THEN
    ALTER TABLE site_config ADD COLUMN hero_subtitle_en text DEFAULT 'All-in-one solution for invoicing, inventory, CRM, and financial management. Designed for modern businesses.';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'hero_subtitle_tr') THEN
    ALTER TABLE site_config ADD COLUMN hero_subtitle_tr text DEFAULT 'Faturalama, stok, CRM ve finansal yönetim için hepsi bir arada çözüm. Modern işletmeler için tasarlandı.';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'hero_cta_text_en') THEN
    ALTER TABLE site_config ADD COLUMN hero_cta_text_en text DEFAULT 'Get Started Free';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'hero_cta_text_tr') THEN
    ALTER TABLE site_config ADD COLUMN hero_cta_text_tr text DEFAULT 'Ücretsiz Başlayın';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'hero_image_url') THEN
    ALTER TABLE site_config ADD COLUMN hero_image_url text DEFAULT 'https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg';
  END IF;
END $$;

-- Add Features Section fields
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'features_title_en') THEN
    ALTER TABLE site_config ADD COLUMN features_title_en text DEFAULT 'Everything you need to run your business';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'features_title_tr') THEN
    ALTER TABLE site_config ADD COLUMN features_title_tr text DEFAULT 'İşletmenizi yönetmek için ihtiyacınız olan her şey';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'features_subtitle_en') THEN
    ALTER TABLE site_config ADD COLUMN features_subtitle_en text DEFAULT 'Powerful features designed to streamline your operations';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'features_subtitle_tr') THEN
    ALTER TABLE site_config ADD COLUMN features_subtitle_tr text DEFAULT 'Operasyonlarınızı kolaylaştırmak için tasarlanmış güçlü özellikler';
  END IF;
END $$;

-- Add How It Works Section fields
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'how_it_works_title_en') THEN
    ALTER TABLE site_config ADD COLUMN how_it_works_title_en text DEFAULT 'How It Works';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'how_it_works_title_tr') THEN
    ALTER TABLE site_config ADD COLUMN how_it_works_title_tr text DEFAULT 'Nasıl Çalışır';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'how_it_works_subtitle_en') THEN
    ALTER TABLE site_config ADD COLUMN how_it_works_subtitle_en text DEFAULT 'Get started in minutes with our simple 3-step process';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'how_it_works_subtitle_tr') THEN
    ALTER TABLE site_config ADD COLUMN how_it_works_subtitle_tr text DEFAULT 'Basit 3 adımlık süreçle dakikalar içinde başlayın';
  END IF;
END $$;

-- Add Pricing Section fields
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'pricing_title_en') THEN
    ALTER TABLE site_config ADD COLUMN pricing_title_en text DEFAULT 'Simple, transparent pricing';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'pricing_title_tr') THEN
    ALTER TABLE site_config ADD COLUMN pricing_title_tr text DEFAULT 'Basit, şeffaf fiyatlandırma';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'pricing_subtitle_en') THEN
    ALTER TABLE site_config ADD COLUMN pricing_subtitle_en text DEFAULT 'Choose the plan that fits your business needs';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'pricing_subtitle_tr') THEN
    ALTER TABLE site_config ADD COLUMN pricing_subtitle_tr text DEFAULT 'İşletmenizin ihtiyaçlarına uygun planı seçin';
  END IF;
END $$;

-- Add FAQ Section fields
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'faq_title_en') THEN
    ALTER TABLE site_config ADD COLUMN faq_title_en text DEFAULT 'Frequently Asked Questions';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'faq_title_tr') THEN
    ALTER TABLE site_config ADD COLUMN faq_title_tr text DEFAULT 'Sıkça Sorulan Sorular';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'faq_subtitle_en') THEN
    ALTER TABLE site_config ADD COLUMN faq_subtitle_en text DEFAULT 'Find answers to common questions about our platform';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'faq_subtitle_tr') THEN
    ALTER TABLE site_config ADD COLUMN faq_subtitle_tr text DEFAULT 'Platformumuz hakkında sık sorulan soruların cevaplarını bulun';
  END IF;
END $$;

-- Add Final CTA Section fields
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'final_cta_title_en') THEN
    ALTER TABLE site_config ADD COLUMN final_cta_title_en text DEFAULT 'Ready to transform your business?';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'final_cta_title_tr') THEN
    ALTER TABLE site_config ADD COLUMN final_cta_title_tr text DEFAULT 'İşletmenizi dönüştürmeye hazır mısınız?';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'final_cta_subtitle_en') THEN
    ALTER TABLE site_config ADD COLUMN final_cta_subtitle_en text DEFAULT 'Join thousands of businesses already using Modulus ERP';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'final_cta_subtitle_tr') THEN
    ALTER TABLE site_config ADD COLUMN final_cta_subtitle_tr text DEFAULT 'Modulus ERP kullanan binlerce işletmeye katılın';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'final_cta_button_text_en') THEN
    ALTER TABLE site_config ADD COLUMN final_cta_button_text_en text DEFAULT 'Start Free Trial';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'final_cta_button_text_tr') THEN
    ALTER TABLE site_config ADD COLUMN final_cta_button_text_tr text DEFAULT 'Ücretsiz Deneme Başlat';
  END IF;
END $$;

-- Add Social Proof Section fields
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'social_proof_title_en') THEN
    ALTER TABLE site_config ADD COLUMN social_proof_title_en text DEFAULT 'Trusted by thousands of businesses';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'social_proof_title_tr') THEN
    ALTER TABLE site_config ADD COLUMN social_proof_title_tr text DEFAULT 'Binlerce işletmenin güvendiği';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'social_proof_subtitle_en') THEN
    ALTER TABLE site_config ADD COLUMN social_proof_subtitle_en text DEFAULT 'See what our customers have to say';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'social_proof_subtitle_tr') THEN
    ALTER TABLE site_config ADD COLUMN social_proof_subtitle_tr text DEFAULT 'Müşterilerimizin ne dediğini görün';
  END IF;
END $$;