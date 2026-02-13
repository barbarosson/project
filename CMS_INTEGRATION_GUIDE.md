# Full Site Commander - CMS Integration Guide

## Overview

The Full Site Commander is a comprehensive Content Management System that allows you to manage all website content dynamically through a database-driven approach. This guide explains how to use and integrate the CMS into your components.

## Architecture

### Database Schema

#### `cms_pages` Table
Stores page-level information including SEO meta tags:
- `slug`: URL-friendly identifier (e.g., 'home', 'pricing')
- `name`: Display name
- `title`: Browser tab title
- `meta_description`: SEO description
- `meta_keywords`: SEO keywords
- `og_image`: Open Graph image for social sharing
- `is_active`: Publish status

#### `cms_page_sections` Table
Stores section content as flexible JSON:
- `page_id`: Reference to cms_pages
- `section_key`: Unique identifier (e.g., 'hero', 'features')
- `section_name`: Display name for CMS
- `content_json`: Dynamic content as JSONB
- `order_index`: Display order
- `is_active`: Publish status

## Using the CMS

### 1. Admin Interface

Access the CMS at `/admin/site-commander` (admin users only).

**Features:**
- Page sidebar showing all website pages
- SEO settings editor (meta tags, OG images)
- Section accordion with dynamic field rendering
- Preview labels showing which part of the site you're editing
- Individual section save or save all changes

### 2. Integrating CMS Content in Components

#### Basic Usage

```typescript
import { useCMSContent } from '@/hooks/use-cms-content';

export function MyComponent() {
  const { getSectionContent, loading } = useCMSContent('home');

  const heroContent = getSectionContent('hero', {
    title_en: 'Default Title',
    title_tr: 'Varsayılan Başlık'
  });

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>{heroContent.title_en}</h1>
    </div>
  );
}
```

#### Advanced Usage with Full Control

```typescript
import { useCMSContent } from '@/hooks/use-cms-content';

export function FeaturesSection() {
  const { page, sections, getSectionContent, loading, error } = useCMSContent('features');

  const featuresContent = getSectionContent('features_grid', {
    heading_en: 'Our Features',
    features: []
  });

  return (
    <section>
      <h2>{featuresContent.heading_en}</h2>
      <div className="grid">
        {featuresContent.features.map((feature, index) => (
          <div key={index}>
            <h3>{feature.title_en}</h3>
            <p>{feature.description_en}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
```

#### Global Sections (Navbar, Footer)

```typescript
import { useCMSGlobalSection } from '@/hooks/use-cms-content';

export function Navbar() {
  const { content, loading } = useCMSGlobalSection('menu_items');

  if (loading || !content) return null;

  return (
    <nav>
      {content.menu_items?.map((item, index) => (
        <a key={index} href={item.href}>
          {language === 'en' ? item.label_en : item.label_tr}
        </a>
      ))}
    </nav>
  );
}
```

## Content Structure Best Practices

### Bilingual Content
Always include both English and Turkish versions:
```json
{
  "title_en": "Welcome",
  "title_tr": "Hoş Geldiniz",
  "description_en": "Our platform helps you...",
  "description_tr": "Platformumuz size yardımcı olur..."
}
```

### Complex Sections with Arrays
```json
{
  "heading_en": "Our Features",
  "heading_tr": "Özelliklerimiz",
  "features": [
    {
      "icon": "FileText",
      "title_en": "Smart Invoicing",
      "title_tr": "Akıllı Faturalama",
      "description_en": "Create invoices quickly",
      "description_tr": "Hızlı fatura oluşturun"
    }
  ]
}
```

### Nested Objects
```json
{
  "pricing": {
    "currency": "TL",
    "plans": [
      {
        "name_en": "Starter",
        "price_monthly": "299",
        "features": ["5 Users", "100 Invoices/month"]
      }
    ]
  }
}
```

## Dynamic Field Renderer

The CMS automatically generates appropriate input fields based on content structure:

- **Strings**: Text input (or textarea for long text)
- **Numbers**: Number input
- **Booleans**: Checkbox
- **Arrays**: Repeatable items with add/remove/reorder buttons
- **Objects**: Nested card with recursive rendering
- **URLs**: URL input with validation indicator

### Field Detection
- Fields containing `url`, `link`, `href` → URL input
- Fields containing `description`, `body`, `content` → Textarea
- All others → Regular input

## Example: Creating a New Page

### 1. Add to Database

```sql
-- Insert page
INSERT INTO cms_pages (slug, name, title, meta_description, order_index)
VALUES ('about', 'About Us', 'About - Modulus ERP', 'Learn about our company', 4);

-- Insert sections
INSERT INTO cms_page_sections (page_id, section_key, section_name, content_json, order_index)
VALUES (
  (SELECT id FROM cms_pages WHERE slug = 'about'),
  'team',
  'Team Section',
  '{
    "heading_en": "Meet Our Team",
    "heading_tr": "Ekibimizle Tanışın",
    "team_members": [
      {
        "name": "John Doe",
        "role_en": "CEO",
        "role_tr": "Genel Müdür",
        "image_url": "/team/john.jpg"
      }
    ]
  }'::jsonb,
  1
);
```

### 2. Create Component

```typescript
// app/about/page.tsx
'use client';

import { useCMSContent } from '@/hooks/use-cms-content';

export default function AboutPage() {
  const { getSectionContent } = useCMSContent('about');
  const teamContent = getSectionContent('team');

  return (
    <section>
      <h1>{teamContent.heading_en}</h1>
      <div className="grid">
        {teamContent.team_members?.map((member, i) => (
          <div key={i}>
            <img src={member.image_url} alt={member.name} />
            <h3>{member.name}</h3>
            <p>{member.role_en}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
```

### 3. Edit in CMS

1. Go to `/admin/site-commander`
2. Select "About Us" from sidebar
3. Edit SEO settings
4. Open "Team Section" accordion
5. Add/edit team members
6. Save changes

## SEO Integration

The CMS manages SEO meta tags per page. To use them:

```typescript
import { useCMSContent } from '@/hooks/use-cms-content';
import Head from 'next/head';

export default function MyPage() {
  const { page } = useCMSContent('home');

  return (
    <>
      <Head>
        <title>{page?.title}</title>
        <meta name="description" content={page?.meta_description} />
        <meta name="keywords" content={page?.meta_keywords} />
        <meta property="og:image" content={page?.og_image} />
      </Head>
      {/* Page content */}
    </>
  );
}
```

## Available Pages

The CMS comes pre-seeded with:
- Home (`home`)
- Features (`features`)
- Pricing (`pricing`)
- About (`about`)
- Contact (`contact`)
- Case Studies (`case-studies`)
- Help (`help`)
- Global Navbar (`global-navbar`)
- Global Footer (`global-footer`)

## Tips

1. **Always provide default values** in `getSectionContent()` for graceful fallbacks
2. **Use meaningful section keys** like 'hero', 'pricing_plans', 'contact_form'
3. **Keep content_json flat** when possible for easier editing
4. **Test with and without data** to ensure components handle empty states
5. **Log CMS data in development** to see what's being fetched

## Troubleshooting

### Content not showing
- Check browser console for CMS logs
- Verify page slug matches database
- Ensure section is marked as `is_active: true`
- Check if page is published (`is_active: true`)

### Fields not rendering
- Verify content_json structure in database
- Check for typos in section_key
- Ensure proper JSON format

### Performance
- CMS uses client-side fetching
- Consider caching for production
- Use loading states for better UX

## Security

- Only super admin (admin@modulus.com) can edit CMS
- Public users can only read active pages/sections
- RLS policies enforce strict access control
- All updates are timestamped automatically
