# Admin Panel Architecture

This document describes the decoupled admin panel architecture implemented in this application.

## Overview

The admin panel is completely isolated from the main application with its own:
- Authentication flow
- Layout system
- Route protection
- API security layer

## Directory Structure

```
/app/admin/                    # All admin pages
  /login/                      # Dedicated admin login
  layout.tsx                   # Admin layout wrapper
  /site-commander/             # Admin pages
  /banner-studio/
  /...other admin pages/

/app/api/admin/                # Protected admin API routes
  /users/                      # Example: User management API

/components/admin/             # Admin-only components
  admin-layout.tsx             # Main admin layout

/contexts/
  admin-context.tsx            # Admin authentication context

/lib/
  admin-auth.ts                # API authentication utilities

middleware.ts                  # Route protection middleware
```

## Authentication Flow

### 1. Admin Login
- Dedicated login page at `/admin/login`
- Validates both Supabase auth AND admin role
- Redirects non-admin users to regular dashboard
- Supports redirect parameter for deep linking

### 2. Route Protection (Middleware)
All `/admin/*` routes (except `/admin/login`) are protected by Next.js middleware:
- Checks for valid Supabase session
- Verifies user has `admin` or `super_admin` role
- Redirects unauthorized users to `/admin/login`

### 3. Session Management
- Admin context (`AdminProvider`) manages admin session state
- Automatically checks role on auth state changes
- Signs out users if role is revoked

## Role-Based Access Control (RBAC)

### Database Schema
The `profiles` table includes a `role` column with three values:
- `user` - Regular application user (no admin access)
- `admin` - Admin user (full admin panel access)
- `super_admin` - Super admin (additional privileges)

### Checking Roles in Components

```tsx
'use client';

import { useAdmin } from '@/contexts/admin-context';

export function AdminPage() {
  const { profile, isSuperAdmin } = useAdmin();

  return (
    <div>
      <h1>Welcome, {profile?.full_name}</h1>
      {isSuperAdmin && (
        <button>Super Admin Only Feature</button>
      )}
    </div>
  );
}
```

## API Security

### Protecting API Routes

All admin API routes should be under `/app/api/admin/` and use the authentication helpers:

```typescript
// app/api/admin/example/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req, adminUser) => {
    // adminUser.id, adminUser.email, adminUser.role are available

    // Your API logic here
    return NextResponse.json({ data: 'Protected data' });
  });
}
```

### Super Admin Only Routes

```typescript
import { withSuperAdminAuth } from '@/lib/admin-auth';

export async function DELETE(request: NextRequest) {
  return withSuperAdminAuth(request, async (req, adminUser) => {
    // Only super admins can access this
    return NextResponse.json({ success: true });
  });
}
```

## Admin Layout System

The admin panel has its own layout system completely isolated from the main app.

### Features:
- Collapsible sidebar
- Mobile responsive
- Role badge for super admins
- Admin-specific navigation
- Dedicated admin topbar

### Navigation Structure
Navigation is defined in `admin-layout.tsx` and organized by sections:
- Dashboard (Overview, Analytics, Activity)
- Content Management (Site Commander, Blog, etc.)
- Marketing (Campaigns, Coupons, Pricing)
- Customer Support (Live Chat, Help Desk)
- Settings (CMS Settings, Design System)

## Creating New Admin Pages

1. **Create page file** under `/app/admin/your-page/page.tsx`
2. **Use client directive** if you need React hooks
3. **Use admin context** to access admin user data
4. **Add navigation link** in `admin-layout.tsx`

Example:
```tsx
'use client';

import { useAdmin } from '@/contexts/admin-context';

export default function AdminCustomPage() {
  const { profile, isSuperAdmin } = useAdmin();

  return (
    <div>
      <h1>Custom Admin Page</h1>
      <p>Logged in as: {profile?.email}</p>
    </div>
  );
}
```

## Creating Admin API Endpoints

1. **Create route file** under `/app/api/admin/your-endpoint/route.ts`
2. **Import auth helper** from `@/lib/admin-auth`
3. **Wrap handler** with `withAdminAuth` or `withSuperAdminAuth`

Example:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (req, adminUser) => {
    const body = await req.json();

    // Your logic here

    return NextResponse.json({ success: true });
  });
}
```

## Calling Admin APIs from Frontend

```typescript
const response = await fetch('/api/admin/users', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  },
});

const data = await response.json();
```

## Security Best Practices

1. **Never skip role checks** - Always verify admin role on both client and server
2. **Use RLS policies** - Database-level security is the last line of defense
3. **Validate input** - Always validate and sanitize user input in API routes
4. **Log admin actions** - Use the `activity_log` table to track admin actions
5. **Session timeout** - Supabase handles session expiration automatically

## Granting Admin Access

To make a user an admin:

```sql
-- Using SQL (Super Admin only)
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'user@example.com';

-- Or via API (Super Admin only)
PATCH /api/admin/users
{
  "userId": "uuid-here",
  "updates": { "role": "admin" }
}
```

## Testing Admin Features

1. **Create test admin user**:
   ```sql
   UPDATE public.profiles
   SET role = 'super_admin'
   WHERE email = 'your-test-email@example.com';
   ```

2. **Login at** `/admin/login`

3. **Verify middleware** - Try accessing admin routes without login

4. **Test API security** - Try calling admin APIs without proper token

## Migration Guide

All existing admin pages are now protected by the new architecture. No changes needed to existing admin pages as they automatically inherit the new layout through `/app/admin/layout.tsx`.

## Future Enhancements

- [ ] Admin activity logging dashboard
- [ ] Two-factor authentication for admin accounts
- [ ] IP whitelist for admin access
- [ ] Admin session management (force logout)
- [ ] Granular permissions system
- [ ] Admin notifications system
