# 🚀 Quick Start Guide

Get Rewind running in 5 minutes!

## Step 1: Supabase Setup (2 minutes)

### Create Project
1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in:
   - **Name:** Rewind
   - **Database Password:** (create a strong password)
   - **Region:** Choose closest to you
4. Click "Create new project" and wait ~2 minutes

### Set Up Database
1. In Supabase dashboard, click **SQL Editor** (left sidebar)
2. Click "New Query"
3. Open `supabase-schema.sql` from this project
4. Copy ALL the SQL code
5. Paste into Supabase SQL Editor
6. Click "Run" (or press Cmd/Ctrl + Enter)
7. You should see "Success. No rows returned"

### Create Storage Bucket
1. Click **Storage** in left sidebar
2. Click "Create a new bucket"
3. Name it: `rewind-photos`
4. Make it **Public**
5. Click "Create bucket"

### Get API Keys
1. Click **Settings** (gear icon) in left sidebar
2. Click **API**
3. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (long string under "Project API keys")

## Step 2: Configure App (30 seconds)

1. In the project folder, find `.env.example`
2. Copy it to create `.env`:
   ```bash
   cp .env.example .env
   ```
3. Open `.env` and paste your values:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-long-anon-key-here
   ```
4. Save the file

## Step 3: Run the App (1 minute)

### Option A: On Your iPhone (Recommended)

1. Install **Expo Go** from the App Store
2. In terminal, run:
   ```bash
   npm start
   ```
3. Scan the QR code with your iPhone camera
4. App opens in Expo Go!

### Option B: iOS Simulator (Mac only)

```bash
npm run ios
```

### Option C: Android

```bash
npm run android
```

## Step 4: Test It Out! 🎉

1. **Sign Up**
   - Enter email, username, and password
   - Click "Sign Up"
   - Then sign in with those credentials

2. **Take Your First Rewind**
   - Tap the camera icon (📸) at bottom
   - Grant camera permissions
   - Take a photo
   - Add a caption
   - Click "Share"

3. **View Feed**
   - Your photo appears in the feed!
   - Try liking it
   - Add a comment

4. **Enable Notifications**
   - Go to Profile tab
   - Tap "Enable Daily Notifications"
   - Grant permission
   - You'll get a random daily reminder!

## 🐛 Troubleshooting

### "Network request failed"
- Check your `.env` file has correct Supabase URL
- Make sure you're connected to internet
- Verify Supabase project is running (not paused)

### Camera not working
- Make sure you granted camera permissions
- Try restarting the app
- Check Settings > Privacy > Camera on your phone

### "Storage bucket not found"
- Make sure bucket is named exactly `rewind-photos`
- Verify it's set to Public
- Check Storage policies allow authenticated uploads

### App won't start
```bash
# Clear cache and restart
npx expo start -c
```

## 🎯 Next Steps

- Invite friends to test with you
- Customize the UI colors
- Add more features (see README.md)
- Deploy to TestFlight for beta testing

## 📚 Resources

- [Full Setup Guide](SETUP.md) - Detailed instructions
- [README](README.md) - Project overview
- [Supabase Docs](https://supabase.com/docs)
- [Expo Docs](https://docs.expo.dev)

## 💡 Tips

- **Development:** Use Expo Go for fastest iteration
- **Testing:** Use iOS Simulator for debugging
- **Production:** Build with EAS for App Store submission
- **Backend:** Monitor usage in Supabase dashboard

---

**Need help?** Check the full [SETUP.md](SETUP.md) or open an issue!
