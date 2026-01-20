# Rewind App - Setup Guide 📸

A nostalgic Polaroid-style BeReal clone built with React Native & Expo.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- iOS device or simulator (for testing)
- Supabase account (free tier works!)

### 1. Install Dependencies

Already done! All packages are installed. ✅

### 2. Set Up Supabase Backend

#### A. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for database to initialize (~2 minutes)

#### B. Set Up Database
1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `supabase-schema.sql`
3. Paste and run the SQL to create tables, policies, and triggers

#### C. Set Up Storage Bucket
1. Go to **Storage** in Supabase dashboard
2. Create a new bucket called `rewind-photos`
3. Make it **Public** (for easier access)
4. Set these policies:
   - SELECT: Allow public access
   - INSERT: Allow authenticated users only
   - DELETE: Allow users to delete their own files

#### D. Get Your API Keys
1. Go to **Settings** > **API**
2. Copy:
   - Project URL (e.g., `https://xxxxx.supabase.co`)
   - `anon/public` key

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run the App

```bash
# Start Expo development server
npm start

# Or run directly on iOS
npm run ios

# Or run on Android
npm run android

# Or run in web browser (limited features)
npm run web
```

## 📱 Testing on Your iPhone

### Option 1: Expo Go App (Easiest)
1. Install **Expo Go** from the App Store
2. Run `npm start`
3. Scan the QR code with your iPhone camera
4. App will open in Expo Go

### Option 2: Development Build (Full Features)
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build development client
eas build --profile development --platform ios

# Install on your device when build completes
```

## 🎨 Features Implemented

- ✅ Polaroid-style camera UI with rainbow stripe
- ✅ Photo capture with vintage frame
- ✅ Handwritten caption input (Caveat font)
- ✅ Social feed with Polaroid cards
- ✅ User authentication (email/password)
- ✅ Photo storage in Supabase
- ✅ Likes and comments system
- ✅ Daily notification setup
- ✅ User profiles
- ✅ Beautiful cream-colored nostalgic UI

## 📁 Project Structure

```
Rewind/
├── app/                          # Expo Router pages
│   ├── (tabs)/                   # Tab navigation
│   │   ├── index.tsx            # Feed screen
│   │   └── profile.tsx          # Profile screen
│   ├── _layout.tsx              # Root layout
│   ├── auth.tsx                 # Auth screen
│   └── camera.tsx               # Camera screen
├── src/
│   ├── components/              # Reusable components
│   │   ├── CameraButton.tsx    # Polaroid shutter button
│   │   ├── HandwrittenText.tsx # Caveat font text
│   │   ├── PhotoCard.tsx       # Photo in feed
│   │   └── PolaroidFrame.tsx   # Polaroid image frame
│   ├── config/
│   │   └── supabase.ts         # Supabase client
│   ├── screens/                # Main screens
│   │   ├── AuthScreen.tsx
│   │   ├── CameraScreen.tsx
│   │   ├── FeedScreen.tsx
│   │   └── ProfileScreen.tsx
│   ├── services/               # API services
│   │   ├── auth.ts            # Authentication
│   │   ├── notifications.ts   # Push notifications
│   │   └── photos.ts          # Photo CRUD
│   └── utils/                 # Utilities
│       ├── dateFormatter.ts   # Date formatting
│       └── polaroidFilter.ts  # Image processing
└── supabase-schema.sql        # Database schema
```

## 🎯 Next Steps / Enhancements

### Essential Features to Add:
1. **BeReal-style dual camera** - Capture front + back simultaneously
2. **2-minute timer** - Time pressure after notification
3. **Friends system** - Add/follow friends
4. **Discovery feed** - See nearby or trending Rewinds
5. **Photo reactions** - More than just likes (e.g., retro stickers)

### UI Enhancements:
1. **Shake to develop** - Shake phone to reveal photo (like developing Polaroid)
2. **Photo album view** - Make profile look like a scrapbook
3. **Loading animations** - Polaroid ejecting animation
4. **Sound effects** - Camera shutter sound
5. **Rotation effect** - Slight random rotation on photos for authenticity

### Technical Improvements:
1. **Image compression** - Optimize uploads
2. **Offline mode** - Queue uploads when offline
3. **Push notifications** - Implement actual daily reminders
4. **Analytics** - Track usage patterns
5. **Error handling** - Better error states and retries

## 🐛 Troubleshooting

### Camera not working
- Make sure you've granted camera permissions
- Try restarting the Expo server
- Check that camera is not being used by another app

### Images not uploading
- Verify Supabase storage bucket is created and public
- Check that `.env` file has correct credentials
- Look at console logs for specific errors

### App won't start
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
npx expo start -c
```

### Fonts not loading
Fonts are loaded asynchronously. The app shows a loading state until fonts are ready.

## 📚 Tech Stack

- **React Native** - Mobile framework
- **Expo** - Development platform
- **TypeScript** - Type safety
- **Supabase** - Backend (PostgreSQL + Storage + Auth)
- **Expo Router** - File-based navigation
- **Expo Camera** - Camera functionality
- **Caveat Font** - Handwritten captions

## 🎨 Design Philosophy

Rewind is designed to evoke nostalgia with:
- **Cream white backgrounds** (#F5F5F0) like aged paper
- **Polaroid frames** with rainbow stripe branding
- **Handwritten fonts** (Caveat) for captions
- **Date stamps** on every photo
- **Coral red accents** (#EF4249) for CTAs
- **Minimal UI** to focus on memories

## 📝 License

This is a portfolio/learning project. Feel free to use and modify!

## 🤝 Contributing

This is a personal project, but suggestions are welcome! Open an issue or reach out.

---

**Built with ❤️ and nostalgia**
