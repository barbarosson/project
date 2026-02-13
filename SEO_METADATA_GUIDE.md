# SEO & Dynamic Metadata Implementation Guide

## Overview

This project implements a comprehensive SEO strategy with dynamic metadata fetched from the Supabase `cms_pages` table. The architecture separates server-side metadata generation from client-side interactivity.

## Architecture Pattern

### Server Component + Client Component Pattern

For pages that need both dynamic metadata AND client-side interactivity:

1. **Page Component** (Server Component) - Handles metadata generation
2. **Content Component** (Client Component) - Handles interactivity

```typescript
// app/your-page/page.tsx (Server Component)
import { Metadata } from 'next'
import { getPageMetadata } from '@/lib/metadata'
import { YourPageContent } from '@/components/your-page-content'

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('your-page-slug')
}

export default function YourPage() {
  return <YourPageContent />
}
```

```typescript
// components/your-page-content.tsx (Client Component)
'use client'

export function YourPageContent() {
  // Your client-side hooks and logic here
  const { user } = useAuth()

  return (
    <div>
      {/* Your page content */}
    </div>
  )
}
```

## Metadata Helper Function

The `getPageMetadata` function fetches SEO data from the `cms_pages` table:

```typescript
import { getPageMetadata } from '@/lib/metadata'

// Fetches metadata for a specific page slug
const metadata = await getPageMetadata('home')
```

### Database Schema

The function queries the `cms_pages` table for:
- `title` - Page title
- `meta_description` - Meta description
- `og_image` - Open Graph image URL

### Fallback Metadata

If the database fetch fails or the page is not found, the function provides professional fallback metadata:

```typescript
{
  title: 'MODULUS - Smart ERP & CRM Suite',
  description: 'Professional SaaS-based modular ERP and CRM application...',
  ogImage: '/logo_slogan_ingilizce.png'
}
```

## Root Layout Configuration

The root layout (`app/layout.tsx`) provides comprehensive default metadata and PWA configuration:

### Key Features

1. **Montserrat Font**
   - Loaded with optimal weights (300-800)
   - Available as CSS variable: `var(--font-montserrat)`
   - Available as Tailwind class: `font-montserrat`

2. **Theme Color**
   - Modulus corporate blue: `#0A2540`
   - Applied to PWA status bar

3. **SEO Defaults**
   - Comprehensive Open Graph tags
   - Twitter Card support
   - Structured data ready
   - Robot indexing configured

4. **PWA Configuration**
   - Apple Web App capable
   - Optimized viewport settings
   - Mobile-friendly defaults

## Typography Setup

### Using Montserrat Font

The Montserrat font is configured in three ways:

1. **CSS Variable**: `--font-montserrat`
2. **Body Default**: Applied automatically to all text
3. **Tailwind Class**: `font-montserrat`

```jsx
// All three methods work:
<h1 style={{ fontFamily: 'var(--font-montserrat)' }}>Title</h1>
<h1 className="font-montserrat">Title</h1>
<h1>Title</h1> {/* Already uses Montserrat by default */}
```

## Smooth Scroll Behavior

Smooth scrolling is enabled globally via `globals.css`:

```css
html {
  scroll-behavior: smooth;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

This enables smooth anchor link navigation throughout the site.

## Adding Dynamic Metadata to New Pages

### Step 1: Create the Content Component

```typescript
// components/my-feature-content.tsx
'use client'

export function MyFeatureContent() {
  // Client-side logic here
  return <div>Content</div>
}
```

### Step 2: Create the Page with Metadata

```typescript
// app/my-feature/page.tsx
import { Metadata } from 'next'
import { getPageMetadata } from '@/lib/metadata'
import { MyFeatureContent } from '@/components/my-feature-content'

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('my-feature')
}

export default function MyFeaturePage() {
  return <MyFeatureContent />
}
```

### Step 3: Add CMS Data

Add a corresponding entry in the `cms_pages` table:

```sql
INSERT INTO cms_pages (slug, name, title, meta_description, og_image, is_active)
VALUES (
  'my-feature',
  'My Feature',
  'My Feature - MODULUS',
  'Discover the power of My Feature in MODULUS ERP',
  '/images/my-feature-og.png',
  true
);
```

## Best Practices

1. **Always use `getPageMetadata`** for consistent SEO implementation
2. **Keep slugs lowercase** and use hyphens (e.g., 'case-studies', not 'caseStudies')
3. **Provide descriptive meta descriptions** (150-160 characters optimal)
4. **Use high-quality Open Graph images** (1200x630px recommended)
5. **Test metadata** using social media debuggers:
   - [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
   - [Twitter Card Validator](https://cards-dev.twitter.com/validator)
   - [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)

## SEO Checklist

- [ ] Page has unique, descriptive title
- [ ] Meta description is 150-160 characters
- [ ] Open Graph image is 1200x630px
- [ ] Page slug matches CMS entry
- [ ] Title includes brand name
- [ ] Content is indexable (not blocked by robots)
- [ ] Images have alt text
- [ ] Links are descriptive
- [ ] Page loads in under 3 seconds
- [ ] Mobile-friendly and responsive

## Monitoring & Analytics

To track SEO performance:

1. **Google Search Console** - Monitor indexing and search performance
2. **Google Analytics** - Track organic traffic and user behavior
3. **PageSpeed Insights** - Monitor page load performance
4. **Lighthouse** - Audit overall page quality

## Technical Details

### Viewport Configuration

```typescript
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#0A2540',
}
```

### Metadata Template

```typescript
title: {
  default: 'MODULUS - Smart ERP & CRM Suite',
  template: '%s | MODULUS',
}
```

This template automatically appends "| MODULUS" to all page titles.

## Troubleshooting

### Metadata not updating?

1. Clear Next.js cache: `rm -rf .next`
2. Rebuild: `npm run build`
3. Verify database entry exists
4. Check slug spelling

### Font not loading?

1. Verify CSS variable is set in layout
2. Check Tailwind config includes font family
3. Ensure font-montserrat class is available

### PWA issues?

1. Check manifest.json is accessible
2. Verify all icon sizes exist
3. Test on actual mobile device

## Examples

### Homepage Implementation

The homepage demonstrates the complete pattern:

```typescript
// app/page.tsx
import { Metadata } from 'next'
import { getPageMetadata } from '@/lib/metadata'
import { HomePageContent } from '@/components/home-page-content'

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('home')
}

export default function HomePage() {
  return <HomePageContent />
}
```

This fetches metadata from the `cms_pages` table for the 'home' slug, while the actual page content and interactivity is handled by the client component.
