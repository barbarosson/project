# Social Authentication Setup Guide

This guide will help you configure Google and LinkedIn OAuth authentication for your Modulus application.

## Prerequisites

- A Supabase project (already configured)
- Access to Supabase Dashboard
- Google Cloud Console access (for Google OAuth)
- LinkedIn Developer Portal access (for LinkedIn OAuth)

## 1. Google OAuth Setup

### Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. If prompted, configure the OAuth consent screen:
   - Choose **External** user type
   - Fill in app name: "Modulus"
   - Add your email as support email
   - Add authorized domains (your production domain)
6. For Application type, select **Web application**
7. Add authorized JavaScript origins:
   ```
   https://your-supabase-project-ref.supabase.co
   ```
8. Add authorized redirect URIs:
   ```
   https://your-supabase-project-ref.supabase.co/auth/v1/callback
   ```
9. Click **Create** and save your:
   - Client ID
   - Client Secret

### Step 2: Configure in Supabase

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to **Authentication** > **Providers**
4. Find **Google** and click to enable
5. Enter your:
   - Client ID (from Google)
   - Client Secret (from Google)
6. Click **Save**

## 2. LinkedIn OAuth Setup

### Step 1: Create LinkedIn App

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Click **Create app**
3. Fill in the required information:
   - App name: "Modulus"
   - LinkedIn Page: (select or create one)
   - Privacy policy URL: Your privacy policy URL
   - App logo: Upload your logo
4. Click **Create app**
5. Navigate to **Auth** tab
6. Add **Authorized redirect URLs**:
   ```
   https://your-supabase-project-ref.supabase.co/auth/v1/callback
   ```
7. Under **Application credentials**, note your:
   - Client ID
   - Client Secret

### Step 2: Request API Access

1. In your LinkedIn app, go to **Products** tab
2. Request access to **Sign In with LinkedIn using OpenID Connect**
3. Wait for approval (usually instant)

### Step 3: Configure in Supabase

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to **Authentication** > **Providers**
4. Find **LinkedIn (OIDC)** and click to enable
5. Enter your:
   - Client ID (from LinkedIn)
   - Client Secret (from LinkedIn)
6. Click **Save**

## 3. Magic Link Configuration

Magic Link authentication is already enabled by default in Supabase. No additional configuration needed!

To customize the magic link email template:

1. Go to **Authentication** > **Email Templates**
2. Select **Magic Link**
3. Customize the template as needed
4. Click **Save**

## 4. Testing Authentication

### Test Google OAuth:
1. Go to your app's login page
2. Click "Continue with Google"
3. Sign in with a Google account
4. You should be redirected back to the dashboard

### Test LinkedIn OAuth:
1. Go to your app's login page
2. Click "Continue with LinkedIn"
3. Sign in with a LinkedIn account
4. You should be redirected back to the dashboard

### Test Magic Link:
1. Go to your app's login page
2. Switch to "Magic Link" tab
3. Enter your email address
4. Click "Send Magic Link"
5. Check your email for the login link
6. Click the link to sign in

## 5. Production Deployment

When deploying to production:

1. Update **authorized domains** in Google Cloud Console
2. Update **redirect URIs** in both Google and LinkedIn apps to include your production URL
3. Add your production domain to Supabase **Site URL** settings:
   - Go to **Authentication** > **URL Configuration**
   - Set Site URL to your production URL (e.g., `https://modulus.app`)
   - Add redirect URLs if needed

## 6. Troubleshooting

### Google OAuth Issues:
- Ensure redirect URI exactly matches what's in Supabase
- Check that OAuth consent screen is published (not in testing mode)
- Verify authorized domains include your Supabase project domain

### LinkedIn OAuth Issues:
- Ensure you have access to "Sign In with LinkedIn using OpenID Connect"
- Verify redirect URIs are correctly configured
- Check that app is not in draft mode

### Magic Link Issues:
- Check spam folder for magic link emails
- Verify email provider settings in Supabase
- Check authentication logs in Supabase Dashboard

## 7. Security Best Practices

1. **Never commit credentials** to version control
2. Use **environment variables** for sensitive data
3. Keep **client secrets secure** and rotate them periodically
4. Enable **email confirmations** for production
5. Set up **rate limiting** to prevent abuse
6. Monitor **authentication logs** regularly

## Support

For more information:
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [LinkedIn OAuth Documentation](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authentication)

---

**Note**: The application is already configured to handle social authentication. You just need to add the OAuth credentials in Supabase Dashboard.
