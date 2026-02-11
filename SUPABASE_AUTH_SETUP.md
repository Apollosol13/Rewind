# Authentication Setup Guide

This guide will help you configure **Email Verification** and **Sign in with Apple** for Rewind.

---

## 📧 Email Verification Setup

### Step 1: Enable Email Confirmation in Supabase

1. Go to your **Supabase Dashboard**
2. Navigate to **Authentication** → **Settings**
3. Scroll to **Email Auth**
4. Find **"Enable email confirmations"** and **turn it ON**
5. Click **Save**

### Step 2: Customize Email Templates (Optional)

1. In Supabase Dashboard, go to **Authentication** → **Email Templates**
2. Edit the **"Confirm signup"** template to match your branding
3. Use these variables in your template:
   - `{{ .ConfirmationURL }}` - The verification link
   - `{{ .Email }}` - User's email
   - `{{ .SiteURL }}` - Your app URL

### Step 3: Test Email Verification

1. Sign up with a new account in the app
2. Check your email for the verification link
3. Click the link to verify
4. Try signing in with the verified account

**Note:** New users must verify their email before they can sign in!

---

## 🍎 Sign in with Apple Setup

### Step 1: Configure Apple Developer Account

1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Click **Identifiers** → Select your App ID
4. Enable **"Sign in with Apple"** capability
5. Click **Save**

### Step 2: Configure Supabase for Apple OAuth

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Find **Apple** in the list
3. **Enable** the Apple provider
4. You'll need:
   - **Services ID** (create one in Apple Developer Portal)
   - **Private Key** (generate in Apple Developer Portal)
   - **Key ID**
   - **Team ID**

#### Detailed Apple Provider Setup:

1. **Create a Services ID:**
   - In Apple Developer Portal → Identifiers → Create new **Services ID**
   - Bundle ID: `com.rewind.app.services` (or similar)
   - Enable "Sign in with Apple"
   - Configure domains and return URLs (use Supabase callback URL)

2. **Generate a Private Key:**
   - In Apple Developer Portal → Keys → Create new Key
   - Enable "Sign in with Apple"
   - Download the `.p8` key file (you can only download once!)
   - Note the Key ID

3. **Get Your Team ID:**
   - Found in Apple Developer Portal → Membership

4. **Enter in Supabase:**
   - Services ID: Your Services ID from step 1
   - Team ID: Your Team ID from step 3
   - Key ID: Your Key ID from step 2
   - Private Key: Contents of your `.p8` file

5. **Configure Redirect URLs:**
   - In Apple Developer Portal, add Supabase's callback URL
   - Format: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`

### Step 3: Build and Test

Since Apple Sign-In requires native capabilities, you need to:

1. **Build with EAS:**
   ```bash
   npx eas build --platform ios --profile preview
   ```

2. **Install the build on a physical iOS device**
   - Apple Sign-In doesn't work in Expo Go or simulators

3. **Test the flow:**
   - Open the app
   - Tap "Sign in with Apple"
   - Authenticate with your Apple ID
   - You should be signed in!

---

## 🔧 Troubleshooting

### Email Verification Issues:
- **No email received:** Check spam folder, verify email provider settings in Supabase
- **"Email not confirmed" error:** User needs to click verification link in email
- **Can't resend email:** Wait a few minutes between resend attempts

### Apple Sign-In Issues:
- **Button not showing:** Only shows on real iOS devices, not Expo Go or web
- **"Invalid client" error:** Check your Services ID and redirect URLs in Apple Developer Portal
- **"Invalid token" error:** Verify your private key and Key ID in Supabase

---

## 📱 Testing Checklist

- [ ] Email verification enabled in Supabase
- [ ] New user receives verification email
- [ ] Verification link works correctly
- [ ] Unverified users cannot sign in
- [ ] "Resend email" button works
- [ ] Apple Sign-In capability added to App ID
- [ ] Supabase Apple provider configured
- [ ] App built with EAS (not Expo Go)
- [ ] Apple Sign-In works on physical iOS device
- [ ] New Apple users get a profile created

---

## 🎯 App Store Requirements

**For App Store approval, you MUST:**
- ✅ Enable email verification (reduces spam accounts)
- ✅ Have Sign in with Apple if you offer ANY social login
- ✅ Apple Sign-In button should be prominently displayed
- ✅ Apple Sign-In should be equal or more prominent than other social logins

Your app now meets these requirements! 🎉
