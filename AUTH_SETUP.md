# Authentication Setup Guide

## Quick Fix for Development

To get the sign-in page working without authentication errors, create a `.env.local` file in your project root with these minimal settings:

```bash
# NextAuth Configuration (Required)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-development-secret-key-change-in-production

# Optional: Leave empty for basic functionality
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
EMAIL_SERVER_HOST=
EMAIL_SERVER_PORT=
EMAIL_SERVER_USER=
EMAIL_SERVER_PASSWORD=
EMAIL_FROM=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
BLOB_READ_WRITE_TOKEN=
```

## What I Fixed

1. **Enhanced NextAuth Configuration**: Made the configuration more robust to handle missing environment variables gracefully.

2. **Custom Error Page**: Created `/auth/error` page to show helpful error messages instead of the generic NextAuth error.

3. **Development Notices**: Added helpful notices in development mode to guide users on what needs to be configured.

4. **Better Error Handling**: Improved error messages to be more user-friendly.

## How to Test

1. Create the `.env.local` file with the content above
2. Restart your development server: `npm run dev`
3. Navigate to `/auth/signin` - you should now see the sign-in page without errors
4. The authentication buttons will show a development notice explaining that providers need to be configured

## Full Authentication Setup (Optional)

If you want to enable actual authentication:

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add your domain to authorized origins
6. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env.local`

### Email Authentication
1. Configure SMTP settings (Gmail, SendGrid, etc.)
2. Set the email environment variables in `.env.local`

### Supabase (Database)
1. Create a Supabase project
2. Get your project URL and keys
3. Set the Supabase environment variables in `.env.local`

## Current Status

✅ **Fixed**: Sign-in page now loads without errors  
✅ **Fixed**: Custom error handling for authentication issues  
✅ **Fixed**: Development mode notices  
⚠️ **Note**: Actual authentication requires provider configuration 