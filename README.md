# 📸 Rewind

<div align="center">

**A nostalgic Polaroid-style BeReal clone**

*Capture authentic moments with vintage charm*

[Setup Guide](SETUP.md) • [Features](#features) • [Tech Stack](#tech-stack)

</div>

---

## ✨ What is Rewind?

Rewind combines the spontaneity of BeReal with the nostalgic aesthetic of Polaroid cameras. Get a random notification each day to capture whatever you're doing in that moment - but with a beautiful vintage twist.

### Key Features

- 📸 **Polaroid Camera UI** - Authentic camera interface with rainbow stripe
- 🖋️ **Handwritten Captions** - Add notes in beautiful handwritten font
- 📅 **Date Stamps** - Every photo automatically dated like real Polaroids
- 🎨 **Vintage Aesthetic** - Cream backgrounds and warm colors
- ⚡ **Daily Prompts** - Random notification to capture the moment
- 👥 **Social Feed** - Share and view friends' Rewinds
- ❤️ **Likes & Comments** - Engage with others' memories
- 🔐 **Secure Backend** - Powered by Supabase

## 🚀 Quick Start

```bash
# 1. Clone and navigate
cd Rewind

# 2. Install dependencies (already done!)
npm install

# 3. Set up Supabase (see SETUP.md)
# - Create project at supabase.com
# - Run supabase-schema.sql
# - Create storage bucket

# 4. Configure environment
cp .env.example .env
# Add your Supabase URL and key

# 5. Start the app
npm start
```

**Full setup instructions:** [SETUP.md](SETUP.md)

## 📱 Screenshots

<div align="center">

| Camera | Feed | Profile |
|--------|------|---------|
| Polaroid-style camera with rainbow stripe | Social feed with Polaroid cards | User profile and settings |

</div>

## 🎨 Features

### 📸 Camera Experience
- **Polaroid-inspired UI** with authentic rainbow stripe
- **Red shutter button** mimicking classic Polaroid cameras
- **Instant preview** with caption input
- **Cream-colored frame** for that vintage feel

### 🖼️ Photo Styling
- **Polaroid frames** with white borders
- **Date stamps** in typewriter font
- **Handwritten captions** using Caveat font
- **Square format** like classic instant photos

### 🌐 Social Features
- **Feed view** showing friends' Rewinds
- **Like photos** with heart reactions
- **Comment system** for engagement
- **User profiles** with photo grids

### 🔔 Notifications
- **Daily random prompts** (BeReal-style)
- **Customizable timing** (9 AM - 11 PM)
- **Push notifications** to capture moments

## 🛠️ Tech Stack

### Frontend
- **React Native** - Cross-platform mobile framework
- **Expo** - Development and build platform
- **TypeScript** - Type-safe code
- **Expo Router** - File-based navigation
- **Expo Camera** - Camera functionality

### Backend
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication
  - Storage for images
  - Real-time subscriptions
  - Row Level Security

### Design
- **Caveat Font** - Handwritten captions
- **Custom Components** - Polaroid frames, camera UI
- **Haptic Feedback** - Enhanced user experience

## 📁 Project Structure

```
Rewind/
├── app/                      # Expo Router pages
│   ├── (tabs)/              # Tab navigation
│   │   ├── index.tsx       # Feed screen
│   │   └── profile.tsx     # Profile screen
│   ├── _layout.tsx         # Root layout
│   ├── auth.tsx            # Authentication
│   └── camera.tsx          # Camera modal
│
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── CameraButton.tsx
│   │   ├── HandwrittenText.tsx
│   │   ├── PhotoCard.tsx
│   │   └── PolaroidFrame.tsx
│   │
│   ├── config/
│   │   └── supabase.ts    # Supabase client
│   │
│   ├── screens/           # Main screens
│   │   ├── AuthScreen.tsx
│   │   ├── CameraScreen.tsx
│   │   ├── FeedScreen.tsx
│   │   └── ProfileScreen.tsx
│   │
│   ├── services/          # API services
│   │   ├── auth.ts
│   │   ├── notifications.ts
│   │   └── photos.ts
│   │
│   └── utils/             # Helper functions
│       ├── base64.ts
│       ├── dateFormatter.ts
│       └── polaroidFilter.ts
│
├── supabase-schema.sql    # Database schema
├── SETUP.md              # Detailed setup guide
└── package.json          # Dependencies
```

## 🎯 Roadmap

### Phase 1: Core Features ✅
- [x] Polaroid camera UI
- [x] Photo capture and upload
- [x] Social feed
- [x] Authentication
- [x] Likes and comments
- [x] Notification setup

### Phase 2: Enhanced Experience
- [ ] Dual camera (front + back simultaneously)
- [ ] 2-minute timer after notification
- [ ] Shake to develop photo animation
- [ ] Camera shutter sound effects
- [ ] Friends system

### Phase 3: Social Features
- [ ] Follow/unfollow users
- [ ] Friends-only feed
- [ ] Discovery feed
- [ ] Photo reactions (beyond likes)
- [ ] Share to other platforms

### Phase 4: Polish
- [ ] Onboarding flow
- [ ] Photo album scrapbook view
- [ ] Offline mode
- [ ] Performance optimizations
- [ ] Analytics

## 🐛 Known Issues

- Camera permissions must be granted manually on first launch
- Images are uploaded at full quality (compression coming soon)
- Push notifications require additional setup for production
- Web version has limited camera support

## 🤝 Contributing

This is a personal project, but feedback and suggestions are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 Environment Variables

Required in `.env`:

```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🧪 Testing

```bash
# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run in web browser (limited features)
npm run web

# Start development server
npm start
```

## 📄 License

MIT License - feel free to use this project for learning or personal use.

## 🙏 Acknowledgments

- Inspired by **BeReal** for the spontaneous capture concept
- **Polaroid** for the iconic instant camera aesthetic
- **Supabase** for the amazing backend platform
- **Expo** for simplifying React Native development

## 💬 Contact

Questions or feedback? Open an issue or reach out!

---

<div align="center">

**Built with ❤️ and nostalgia**

*Capture moments. Create memories. Rewind time.*

</div>
