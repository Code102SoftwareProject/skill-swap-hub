# Google OAuth Setup Instructions

## 🔧 Setting up Google OAuth for SkillSwap Hub

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API (if needed) and Google Identity Services

### 2. Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Choose **External** user type
3. Fill in the required information:
   - **App name**: SkillSwap Hub
   - **User support email**: Your email
   - **Developer contact information**: Your email
4. Add scopes:
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile`
   - `openid`
5. Save and continue

### 3. Create OAuth Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client IDs**
3. Choose **Web application**
4. Add authorized redirect URIs:
   - `http://localhost:3000` (for development)
   - `https://yourdomain.com` (for production)
5. Copy the **Client ID** and **Client Secret**

### 4. Update Environment Variables

Replace the placeholder values in your `.env` file:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-actual-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-actual-google-client-secret
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-actual-google-client-id.apps.googleusercontent.com
```

### 5. Test the Integration

1. Start your development server: `npm run dev`
2. Go to the login page: `http://localhost:3000/login`
3. Click the **Sign in with Google** button
4. Complete the OAuth flow
5. If it's a new user, you should see the profile completion modal

## 🔄 How the Google Login Flow Works

1. **User clicks Google Login** → GoogleLoginButton component loads Google Identity Services
2. **Google Authentication** → User authenticates with Google and grants permissions
3. **Token Verification** → Your backend verifies the Google token with Google's servers
4. **User Creation/Login** → System either:
   - Creates a new user (if email doesn't exist)
   - Links Google account to existing user (if email exists)
5. **Profile Completion** → If new Google user, shows modal to collect phone & title
6. **JWT Generation** → System generates your app's JWT token
7. **Redirect** → User is redirected to dashboard or intended page

## 🛡️ Security Features

- **Token Verification**: Google tokens are verified server-side
- **Email Linking**: Existing email users can link their Google account
- **Profile Validation**: Required fields (phone, title) are collected before completion
- **Session Management**: Same JWT system as regular login
- **No Password Storage**: Google users don't need passwords in your system

## 🔧 Customization Options

### Change Google Button Appearance
Edit `src/components/auth/GoogleLoginButton.tsx`:

```typescript
window.google.accounts.id.renderButton(
  document.getElementById('google-signin-button'),
  {
    theme: 'filled_blue', // 'outline', 'filled_blue', 'filled_black'
    size: 'large', // 'large', 'medium', 'small'
    text: 'signin_with', // 'signin_with', 'signup_with', 'continue_with'
    shape: 'rectangular', // 'rectangular', 'pill', 'circle', 'square'
  }
);
```

### Modify Profile Completion Fields
Edit `src/components/auth/ProfileCompletionModal.tsx` to add or modify required fields.

### Change Redirect Behavior
Edit the `handleGoogleLogin` function in `src/app/login/page.tsx` to customize where users are redirected after login.

## 🐛 Troubleshooting

### Common Issues:

1. **"Invalid client ID"** → Check GOOGLE_CLIENT_ID in .env
2. **"Unauthorized redirect URI"** → Add your domain to Google Console
3. **Google button not loading** → Check network and NEXT_PUBLIC_GOOGLE_CLIENT_ID
4. **Profile modal not showing** → Check console for errors in ProfileCompletionModal

### Debug Steps:

1. Check browser console for JavaScript errors
2. Verify Google Console settings
3. Check server logs for API errors
4. Test with incognito window to avoid cached credentials

## 📱 Mobile Considerations

The Google OAuth integration works on mobile browsers. For native mobile apps, you would need to:
1. Add mobile redirect URIs to Google Console
2. Handle deep linking
3. Consider using Google Sign-In SDKs for better UX

## 🚀 Production Deployment

Before going live:

1. **Update redirect URIs** in Google Console with production domain
2. **Test thoroughly** with real Google accounts
3. **Monitor error logs** for OAuth-related issues
4. **Set up proper error tracking** (e.g., Sentry)
5. **Verify HTTPS** is working properly
6. **Test profile completion flow** with various user scenarios

## 📊 Analytics & Monitoring

Track Google login usage:
- Monitor successful Google logins vs traditional logins
- Track profile completion rates
- Monitor OAuth error rates
- Track user retention for Google vs email users

This implementation provides a seamless Google OAuth experience while maintaining your existing authentication architecture!
