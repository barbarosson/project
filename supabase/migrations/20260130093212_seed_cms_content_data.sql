/*
  # Seed CMS Content Data

  ## Overview
  This migration seeds the CMS with initial content for all website pages including:
  - Home page (hero, features, social proof, pricing, CTA)
  - Features page
  - Pricing page
  - About page
  - Contact page
  - Case Studies page
  - Help page
  - Global sections (Navbar, Footer)

  ## Important Notes
  - All content is bilingual (English and Turkish)
  - Content is structured for easy editing via CMS
  - Navbar and Footer are special pages with slug 'global-navbar' and 'global-footer'
*/

-- Insert pages
INSERT INTO cms_pages (slug, name, title, meta_description, meta_keywords, order_index, is_active)
VALUES
  ('home', 'Home', 'Modulus ERP - Smart Business Management', 'Modulus ERP is an all-in-one business management platform for invoicing, inventory, CRM, and financial tracking.', 'ERP, business management, invoicing, inventory, CRM', 1, true),
  ('features', 'Features', 'Features - Modulus ERP', 'Discover all the powerful features of Modulus ERP including invoicing, inventory management, CRM, and more.', 'ERP features, business tools, invoicing, inventory', 2, true),
  ('pricing', 'Pricing', 'Pricing Plans - Modulus ERP', 'Choose the perfect plan for your business. Flexible pricing with all the features you need.', 'ERP pricing, business software pricing, subscription plans', 3, true),
  ('about', 'About', 'About Us - Modulus ERP', 'Learn more about Modulus ERP and our mission to simplify business management.', 'about us, company info, ERP company', 4, true),
  ('contact', 'Contact', 'Contact Us - Modulus ERP', 'Get in touch with our team. We are here to help you succeed.', 'contact, support, help', 5, true),
  ('case-studies', 'Case Studies', 'Case Studies - Modulus ERP', 'See how businesses are succeeding with Modulus ERP.', 'case studies, success stories, testimonials', 6, true),
  ('help', 'Help Center', 'Help Center - Modulus ERP', 'Find answers to common questions and learn how to use Modulus ERP.', 'help, support, documentation, guides', 7, true),
  ('global-navbar', 'Global Navigation', 'Navigation Menu', 'Global navigation menu configuration', 'navigation, menu', 100, true),
  ('global-footer', 'Global Footer', 'Footer Content', 'Global footer configuration', 'footer, contact info', 101, true)
ON CONFLICT (slug) DO NOTHING;

-- Insert Home Page Sections
INSERT INTO cms_page_sections (page_id, section_key, section_name, content_json, order_index)
SELECT
  (SELECT id FROM cms_pages WHERE slug = 'home'),
  'hero',
  'Hero Section',
  jsonb_build_object(
    'title_en', 'Transform Your Business with Smart ERP',
    'title_tr', 'İşletmenizi Akıllı ERP ile Dönüştürün',
    'subtitle_en', 'All-in-one business management platform for invoicing, inventory, CRM, and financial tracking',
    'subtitle_tr', 'Faturalama, envanter, CRM ve finansal takip için hepsi bir arada iş yönetim platformu',
    'cta_primary_text_en', 'Start Free Trial',
    'cta_primary_text_tr', 'Ücretsiz Deneyin',
    'cta_primary_link', '/login',
    'cta_secondary_text_en', 'Watch Demo',
    'cta_secondary_text_tr', 'Demo İzleyin',
    'cta_secondary_link', '#demo',
    'image_url', '/hero-dashboard.png',
    'background_style', 'gradient'
  ),
  1
WHERE NOT EXISTS (
  SELECT 1 FROM cms_page_sections
  WHERE page_id = (SELECT id FROM cms_pages WHERE slug = 'home')
  AND section_key = 'hero'
);

INSERT INTO cms_page_sections (page_id, section_key, section_name, content_json, order_index)
SELECT
  (SELECT id FROM cms_pages WHERE slug = 'home'),
  'features',
  'Features Grid',
  jsonb_build_object(
    'heading_en', 'Everything You Need to Run Your Business',
    'heading_tr', 'İşletmenizi Yönetmek İçin İhtiyacınız Olan Her Şey',
    'subheading_en', 'Powerful features designed for modern businesses',
    'subheading_tr', 'Modern işletmeler için tasarlanmış güçlü özellikler',
    'features', jsonb_build_array(
      jsonb_build_object(
        'icon', 'FileText',
        'title_en', 'Smart Invoicing',
        'title_tr', 'Akıllı Faturalama',
        'description_en', 'Create professional invoices in seconds with automated calculations and e-invoice integration',
        'description_tr', 'Otomatik hesaplamalar ve e-fatura entegrasyonu ile saniyeler içinde profesyonel faturalar oluşturun'
      ),
      jsonb_build_object(
        'icon', 'Package',
        'title_en', 'Inventory Management',
        'title_tr', 'Envanter Yönetimi',
        'description_en', 'Track stock levels, manage products, and get low stock alerts automatically',
        'description_tr', 'Stok seviyelerini takip edin, ürünleri yönetin ve otomatik düşük stok uyarıları alın'
      ),
      jsonb_build_object(
        'icon', 'Users',
        'title_en', 'CRM & Customers',
        'title_tr', 'CRM & Müşteriler',
        'description_en', 'Manage customer relationships, track interactions, and grow your business',
        'description_tr', 'Müşteri ilişkilerini yönetin, etkileşimleri takip edin ve işinizi büyütün'
      ),
      jsonb_build_object(
        'icon', 'TrendingUp',
        'title_en', 'Financial Tracking',
        'title_tr', 'Finansal Takip',
        'description_en', 'Real-time financial insights with automated reports and cash flow tracking',
        'description_tr', 'Otomatik raporlar ve nakit akışı takibi ile gerçek zamanlı finansal içgörüler'
      ),
      jsonb_build_object(
        'icon', 'Zap',
        'title_en', 'Marketing Automation',
        'title_tr', 'Pazarlama Otomasyonu',
        'description_en', 'Run campaigns, track performance, and convert leads automatically',
        'description_tr', 'Kampanyalar yürütün, performansı takip edin ve potansiyel müşterileri otomatik olarak dönüştürün'
      ),
      jsonb_build_object(
        'icon', 'BarChart',
        'title_en', 'AI Insights',
        'title_tr', 'Yapay Zeka İçgörüleri',
        'description_en', 'Get intelligent recommendations and predictions powered by AI',
        'description_tr', 'Yapay zeka destekli akıllı öneriler ve tahminler alın'
      )
    )
  ),
  2
WHERE NOT EXISTS (
  SELECT 1 FROM cms_page_sections
  WHERE page_id = (SELECT id FROM cms_pages WHERE slug = 'home')
  AND section_key = 'features'
);

INSERT INTO cms_page_sections (page_id, section_key, section_name, content_json, order_index)
SELECT
  (SELECT id FROM cms_pages WHERE slug = 'home'),
  'social_proof',
  'Social Proof',
  jsonb_build_object(
    'heading_en', 'Trusted by Growing Businesses',
    'heading_tr', 'Büyüyen İşletmelerin Güvendiği',
    'stats', jsonb_build_array(
      jsonb_build_object(
        'number', '500+',
        'label_en', 'Active Users',
        'label_tr', 'Aktif Kullanıcı'
      ),
      jsonb_build_object(
        'number', '50K+',
        'label_en', 'Invoices Created',
        'label_tr', 'Oluşturulan Fatura'
      ),
      jsonb_build_object(
        'number', '99.9%',
        'label_en', 'Uptime',
        'label_tr', 'Çalışma Süresi'
      ),
      jsonb_build_object(
        'number', '24/7',
        'label_en', 'Support',
        'label_tr', 'Destek'
      )
    )
  ),
  3
WHERE NOT EXISTS (
  SELECT 1 FROM cms_page_sections
  WHERE page_id = (SELECT id FROM cms_pages WHERE slug = 'home')
  AND section_key = 'social_proof'
);

INSERT INTO cms_page_sections (page_id, section_key, section_name, content_json, order_index)
SELECT
  (SELECT id FROM cms_pages WHERE slug = 'home'),
  'pricing_preview',
  'Pricing Preview',
  jsonb_build_object(
    'heading_en', 'Simple, Transparent Pricing',
    'heading_tr', 'Basit, Şeffaf Fiyatlandırma',
    'subheading_en', 'Choose the plan that fits your business',
    'subheading_tr', 'İşletmenize uygun planı seçin',
    'cta_text_en', 'View All Plans',
    'cta_text_tr', 'Tüm Planları Görüntüle',
    'cta_link', '/pricing'
  ),
  4
WHERE NOT EXISTS (
  SELECT 1 FROM cms_page_sections
  WHERE page_id = (SELECT id FROM cms_pages WHERE slug = 'home')
  AND section_key = 'pricing_preview'
);

INSERT INTO cms_page_sections (page_id, section_key, section_name, content_json, order_index)
SELECT
  (SELECT id FROM cms_pages WHERE slug = 'home'),
  'final_cta',
  'Final Call to Action',
  jsonb_build_object(
    'heading_en', 'Ready to Transform Your Business?',
    'heading_tr', 'İşletmenizi Dönüştürmeye Hazır Mısınız?',
    'description_en', 'Join hundreds of businesses already using Modulus ERP to streamline their operations',
    'description_tr', 'Operasyonlarını kolaylaştırmak için Modulus ERP kullanan yüzlerce işletmeye katılın',
    'cta_text_en', 'Get Started Free',
    'cta_text_tr', 'Ücretsiz Başlayın',
    'cta_link', '/login',
    'secondary_text_en', 'No credit card required',
    'secondary_text_tr', 'Kredi kartı gerekmez'
  ),
  5
WHERE NOT EXISTS (
  SELECT 1 FROM cms_page_sections
  WHERE page_id = (SELECT id FROM cms_pages WHERE slug = 'home')
  AND section_key = 'final_cta'
);

-- Insert Pricing Page Sections
INSERT INTO cms_page_sections (page_id, section_key, section_name, content_json, order_index)
SELECT
  (SELECT id FROM cms_pages WHERE slug = 'pricing'),
  'hero',
  'Pricing Hero',
  jsonb_build_object(
    'heading_en', 'Pricing Plans',
    'heading_tr', 'Fiyatlandırma Planları',
    'subheading_en', 'Choose the perfect plan for your business needs',
    'subheading_tr', 'İşletme ihtiyaçlarınıza uygun planı seçin'
  ),
  1
WHERE NOT EXISTS (
  SELECT 1 FROM cms_page_sections
  WHERE page_id = (SELECT id FROM cms_pages WHERE slug = 'pricing')
  AND section_key = 'hero'
);

INSERT INTO cms_page_sections (page_id, section_key, section_name, content_json, order_index)
SELECT
  (SELECT id FROM cms_pages WHERE slug = 'pricing'),
  'plans',
  'Pricing Plans',
  jsonb_build_object(
    'plans', jsonb_build_array(
      jsonb_build_object(
        'name_en', 'Starter',
        'name_tr', 'Başlangıç',
        'price_monthly', '299',
        'price_yearly', '2990',
        'currency', 'TL',
        'description_en', 'Perfect for small businesses just getting started',
        'description_tr', 'Yeni başlayan küçük işletmeler için mükemmel',
        'features', jsonb_build_array(
          '5 Users',
          '100 Invoices/month',
          'Basic Inventory',
          'Email Support',
          'Mobile App Access'
        ),
        'is_popular', false
      ),
      jsonb_build_object(
        'name_en', 'Professional',
        'name_tr', 'Profesyonel',
        'price_monthly', '599',
        'price_yearly', '5990',
        'currency', 'TL',
        'description_en', 'For growing businesses that need more power',
        'description_tr', 'Daha fazla güce ihtiyaç duyan büyüyen işletmeler için',
        'features', jsonb_build_array(
          '15 Users',
          'Unlimited Invoices',
          'Advanced Inventory',
          'Priority Support',
          'CRM Features',
          'Marketing Automation',
          'API Access'
        ),
        'is_popular', true
      ),
      jsonb_build_object(
        'name_en', 'Enterprise',
        'name_tr', 'Kurumsal',
        'price_monthly', 'Custom',
        'price_yearly', 'Custom',
        'currency', 'TL',
        'description_en', 'For large organizations with custom needs',
        'description_tr', 'Özel ihtiyaçları olan büyük kuruluşlar için',
        'features', jsonb_build_array(
          'Unlimited Users',
          'Unlimited Everything',
          'Dedicated Support',
          'Custom Integration',
          'SLA Guarantee',
          'Training & Onboarding',
          'White Label Options'
        ),
        'is_popular', false
      )
    )
  ),
  2
WHERE NOT EXISTS (
  SELECT 1 FROM cms_page_sections
  WHERE page_id = (SELECT id FROM cms_pages WHERE slug = 'pricing')
  AND section_key = 'plans'
);

-- Insert Global Navbar Section
INSERT INTO cms_page_sections (page_id, section_key, section_name, content_json, order_index)
SELECT
  (SELECT id FROM cms_pages WHERE slug = 'global-navbar'),
  'menu_items',
  'Navigation Menu Items',
  jsonb_build_object(
    'logo_text_en', 'Modulus ERP',
    'logo_text_tr', 'Modulus ERP',
    'logo_url', '/modulustech-logo.svg',
    'menu_items', jsonb_build_array(
      jsonb_build_object(
        'label_en', 'Features',
        'label_tr', 'Özellikler',
        'href', '/features',
        'order', 1
      ),
      jsonb_build_object(
        'label_en', 'Pricing',
        'label_tr', 'Fiyatlandırma',
        'href', '/pricing',
        'order', 2
      ),
      jsonb_build_object(
        'label_en', 'Case Studies',
        'label_tr', 'Vaka Çalışmaları',
        'href', '/case-studies',
        'order', 3
      ),
      jsonb_build_object(
        'label_en', 'Help',
        'label_tr', 'Yardım',
        'href', '/help',
        'order', 4
      ),
      jsonb_build_object(
        'label_en', 'Contact',
        'label_tr', 'İletişim',
        'href', '/contact',
        'order', 5
      )
    ),
    'cta_button_text_en', 'Get Started',
    'cta_button_text_tr', 'Başlayın',
    'cta_button_link', '/login'
  ),
  1
WHERE NOT EXISTS (
  SELECT 1 FROM cms_page_sections
  WHERE page_id = (SELECT id FROM cms_pages WHERE slug = 'global-navbar')
  AND section_key = 'menu_items'
);

-- Insert Global Footer Section
INSERT INTO cms_page_sections (page_id, section_key, section_name, content_json, order_index)
SELECT
  (SELECT id FROM cms_pages WHERE slug = 'global-footer'),
  'footer_content',
  'Footer Content',
  jsonb_build_object(
    'company_name', 'Modulus Tech',
    'tagline_en', 'Smart Business Management for the Modern Era',
    'tagline_tr', 'Modern Çağ için Akıllı İşletme Yönetimi',
    'address', 'Istanbul, Turkey',
    'email', 'info@modulustech.com',
    'phone', '+90 (212) 555-0100',
    'social_links', jsonb_build_object(
      'twitter', 'https://twitter.com/modulustech',
      'linkedin', 'https://linkedin.com/company/modulustech',
      'facebook', 'https://facebook.com/modulustech',
      'instagram', 'https://instagram.com/modulustech'
    ),
    'footer_columns', jsonb_build_array(
      jsonb_build_object(
        'title_en', 'Product',
        'title_tr', 'Ürün',
        'links', jsonb_build_array(
          jsonb_build_object('label_en', 'Features', 'label_tr', 'Özellikler', 'href', '/features'),
          jsonb_build_object('label_en', 'Pricing', 'label_tr', 'Fiyatlandırma', 'href', '/pricing'),
          jsonb_build_object('label_en', 'Case Studies', 'label_tr', 'Vaka Çalışmaları', 'href', '/case-studies')
        )
      ),
      jsonb_build_object(
        'title_en', 'Company',
        'title_tr', 'Şirket',
        'links', jsonb_build_array(
          jsonb_build_object('label_en', 'About', 'label_tr', 'Hakkımızda', 'href', '/about'),
          jsonb_build_object('label_en', 'Contact', 'label_tr', 'İletişim', 'href', '/contact'),
          jsonb_build_object('label_en', 'Blog', 'label_tr', 'Blog', 'href', '/blog')
        )
      ),
      jsonb_build_object(
        'title_en', 'Support',
        'title_tr', 'Destek',
        'links', jsonb_build_array(
          jsonb_build_object('label_en', 'Help Center', 'label_tr', 'Yardım Merkezi', 'href', '/help'),
          jsonb_build_object('label_en', 'Documentation', 'label_tr', 'Dokümantasyon', 'href', '/docs'),
          jsonb_build_object('label_en', 'Support', 'label_tr', 'Destek', 'href', '/support')
        )
      )
    ),
    'copyright_text_en', '© 2024 Modulus Tech. All rights reserved.',
    'copyright_text_tr', '© 2024 Modulus Tech. Tüm hakları saklıdır.'
  ),
  1
WHERE NOT EXISTS (
  SELECT 1 FROM cms_page_sections
  WHERE page_id = (SELECT id FROM cms_pages WHERE slug = 'global-footer')
  AND section_key = 'footer_content'
);

-- Insert Contact Page Section
INSERT INTO cms_page_sections (page_id, section_key, section_name, content_json, order_index)
SELECT
  (SELECT id FROM cms_pages WHERE slug = 'contact'),
  'contact_info',
  'Contact Information',
  jsonb_build_object(
    'heading_en', 'Get in Touch',
    'heading_tr', 'İletişime Geçin',
    'description_en', 'Have questions? We would love to hear from you.',
    'description_tr', 'Sorularınız mı var? Sizden haber almayı çok isteriz.',
    'email', 'info@modulustech.com',
    'phone', '+90 (212) 555-0100',
    'address_en', 'Istanbul, Turkey',
    'address_tr', 'İstanbul, Türkiye',
    'office_hours_en', 'Monday - Friday: 9:00 AM - 6:00 PM',
    'office_hours_tr', 'Pazartesi - Cuma: 09:00 - 18:00'
  ),
  1
WHERE NOT EXISTS (
  SELECT 1 FROM cms_page_sections
  WHERE page_id = (SELECT id FROM cms_pages WHERE slug = 'contact')
  AND section_key = 'contact_info'
);