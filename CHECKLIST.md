# ✅ Rewind Setup Checklist

Use this checklist to get your app running!

## 📋 Pre-Launch Checklist

### 1. Supabase Setup
- [ ] Create Supabase account at [supabase.com](https://supabase.com)
- [ ] Create new project (name: Rewind)
- [ ] Wait for project initialization (~2 minutes)
- [ ] Copy Project URL from Settings > API
- [ ] Copy Anon/Public key from Settings > API

### 2. Database Setup
- [ ] Open SQL Editor in Supabase
- [ ] Copy contents of `supabase-schema.sql`
- [ ] Paste and run in SQL Editor
- [ ] Verify tables created (users, photos, comments, likes, daily_prompts)
- [ ] Check that RLS policies are enabled

### 3. Storage Setup
- [ ] Go to Storage in Supabase dashboard
- [ ] Create new bucket named `rewind-photos`
- [ ] Set bucket to Public
- [ ] Verify upload policies allow authenticated users

### 4. Environment Configuration
- [ ] Copy `.env.example` to `.env`
- [ ] Add Supabase URL to `.env`
- [ ] Add Supabase Anon Key to `.env`
- [ ] Save file

### 5. Test the App
- [ ] Run `npm start` in terminal
- [ ] Scan QR code with Expo Go app
- [ ] Grant camera permissions
- [ ] Create test account
- [ ] Take first photo
- [ ] Verify photo appears in feed
- [ ] Test like functionality
- [ ] Test comment functionality
- [ ] Enable notifications

## 🎨 Optional Customization

### Branding
- [ ] Update app name in `app.json`
- [ ] Add custom app icon
- [ ] Add custom splash screen
- [ ] Update color scheme in components

### Features
- [ ] Configure notification timing
- [ ] Add custom fonts
- [ ] Customize Polaroid colors
- [ ] Add more photo filters

## 🚀 Deployment Checklist

### TestFlight (iOS Beta)
- [ ] Install EAS CLI: `npm install -g eas-cli`
- [ ] Login to Expo: `eas login`
- [ ] Configure project: `eas build:configure`
- [ ] Build for iOS: `eas build --platform ios`
- [ ] Submit to TestFlight: `eas submit --platform ios`

### App Store
- [ ] Create App Store Connect account
- [ ] Prepare app screenshots
- [ ] Write app description
- [ ] Create privacy policy
- [ ] Create terms of service
- [ ] Submit for review

## 🐛 Troubleshooting Checklist

### App Won't Start
- [ ] Check Node.js version (16+)
- [ ] Clear cache: `npx expo start -c`
- [ ] Reinstall dependencies: `rm -rf node_modules && npm install`
- [ ] Check for port conflicts

### Camera Issues
- [ ] Verify camera permissions granted
- [ ] Check device camera works in other apps
- [ ] Restart Expo development server
- [ ] Try on different device

### Upload Failures
- [ ] Verify Supabase URL in `.env`
- [ ] Check Anon Key is correct
- [ ] Verify storage bucket exists
- [ ] Check storage policies
- [ ] Look at console logs for errors

### Authentication Issues
- [ ] Check Supabase project is active
- [ ] Verify email confirmation settings
- [ ] Check RLS policies on users table
- [ ] Try different email address

## 📱 Testing Checklist

### Core Features
- [ ] Sign up with new account
- [ ] Sign in with existing account
- [ ] Take a photo
- [ ] Add caption
- [ ] Upload photo
- [ ] View photo in feed
- [ ] Like a photo
- [ ] Unlike a photo
- [ ] Add comment
- [ ] View profile
- [ ] Enable notifications
- [ ] Sign out

### Edge Cases
- [ ] Test with no internet
- [ ] Test with slow internet
- [ ] Test with very long caption
- [ ] Test with special characters in username
- [ ] Test rapid photo uploads
- [ ] Test on different devices
- [ ] Test on different iOS versions

## 🎯 Production Readiness

### Security
- [ ] Environment variables not committed
- [ ] API keys secured
- [ ] RLS policies tested
- [ ] Authentication flows secure
- [ ] User data protected

### Performance
- [ ] Images compressed
- [ ] Loading states implemented
- [ ] Error handling complete
- [ ] Offline mode considered
- [ ] Memory leaks checked

### User Experience
- [ ] Onboarding flow smooth
- [ ] Error messages helpful
- [ ] Loading indicators present
- [ ] Haptic feedback working
- [ ] Navigation intuitive

### Legal
- [ ] Privacy policy created
- [ ] Terms of service written
- [ ] Data collection disclosed
- [ ] GDPR compliance considered
- [ ] Age restrictions set

## 📊 Launch Day Checklist

### Pre-Launch
- [ ] Final testing on multiple devices
- [ ] Beta testers feedback incorporated
- [ ] All critical bugs fixed
- [ ] Analytics set up
- [ ] Error tracking enabled
- [ ] Support email configured

### Launch
- [ ] Submit to App Store
- [ ] Prepare marketing materials
- [ ] Social media posts ready
- [ ] Press release drafted
- [ ] Landing page live
- [ ] Support documentation ready

### Post-Launch
- [ ] Monitor crash reports
- [ ] Track user feedback
- [ ] Respond to reviews
- [ ] Fix critical bugs quickly
- [ ] Plan feature updates
- [ ] Engage with community

---

## 🎉 Quick Start (Minimum Steps)

If you just want to test quickly:

1. ✅ Create Supabase project
2. ✅ Run `supabase-schema.sql`
3. ✅ Create storage bucket
4. ✅ Add credentials to `.env`
5. ✅ Run `npm start`
6. ✅ Test on device!

**That's it! You're ready to Rewind! 📸**
