# Apple Sign-In Troubleshooting

## Current Error
"Sign In Failed - Failed to sign in with Apple. Please try again."

## Most Common Causes

### 1. Supabase Apple Provider Configuration

Go to your Supabase Dashboard and verify:

1. **Navigate to:** https://supabase.com/dashboard
2. **Select your project:** rfbbrzenglpgqvhbhpbu
3. **Go to:** Authentication → Providers → Apple

#### Check these settings:

✅ **Apple enabled:** Should be toggled ON

✅ **Services ID:** `com.rewindapp.ios.signin`

✅ **Secret Key (for OAuth):** Your `.p8` file content (multi-line)
```
-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg...
(multiple lines)
...
-----END PRIVATE KEY-----
```

✅ **Key ID:** Your Apple Key ID (from Apple Developer)

✅ **Team ID:** Your Apple Team ID (from Apple Developer)

✅ **Redirect URL:** Should be:
```
https://rfbbrzenglpgqvhbhpbu.supabase.co/auth/v1/callback
```

---

### 2. Apple Developer Portal Configuration

1. **Services ID Configuration:**
   - Services ID: `com.rewindapp.ios.signin`
   - Return URLs must include:
     ```
     https://rfbbrzenglpgqvhbhpbu.supabase.co/auth/v1/callback
     ```

2. **Key Configuration:**
   - Key must have "Sign in with Apple" enabled
   - Key must be active

---

## How to Fix

### Quick Check:

1. **Open Supabase Dashboard** → Authentication → Providers → Apple
2. **Verify ALL fields are filled** (especially the multi-line Secret Key)
3. **Click "Save"**
4. **Rebuild your app**

### If Still Failing:

Check the **Supabase logs** for detailed error:
- Dashboard → Logs → Auth Logs
- Look for errors when attempting Apple Sign-In

---

## After Fixing Configuration

You'll need to rebuild:

```bash
cd /Users/brennenstudenc/Desktop/Rewind/Rewind
npx eas build --platform ios --profile production --auto-submit
```

---

## What I Already Fixed

✅ **Persistent Sessions:** Added AsyncStorage so you won't need to sign in every time
✅ **Supabase Keys:** Added to app.json for production builds

These will work in the next build!
