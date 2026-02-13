# Admin Panel Setup Guide

## Quick Start

The admin panel is now completely decoupled from the main application. Follow these steps to get started:

### 1. Grant Admin Access to a User

To make an existing user an admin, run this SQL query in your Supabase SQL Editor:

```sql
-- Make a user an admin
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'your-email@example.com';

-- Or make them a super admin
UPDATE public.profiles
SET role = 'super_admin'
WHERE email = 'your-email@example.com';
```

Alternatively, if you're using the default test account:

```sql
-- Grant super admin to admin@modulus.com
UPDATE public.profiles
SET role = 'super_admin'
WHERE email = 'admin@modulus.com';
```

### 2. Access the Admin Panel

1. Navigate to `/admin/login` in your browser
2. Sign in with your admin credentials
3. You'll be redirected to the admin dashboard at `/admin/site-commander`

### 3. Admin Panel Structure

The admin panel includes:

**Dashboard & Analytics**
- `/admin/site-commander` - Main dashboard and site configuration
- `/admin/diagnostics` - System diagnostics and analytics

**Content Management**
- `/admin/banner-studio` - Manage marketing banners
- `/admin/blog` - Blog post management
- `/admin/help-center` - Help documentation
- `/admin/testimonials` - Customer testimonials

**Marketing**
- `/admin/coupons` - Discount code management
- `/admin/pricing` - Pricing plan configuration

**Customer Support**
- `/admin/live-support` - Live chat support interface
- `/admin/helpdesk` - Support ticket management
- `/admin/demo-requests` - Demo request queue

**Settings**
- `/admin/cms-settings` - CMS configuration
- `/admin/design-system` - Design system controls

## Security Features

### Route Protection
- All `/admin/*` routes are protected by Next.js middleware
- Automatically redirects unauthorized users to `/admin/login`
- Validates both authentication and admin role

### API Protection
- All admin APIs under `/api/admin/*` require authentication
- Use `withAdminAuth` wrapper for admin-only endpoints
- Use `withSuperAdminAuth` for super-admin-only endpoints

### Role-Based Access
Three role levels:
- `user` - Regular app user (no admin access)
- `admin` - Full admin panel access
- `super_admin` - Additional privileges (user role management, etc.)

## Development Testing

### Create a Test Admin Account

1. Register a new user account at `/login`
2. Grant admin role via SQL:
   ```sql
   UPDATE public.profiles
   SET role = 'super_admin'
   WHERE email = 'your-test-email@example.com';
   ```
3. Sign out and sign back in at `/admin/login`

### Test Security Features

1. **Test unauthorized access**:
   - Try accessing `/admin/site-commander` without logging in
   - Should redirect to `/admin/login`

2. **Test role validation**:
   - Login as a regular user
   - Try accessing `/admin/*` routes
   - Should redirect to `/dashboard`

3. **Test API protection**:
   ```javascript
   // This should fail without proper token
   fetch('/api/admin/users')
     .then(res => res.json())
     .then(data => console.log(data));
   ```

## Creating New Admin Features

### Add a New Admin Page

1. Create file: `/app/admin/my-feature/page.tsx`
   ```tsx
   'use client';

   import { useAdmin } from '@/contexts/admin-context';

   export default function MyFeaturePage() {
     const { profile, isSuperAdmin } = useAdmin();

     return (
       <div>
         <h1>My Feature</h1>
         <p>Logged in as: {profile?.email}</p>
       </div>
     );
   }
   ```

2. Add navigation link in `/components/admin/admin-layout.tsx`:
   ```typescript
   {
     title: 'Your Section',
     items: [
       { name: 'My Feature', href: '/admin/my-feature', icon: Star },
     ],
   }
   ```

### Add a Protected API Endpoint

1. Create file: `/app/api/admin/my-endpoint/route.ts`
   ```typescript
   import { NextRequest, NextResponse } from 'next/server';
   import { withAdminAuth } from '@/lib/admin-auth';

   export async function GET(request: NextRequest) {
     return withAdminAuth(request, async (req, adminUser) => {
       // Your logic here
       return NextResponse.json({
         message: 'Success',
         adminEmail: adminUser.email
       });
     });
   }
   ```

2. Call from frontend:
   ```typescript
   const { data: { session } } = await supabase.auth.getSession();

   const response = await fetch('/api/admin/my-endpoint', {
     headers: {
       'Authorization': `Bearer ${session?.access_token}`,
     },
   });
   ```

## Troubleshooting

### Issue: "Insufficient permissions" error
**Solution**: Verify user role in database:
```sql
SELECT email, role FROM public.profiles WHERE email = 'your-email@example.com';
```

### Issue: Redirected to login repeatedly
**Solution**: Check browser cookies and clear site data, then login again.

### Issue: API returns 401 Unauthorized
**Solution**: Ensure you're passing the Authorization header with Bearer token:
```typescript
const { data: { session } } = await supabase.auth.getSession();

fetch('/api/admin/endpoint', {
  headers: {
    'Authorization': `Bearer ${session?.access_token}`,
  },
});
```

### Issue: Changes to role not taking effect
**Solution**: Sign out and sign back in. Role is cached in the session.

## Production Deployment Checklist

- [ ] Change default admin email from `admin@modulus.com` to your actual admin email
- [ ] Enable two-factor authentication for admin accounts (future enhancement)
- [ ] Set up IP whitelist for admin access (optional)
- [ ] Configure admin session timeout
- [ ] Set up admin activity logging
- [ ] Review and audit all admin API endpoints
- [ ] Test role-based access in production environment
- [ ] Document admin procedures for your team

## Next Steps

For more detailed information, see:
- `ADMIN_ARCHITECTURE.md` - Complete architecture documentation
- `/contexts/admin-context.tsx` - Admin authentication context
- `/lib/admin-auth.ts` - API security utilities
- `/middleware.ts` - Route protection logic

## Support

If you encounter issues with the admin panel:
1. Check the browser console for error messages
2. Verify database connection and role configuration
3. Review middleware logs in the terminal
4. Consult the architecture documentation

---

**Note**: The admin panel is completely isolated from the main application. Regular users cannot access admin routes, and admin sessions are managed separately from user sessions.
