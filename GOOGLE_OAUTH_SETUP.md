# Supabase Google OAuth Setup Guide

## Overview
This guide explains how to configure Google OAuth authentication for AutoCare+ using Supabase.

## Implementation Summary

### Files Created:
1. **[src/components/auth/GoogleOAuthButton.tsx](src/components/auth/GoogleOAuthButton.tsx)** - Reusable Google OAuth button component
2. **[src/app/(auth)/actions/oauth.ts](src/app/(auth)/actions/oauth.ts)** - Server action for OAuth sign-in
3. **[src/app/auth/callback/route.ts](src/app/auth/callback/route.ts)** - OAuth callback handler

### Files Modified:
1. **[src/app/(auth)/login/LoginForm.tsx](src/app/(auth)/login/LoginForm.tsx)** - Added Google OAuth button with divider
2. **[src/app/(auth)/register/RegisterForm.tsx](src/app/(auth)/register/RegisterForm.tsx)** - Added Google OAuth button with divider

## Setup Instructions

### Step 1: Configure Environment Variables

Add the following to your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Change in production
```

### Step 2: Configure Google OAuth Provider in Supabase

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Create OAuth 2.0 credentials (Create Client ID):
   - Application type: Web application
   - Authorized redirect URIs: Add `https://your-project.supabase.co/auth/v1/callback?provider=google`
5. Copy the Client ID and Client Secret

### Step 3: Add Google Provider to Supabase

1. Go to your Supabase project dashboard
2. Navigate to Authentication → Providers
3. Enable Google provider
4. Paste the Client ID and Client Secret from Google Cloud Console
5. Set the Redirect URL to: `https://your-project.supabase.co/auth/v1/callback?provider=google`

### Step 4: Update Callback URL

Ensure your `NEXT_PUBLIC_APP_URL` environment variable matches your deployment domain:

- **Development**: `http://localhost:3000`
- **Production**: `https://your-domain.com`

## How It Works

1. **User clicks "Continue with Google"** → Triggers `GoogleOAuthButton` component
2. **Server action invoked** → `signInWithGoogle()` initiates OAuth flow
3. **User redirects to Google** → Approves authentication
4. **Callback received** → OAuth code sent to `/auth/callback` route
5. **Session established** → User redirected to dashboard

## Component Details

### GoogleOAuthButton Component
- Client component with loading state
- Displays Google logo and branding
- Uses `useTransition` for pending state
- Accessible and responsive design

### OAuth Actions
- Server-side action to initiate OAuth flow
- Handles Supabase auth configuration
- Redirects to Google OAuth endpoint

### Callback Route
- Exchanges authorization code for session
- Automatically creates user profile in Supabase
- Redirects to dashboard on success

## Troubleshooting

### "Redirect URI mismatch" error
- Verify the callback URL matches exactly in both Google Cloud Console and Supabase
- Check that `NEXT_PUBLIC_APP_URL` is set correctly

### "Invalid Client ID" error
- Ensure Google OAuth credentials are correctly entered in Supabase
- Verify they're for the correct project

### User not redirected to dashboard
- Check that `/app/(protected)/dashboard` exists
- Verify authentication middleware is configured correctly

## Testing OAuth Flow

1. Start development server: `npm run dev`
2. Navigate to `/login` or `/register`
3. Click "Continue with Google"
4. Authenticate with a Google account
5. Should be redirected to `/dashboard`

## Security Notes

- OAuth tokens are managed securely by Supabase
- User sessions are stored in HTTP-only cookies
- Never expose `NEXT_PUBLIC_SUPABASE_ANON_KEY` in client code (it's designed to be public)
- Sensitive operations should use the server-side client with service role key
