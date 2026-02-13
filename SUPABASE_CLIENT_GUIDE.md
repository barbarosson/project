# Hardened Supabase Client Guide

## Overview

The `lib/supabase.ts` file provides a production-ready, hardened Supabase client with enterprise-grade features for reliability, performance, and security.

## Key Features

### 1. Environment Validation

The client performs comprehensive validation before initialization:

```typescript
// Validates required environment variables exist
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validates URL format is correct
// Throws descriptive errors if missing or invalid
```

**Error Examples:**

```
Missing NEXT_PUBLIC_SUPABASE_URL environment variable.
Please ensure it is defined in your .env file or environment configuration.

Invalid NEXT_PUBLIC_SUPABASE_URL: "not-a-url".
The URL must be a valid HTTP/HTTPS URL.
```

### 2. Singleton Pattern

The client uses a singleton pattern to prevent multiple instances:

```typescript
let supabaseInstance: SupabaseClient | null = null

function createSupabaseClient(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance // Returns existing instance
  }
  // Creates new instance only if none exists
}
```

**Benefits:**
- Prevents memory leaks during hot-reloading
- Ensures consistent connection pooling
- Reduces initialization overhead
- Maintains single source of truth for auth state

### 3. Realtime Configuration

Optimized for high-traffic CMS updates:

```typescript
realtime: {
  params: {
    eventsPerSecond: 10,
  },
}
```

**Configuration Details:**
- **eventsPerSecond: 10** - Limits realtime events to prevent overwhelming the client
- Ideal for CMS dashboards with frequent updates
- Prevents rate limiting in high-traffic scenarios
- Balances real-time updates with performance

**When to Adjust:**

```typescript
// Low-traffic applications (blogs, portfolios)
eventsPerSecond: 5

// Standard applications (dashboards, CMS)
eventsPerSecond: 10 (default)

// High-traffic applications (live chat, collaboration tools)
eventsPerSecond: 20
```

### 4. Enhanced Auth Configuration

```typescript
auth: {
  persistSession: true,           // Maintains session across page reloads
  autoRefreshToken: true,          // Automatically refreshes expired tokens
  detectSessionInUrl: true,        // Handles OAuth callback URLs
  flowType: 'pkce',                // Uses PKCE for enhanced security
  storage: window.localStorage,    // Browser-only storage
}
```

**Security Features:**
- **PKCE Flow**: Proof Key for Code Exchange prevents authorization code interception
- **Auto Token Refresh**: Seamless user experience without re-authentication
- **Secure Storage**: Uses localStorage only in browser environment

### 5. Development-Only Logging

```typescript
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  console.log('[Supabase] Client initialized in development mode')
}
```

**Logging Behavior:**
- Logs only in development mode
- Silent in production builds
- Client-side only (not in SSR)
- Helpful for debugging connection issues

### 6. Global Headers

```typescript
global: {
  headers: {
    'x-application-name': 'modulus-erp',
  },
}
```

**Purpose:**
- Identifies requests in Supabase logs
- Useful for monitoring and debugging
- Helps with rate limiting and analytics
- Can be used for API versioning

## Usage

### Basic Usage

```typescript
import { supabase } from '@/lib/supabase'

// Query data
const { data, error } = await supabase
  .from('customers')
  .select('*')
  .limit(10)

// Insert data
const { data, error } = await supabase
  .from('products')
  .insert({ name: 'New Product', price: 99.99 })

// Update data
const { data, error } = await supabase
  .from('invoices')
  .update({ status: 'paid' })
  .eq('id', invoiceId)

// Delete data
const { data, error } = await supabase
  .from('customers')
  .delete()
  .eq('id', customerId)
```

### Authentication

```typescript
import { supabase } from '@/lib/supabase'

// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure-password',
})

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'secure-password',
})

// Sign out
const { error } = await supabase.auth.signOut()

// Get current user
const { data: { user } } = await supabase.auth.getUser()
```

### Realtime Subscriptions

```typescript
import { supabase } from '@/lib/supabase'

// Subscribe to changes
const channel = supabase
  .channel('cms-updates')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'cms_pages',
    },
    (payload) => {
      console.log('CMS page updated:', payload)
    }
  )
  .subscribe()

// Unsubscribe when component unmounts
return () => {
  supabase.removeChannel(channel)
}
```

### Using the Helper Function

```typescript
import { getSupabaseClient } from '@/lib/supabase'

// Alternative way to get the client
const client = getSupabaseClient()
```

## Error Handling

### Environment Errors

If environment variables are missing, the application will fail fast with descriptive errors:

```typescript
try {
  const { data } = await supabase.from('table').select()
} catch (error) {
  // This will never happen - errors occur at initialization
  // The app won't start if env vars are missing
}
```

### Runtime Errors

```typescript
// Always check for errors in queries
const { data, error } = await supabase
  .from('customers')
  .select('*')

if (error) {
  console.error('Database error:', error.message)
  // Handle error appropriately
}
```

## Best Practices

### 1. Always Check for Errors

```typescript
// Good
const { data, error } = await supabase.from('table').select()
if (error) {
  console.error(error)
  return
}

// Bad
const { data } = await supabase.from('table').select()
// No error handling
```

### 2. Use Type-Safe Queries

```typescript
// Define types for your data
interface Customer {
  id: string
  name: string
  email: string
}

const { data } = await supabase
  .from('customers')
  .select<'*', Customer>('*')
```

### 3. Optimize Queries

```typescript
// Good - Select only needed columns
const { data } = await supabase
  .from('customers')
  .select('id, name, email')

// Bad - Selects all columns
const { data } = await supabase
  .from('customers')
  .select('*')
```

### 4. Handle Loading States

```typescript
const [loading, setLoading] = useState(true)

useEffect(() => {
  async function loadData() {
    setLoading(true)
    const { data, error } = await supabase.from('table').select()
    setLoading(false)
  }
  loadData()
}, [])
```

### 5. Clean Up Subscriptions

```typescript
useEffect(() => {
  const channel = supabase.channel('updates').subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [])
```

## Configuration Options

### Adjusting Realtime Settings

To modify realtime configuration, edit `lib/supabase.ts`:

```typescript
realtime: {
  params: {
    eventsPerSecond: 20, // Increase for high-traffic apps
  },
}
```

### Adding Custom Headers

```typescript
global: {
  headers: {
    'x-application-name': 'modulus-erp',
    'x-api-version': '1.0',
    'x-tenant-id': 'your-tenant-id',
  },
}
```

### Modifying Auth Behavior

```typescript
auth: {
  persistSession: true,
  autoRefreshToken: true,
  detectSessionInUrl: true,
  flowType: 'pkce',
  storage: customStorageImplementation, // Use custom storage
}
```

## Troubleshooting

### Client Not Initializing

**Problem:** Application crashes with environment variable errors

**Solution:**
1. Verify `.env` file exists in project root
2. Check environment variables are correctly named:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Restart development server after adding env vars

### Realtime Not Working

**Problem:** Subscriptions not receiving updates

**Solution:**
1. Check Realtime is enabled in Supabase dashboard
2. Verify table has correct RLS policies
3. Ensure subscription channel is properly configured
4. Check browser console for connection errors

### Auth Session Not Persisting

**Problem:** User logged out on page refresh

**Solution:**
1. Verify `persistSession: true` in auth config
2. Check browser allows localStorage
3. Ensure auth callbacks are properly configured
4. Check for CORS issues

### Performance Issues

**Problem:** Application slow with many realtime updates

**Solution:**
1. Reduce `eventsPerSecond` in realtime config
2. Debounce subscription handlers
3. Batch database operations
4. Use pagination for large datasets

## Security Considerations

### Environment Variables

- Never commit `.env` files to version control
- Use different credentials for development and production
- Rotate API keys regularly
- Use service role key only in secure backend functions

### Row Level Security (RLS)

```sql
-- Always enable RLS on tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Create restrictive policies
CREATE POLICY "Users can view own data"
  ON customers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
```

### PKCE Flow

The client uses PKCE (Proof Key for Code Exchange) by default:

```typescript
flowType: 'pkce' // More secure than implicit flow
```

**Benefits:**
- Prevents authorization code interception attacks
- Recommended for all public clients (SPAs, mobile apps)
- No client secret required

## Monitoring & Debugging

### Development Mode

In development, the client logs initialization:

```
[Supabase] Client initialized in development mode
```

### Production Monitoring

Monitor your Supabase dashboard for:
- API usage and rate limits
- Auth activity and failures
- Database performance metrics
- Realtime connection counts

### Custom Logging

Add custom logging for debugging:

```typescript
import { supabase } from '@/lib/supabase'

// Log all queries in development
if (process.env.NODE_ENV === 'development') {
  const originalFrom = supabase.from
  supabase.from = function(table) {
    console.log(`[Supabase] Query: ${table}`)
    return originalFrom.call(this, table)
  }
}
```

## Migration Path

### From Old Client

If you have existing code using an unhardened client:

**Before:**
```typescript
const supabase = createClient(url, key)
```

**After:**
```typescript
import { supabase } from '@/lib/supabase'
// No changes needed in usage
```

All existing queries and auth calls work identically.

## Performance Metrics

The hardened client provides:

- **Fast Initialization**: Singleton pattern prevents re-initialization
- **Optimized Realtime**: Rate limiting prevents overload
- **Efficient Auth**: Auto-refresh prevents re-authentication
- **Smart Caching**: Client-side caching when appropriate

## Support

For issues or questions:

1. Check Supabase documentation: https://supabase.com/docs
2. Review this guide for configuration options
3. Check browser console for client-side errors
4. Verify environment variables are correct
5. Test with Supabase CLI for backend issues

## Version History

- **v1.0** - Initial hardened implementation with environment validation, singleton pattern, realtime optimization, and enhanced security
