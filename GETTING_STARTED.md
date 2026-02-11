# 🎬 Getting Started with Rewind

Welcome! This guide will walk you through everything you need to know.

## 📚 Documentation Overview

We've created several guides for you:

1. **[QUICKSTART.md](QUICKSTART.md)** - Get running in 5 minutes ⚡
2. **[SETUP.md](SETUP.md)** - Detailed setup instructions 📖
3. **[CHECKLIST.md](CHECKLIST.md)** - Step-by-step checklist ✅
4. **[README.md](README.md)** - Project overview 📱
5. **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - What we built 🎯

## 🚀 Choose Your Path

### Path 1: Quick Test (5 minutes)
**Best for:** Just want to see it work

1. Read [QUICKSTART.md](QUICKSTART.md)
2. Set up Supabase (2 min)
3. Add credentials to `.env`
4. Run `npm start`
5. Test on your phone!

### Path 2: Full Setup (15 minutes)
**Best for:** Planning to develop further

1. Read [SETUP.md](SETUP.md)
2. Complete [CHECKLIST.md](CHECKLIST.md)
3. Test all features
4. Customize to your needs

### Path 3: Deep Dive (1 hour)
**Best for:** Want to understand everything

1. Read [README.md](README.md)
2. Review [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)
3. Explore the codebase
4. Read inline comments
5. Experiment with features

## 🎯 What You Need

### Required
- ✅ Mac or PC with Node.js 16+
- ✅ iPhone (for testing) or iOS Simulator
- ✅ Supabase account (free)
- ✅ 15 minutes of time

### Optional
- Expo account (free)
- Apple Developer account ($99/year for App Store)
- Code editor (VS Code recommended)

## 📱 Project Structure

```
Rewind/
├── 📱 app/                    # Navigation & screens
│   ├── (tabs)/               # Tab navigation
│   │   ├── index.tsx        # Feed screen
│   │   └── profile.tsx      # Profile screen
│   ├── auth.tsx             # Authentication
│   └── camera.tsx           # Camera modal
│
├── 🎨 src/
│   ├── components/          # UI components
│   │   ├── CameraButton.tsx
│   │   ├── HandwrittenText.tsx
│   │   ├── PhotoCard.tsx
│   │   └── PolaroidFrame.tsx
│   │
│   ├── screens/            # Main screens
│   │   ├── AuthScreen.tsx
│   │   ├── CameraScreen.tsx
│   │   ├── FeedScreen.tsx
│   │   └── ProfileScreen.tsx
│   │
│   ├── services/           # Backend API
│   │   ├── auth.ts
│   │   ├── notifications.ts
│   │   └── photos.ts
│   │
│   ├── config/            # Configuration
│   │   └── supabase.ts
│   │
│   └── utils/             # Helper functions
│       ├── base64.ts
│       ├── dateFormatter.ts
│       └── polaroidFilter.ts
│
├── 📄 Documentation
│   ├── README.md
│   ├── SETUP.md
│   ├── QUICKSTART.md
│   ├── CHECKLIST.md
│   ├── PROJECT_SUMMARY.md
│   └── GETTING_STARTED.md (you are here)
│
└── 🗄️ Database
    └── supabase-schema.sql
```

## 🎨 Key Features

### 📸 Camera
- Polaroid-style UI with rainbow stripe
- Red shutter button with haptic feedback
- Instant preview
- Caption input

### 🖼️ Photos
- Polaroid frames with white borders
- Date stamps in typewriter font
- Handwritten captions (Caveat font)
- Square format (1:1)

### 🌐 Social
- Feed with all Rewinds
- Like photos
- Comment on photos
- User profiles

### 🔔 Notifications
- Daily random reminders
- Customizable timing
- Push notification support

## 🛠️ Tech Stack

- **React Native** - Mobile framework
- **Expo** - Development platform
- **TypeScript** - Type safety
- **Supabase** - Backend (database, auth, storage)
- **Expo Router** - Navigation
- **Expo Camera** - Camera functionality

## 📖 Learning Resources

### React Native
- [React Native Docs](https://reactnative.dev)
- [Expo Docs](https://docs.expo.dev)

### Supabase
- [Supabase Docs](https://supabase.com/docs)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

### TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app)

## 🎓 Code Walkthrough

### How Authentication Works

```typescript
// 1. User signs up
signUp(email, password, username)
  → Creates auth user in Supabase
  → Trigger creates user profile
  → Returns user object

// 2. User signs in
signIn(email, password)
  → Validates credentials
  → Returns session token
  → Stores in Supabase client

// 3. Protected routes
getCurrentUser()
  → Checks session
  → Returns user or null
```

### How Photo Upload Works

```typescript
// 1. Capture photo
CameraView.takePictureAsync()
  → Returns local URI

// 2. Process image
createPolaroidImage(uri, caption, date)
  → Resizes to 1000x1000
  → Returns processed URI

// 3. Upload to storage
uploadPhoto(uri, caption, userId)
  → Reads file as base64
  → Uploads to Supabase Storage
  → Gets public URL
  → Saves metadata to database
```

### How Feed Works

```typescript
// 1. Fetch photos
getFeed(limit)
  → Queries photos table
  → Joins with users table
  → Orders by created_at DESC
  → Returns array of photos

// 2. Display in feed
<FlatList data={photos}>
  <PhotoCard photo={item} />
</FlatList>

// 3. Real-time updates (optional)
supabase
  .from('photos')
  .on('INSERT', payload => {
    // Add new photo to feed
  })
```

## 🐛 Common Issues

### "Module not found"
```bash
npm install
npx expo start -c
```

### "Camera not authorized"
- Go to Settings > Privacy > Camera
- Enable for Expo Go

### "Network request failed"
- Check `.env` file exists
- Verify Supabase credentials
- Check internet connection

### "Storage bucket not found"
- Create bucket in Supabase
- Name it exactly `rewind-photos`
- Set to Public

## 🎯 Next Steps

### Immediate
1. ✅ Complete setup
2. ✅ Test all features
3. ✅ Invite friends to test

### This Week
1. Customize UI colors
2. Add your own branding
3. Test on multiple devices
4. Gather feedback

### This Month
1. Add dual camera feature
2. Implement friends system
3. Optimize performance
4. Prepare for TestFlight

### Long Term
1. App Store submission
2. Marketing campaign
3. User acquisition
4. Feature expansion

## 💡 Pro Tips

1. **Use Expo Go for development** - Fastest iteration
2. **Test on real device** - Better than simulator
3. **Check Supabase logs** - Great for debugging
4. **Use TypeScript** - Catch errors early
5. **Read inline comments** - Lots of helpful notes

## 🤝 Getting Help

### Resources
- Check documentation files
- Read inline code comments
- Review Supabase dashboard
- Check Expo docs

### Debugging
1. Check console logs
2. Review Supabase logs
3. Verify environment variables
4. Test with simple cases first

## 🎉 You're Ready!

You now have everything you need to:
- ✅ Set up the app
- ✅ Test all features
- ✅ Understand the code
- ✅ Customize to your needs
- ✅ Deploy to production

**Start with [QUICKSTART.md](QUICKSTART.md) and you'll be running in 5 minutes!**

---

**Questions?** Check the other documentation files or review the code comments.

**Happy Rewinding! 📸**
