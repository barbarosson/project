# Netlify Environment Variables Configuration

This document lists all required environment variables for deploying the Modulus ERP system on Netlify.

## Required Environment Variables

### 1. Supabase Configuration (Frontend - Next.js)

These variables are used by the Next.js frontend to connect to Supabase:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**How to get these values:**
1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy the "Project URL" for `NEXT_PUBLIC_SUPABASE_URL`
4. Copy the "anon public" key for `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Used in:**
- Frontend authentication
- Client-side database queries
- Real-time subscriptions
- File storage operations

---

### 2. Supabase Edge Functions Environment Variables

These variables are automatically available in Supabase Edge Functions and do NOT need to be added to Netlify. They are managed by Supabase:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Note:** These are pre-configured in your Supabase project and are automatically available to all edge functions.

---

### 3. Email Service (Resend) - OPTIONAL

Required for sending emails (demo requests, support tickets, welcome emails):

```
RESEND_API_KEY=re_your_api_key_here
```

**How to get this value:**
1. Sign up at https://resend.com
2. Navigate to API Keys section
3. Create a new API key
4. Copy and paste the key

**Used in:**
- Send demo request confirmation emails
- Send support ticket notifications
- Send welcome emails to new users
- Send system notifications

**If not set:** Email features will be disabled, but the application will continue to work.

---

### 4. AI Services Configuration - OPTIONAL

#### OpenAI API Key
Required for AI-powered features (Accounting AI, CRM AI, Finance Robot):

```
OPENAI_API_KEY=sk-your-openai-api-key
```

**How to get this value:**
1. Sign up at https://platform.openai.com
2. Navigate to API Keys
3. Create a new secret key
4. Copy and paste the key

**Used in:**
- Accounting AI Agent
- CRM AI Insights
- Finance Robot AI recommendations
- Production Advisor AI
- Procurement AI Insights

**If not set:** AI features will show an error or fallback to basic functionality.

#### AI Cash Flow Service URL
Optional URL for the Python-based AI service:

```
NEXT_PUBLIC_AI_SERVICE_URL=http://localhost:8000
```

**Default:** `http://localhost:8000` (for local development)

**For production:** If you deploy the Python AI service separately, set this to your service URL.

**Used in:**
- Advanced cash flow predictions
- ML-based financial forecasting
- Rule-based business intelligence

**If not set:** Advanced AI cash flow features will not be available, but basic financial tracking will still work.

---

### 5. Build Configuration - OPTIONAL

These variables are used during the build process:

```
NEXT_TELEMETRY_DISABLED=1
NODE_VERSION=20
```

**Purpose:**
- `NEXT_TELEMETRY_DISABLED`: Disables Next.js telemetry collection
- `NODE_VERSION`: Ensures consistent Node.js version (set in netlify.toml)

**Note:** These are already configured in `netlify.toml` and don't need to be added separately.

---

### 6. Deployment Tracking - OPTIONAL

Optional variables for deployment tracking:

```
NEXT_PUBLIC_DEPLOYMENT_ID=v2-timestamp
DEPLOYMENT_TRIGGER=v2-timestamp
```

**Purpose:** Used for cache busting and deployment tracking

**If not set:** Will be auto-generated during build

---

## Complete Environment Variables List for Netlify

### Minimal Required Configuration (Must Have)
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Recommended Configuration (Core Features)
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
RESEND_API_KEY=re_your_api_key_here
OPENAI_API_KEY=sk-your-openai-api-key
```

### Full Configuration (All Features)
```
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Email Service
RESEND_API_KEY=re_your_api_key_here

# AI Services
OPENAI_API_KEY=sk-your-openai-api-key
NEXT_PUBLIC_AI_SERVICE_URL=https://your-ai-service-url.com

# Build Configuration (optional)
NEXT_TELEMETRY_DISABLED=1
```

---

## How to Add Environment Variables in Netlify

1. Go to your Netlify dashboard
2. Select your site
3. Navigate to **Site settings** → **Environment variables**
4. Click **Add a variable** or **Add variables**
5. For each variable:
   - Enter the **Key** (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
   - Enter the **Value** (e.g., `https://your-project.supabase.co`)
   - Select scope: **All deploy contexts** (recommended)
6. Click **Create variable**
7. After adding all variables, trigger a new deployment

---

## Environment Variable Scopes

- **Production:** Variables used only in production deployments
- **Deploy previews:** Variables used in preview deployments (pull requests)
- **Branch deploys:** Variables used in branch-specific deployments
- **All deploy contexts:** Variables used in all deployments (recommended for most cases)

---

## Security Best Practices

1. **Never commit environment variables to Git**
   - The `.env` file is already in `.gitignore`
   - Use `.env.example` for documentation only

2. **Use different keys for different environments**
   - Production keys should be different from development keys
   - Rotate keys periodically

3. **Prefix client-side variables with NEXT_PUBLIC_**
   - Variables without this prefix are not exposed to the browser
   - Only use `NEXT_PUBLIC_` for values that are safe to expose

4. **Keep service role keys secure**
   - Only use service role keys in server-side code or edge functions
   - Never expose service role keys to the frontend

5. **Rotate API keys regularly**
   - Set up key rotation schedules
   - Monitor API key usage for unusual activity

---

## Troubleshooting

### Build Fails with "Missing environment variable"
- Ensure all required variables are set in Netlify
- Check for typos in variable names
- Verify variable values are not empty

### Application fails to connect to Supabase
- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct and accessible
- Check that `NEXT_PUBLIC_SUPABASE_ANON_KEY` is valid
- Ensure variables have the `NEXT_PUBLIC_` prefix

### Email features not working
- Verify `RESEND_API_KEY` is set correctly
- Check Resend dashboard for API key status
- Verify your domain is verified in Resend (if using custom domain)

### AI features not responding
- Verify `OPENAI_API_KEY` is set and valid
- Check OpenAI dashboard for API key status and usage limits
- Ensure you have sufficient credits in your OpenAI account

---

## Current Configuration Status

Based on your `.env` and `.env.production` files:

✅ **Currently Configured:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

❌ **Not Configured (Optional):**
- `RESEND_API_KEY` - Required for email features
- `OPENAI_API_KEY` - Required for AI features
- `NEXT_PUBLIC_AI_SERVICE_URL` - Required for advanced AI cash flow predictions

---

## Next Steps

1. Add the required environment variables to Netlify
2. Optionally add email and AI service keys for full functionality
3. Trigger a new deployment
4. Verify the application works correctly
5. Test email and AI features if configured
