# 🏗️ Rewind - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         USER'S PHONE                         │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                     React Native App                    │ │
│  │                                                          │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │ │
│  │  │   Camera     │  │     Feed     │  │   Profile    │ │ │
│  │  │   Screen     │  │    Screen    │  │    Screen    │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │ │
│  │         │                  │                  │         │ │
│  │         └──────────────────┼──────────────────┘         │ │
│  │                            │                            │ │
│  │  ┌─────────────────────────▼──────────────────────────┐ │ │
│  │  │              Service Layer                         │ │ │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐    │ │ │
│  │  │  │   Auth   │  │  Photos  │  │Notifications │    │ │ │
│  │  │  │ Service  │  │ Service  │  │   Service    │    │ │ │
│  │  │  └──────────┘  └──────────┘  └──────────────┘    │ │ │
│  │  └────────────────────────┬───────────────────────────┘ │ │
│  │                            │                            │ │
│  │  ┌─────────────────────────▼──────────────────────────┐ │ │
│  │  │            Supabase Client                         │ │ │
│  │  └────────────────────────┬───────────────────────────┘ │ │
│  └───────────────────────────┼──────────────────────────────┘ │
└────────────────────────────────┼─────────────────────────────┘
                                 │
                                 │ HTTPS
                                 │
┌────────────────────────────────▼─────────────────────────────┐
│                        SUPABASE CLOUD                         │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  PostgreSQL  │  │   Storage    │  │     Auth     │     │
│  │   Database   │  │    Bucket    │  │   Service    │     │
│  │              │  │              │  │              │     │
│  │  • users     │  │ • photos/    │  │ • Sessions   │     │
│  │  • photos    │  │   (images)   │  │ • Users      │     │
│  │  • comments  │  │              │  │ • Tokens     │     │
│  │  • likes     │  │              │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Row Level Security (RLS)                    │  │
│  │  • Users can only modify their own data              │  │
│  │  • Public read access for photos                     │  │
│  │  • Authenticated write access                        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. User Authentication

```
User Input (Email/Password)
    │
    ▼
AuthScreen.tsx
    │
    ▼
auth.ts (signUp/signIn)
    │
    ▼
Supabase Auth Service
    │
    ├─► Create auth.users entry
    ├─► Trigger creates public.users profile
    └─► Return session token
    │
    ▼
Store session in Supabase client
    │
    ▼
Navigate to Feed
```

### 2. Photo Upload Flow

```
User taps Camera button
    │
    ▼
CameraScreen.tsx
    │
    ├─► Request camera permissions
    ├─► Display Polaroid UI
    └─► User takes photo
    │
    ▼
Photo captured (local URI)
    │
    ▼
User adds caption
    │
    ▼
polaroidFilter.ts
    │
    └─► Resize to 1000x1000
    │
    ▼
photos.ts (uploadPhoto)
    │
    ├─► Read file as base64
    ├─► Upload to Storage bucket
    ├─► Get public URL
    └─► Save metadata to database
    │
    ▼
Photo appears in Feed
```

### 3. Feed Display Flow

```
User opens Feed
    │
    ▼
FeedScreen.tsx
    │
    ▼
photos.ts (getFeed)
    │
    ├─► Query photos table
    ├─► Join with users table
    ├─► Count likes & comments
    └─► Order by created_at DESC
    │
    ▼
Return array of photos
    │
    ▼
Map to PhotoCard components
    │
    ▼
Display in FlatList
    │
    └─► Each photo shows:
        ├─► PolaroidFrame
        ├─► Username
        ├─► Caption
        ├─► Date
        ├─► Like count
        └─► Comment count
```

### 4. Like/Comment Flow

```
User taps Like button
    │
    ▼
photos.ts (likePhoto)
    │
    ├─► Insert into likes table
    │   (user_id, photo_id)
    └─► RLS checks auth
    │
    ▼
Like count updates
    │
    ▼
UI re-renders
```

## Component Hierarchy

```
App
├── AuthScreen
│   ├── TextInput (email)
│   ├── TextInput (password)
│   ├── TextInput (username)
│   └── Button (submit)
│
├── (tabs)
│   ├── FeedScreen
│   │   ├── FlatList
│   │   │   └── PhotoCard
│   │   │       ├── PolaroidFrame
│   │   │       │   ├── Image
│   │   │       │   ├── HandwrittenText (caption)
│   │   │       │   └── Text (date)
│   │   │       └── Interaction buttons
│   │   └── FloatingButton (camera)
│   │
│   └── ProfileScreen
│       ├── Header (username)
│       ├── Stats (photo count)
│       ├── Settings
│       └── Photo Grid
│
└── CameraScreen (modal)
    ├── CameraView
    ├── PolaroidFrame (overlay)
    ├── CameraButton
    └── Preview
        ├── PolaroidFrame
        ├── TextInput (caption)
        └── Action buttons
```

## Service Layer Architecture

### auth.ts
```typescript
signUp(email, password, username)
  → Creates user account
  → Returns user object

signIn(email, password)
  → Validates credentials
  → Returns session

signOut()
  → Clears session

getCurrentUser()
  → Returns current user or null

getUserProfile(userId)
  → Fetches user profile from database
```

### photos.ts
```typescript
uploadPhoto(uri, caption, userId)
  → Uploads image to storage
  → Saves metadata to database
  → Returns photo object

getFeed(limit)
  → Fetches recent photos
  → Includes user info
  → Includes counts
  → Returns array

getUserPhotos(userId)
  → Fetches user's photos
  → Returns array

likePhoto(photoId, userId)
  → Inserts like record

unlikePhoto(photoId, userId)
  → Deletes like record

addComment(photoId, userId, text)
  → Inserts comment

getComments(photoId)
  → Fetches comments with user info
```

### notifications.ts
```typescript
requestNotificationPermissions()
  → Asks for permission
  → Returns granted status

scheduleDailyNotification()
  → Schedules random daily time
  → Returns notification ID

sendTestNotification()
  → Sends immediate test
```

## Database Schema

```sql
┌─────────────────┐
│     users       │
├─────────────────┤
│ id (PK)         │◄──┐
│ username        │   │
│ display_name    │   │
│ avatar_url      │   │
│ created_at      │   │
└─────────────────┘   │
                      │
┌─────────────────┐   │
│     photos      │   │
├─────────────────┤   │
│ id (PK)         │   │
│ user_id (FK)    │───┘
│ image_url       │
│ caption         │
│ prompt_time     │
│ created_at      │
│ latitude        │
│ longitude       │
└─────────────────┘
        ▲
        │
        ├──────────────┐
        │              │
┌───────┴──────┐  ┌────┴──────┐
│   comments   │  │   likes   │
├──────────────┤  ├───────────┤
│ id (PK)      │  │ user_id   │
│ photo_id (FK)│  │ photo_id  │
│ user_id (FK) │  │ (PK)      │
│ text         │  └───────────┘
│ created_at   │
└──────────────┘
```

## Security Model

### Row Level Security (RLS)

```sql
-- Users Table
✓ Anyone can view profiles
✓ Users can update own profile only

-- Photos Table
✓ Anyone can view photos
✓ Users can insert own photos
✓ Users can update own photos
✓ Users can delete own photos

-- Comments Table
✓ Anyone can view comments
✓ Authenticated users can insert
✓ Users can delete own comments

-- Likes Table
✓ Anyone can view likes
✓ Authenticated users can insert
✓ Users can delete own likes
```

## State Management

### Current Approach: Local State
- Each screen manages its own state
- Services handle data fetching
- React hooks for state management

### Future: Could Add
- Redux for global state
- React Query for server state
- Context API for auth state

## File Organization

```
src/
├── components/          # Presentational components
│   ├── CameraButton     # UI only, receives props
│   ├── HandwrittenText  # Styled text component
│   ├── PhotoCard        # Displays photo data
│   └── PolaroidFrame    # Frame with styling
│
├── screens/            # Container components
│   ├── AuthScreen      # Handles auth logic
│   ├── CameraScreen    # Manages camera state
│   ├── FeedScreen      # Fetches and displays feed
│   └── ProfileScreen   # User profile logic
│
├── services/           # Business logic
│   ├── auth.ts         # Authentication operations
│   ├── photos.ts       # Photo CRUD operations
│   └── notifications.ts # Notification management
│
├── config/             # Configuration
│   └── supabase.ts     # Supabase client setup
│
└── utils/              # Pure functions
    ├── base64.ts       # Encoding utilities
    ├── dateFormatter.ts # Date formatting
    └── polaroidFilter.ts # Image processing
```

## Performance Considerations

### Image Optimization
- Photos resized to 1000x1000 before upload
- JPEG compression at 0.9 quality
- Future: Progressive loading, thumbnails

### Data Fetching
- Feed limited to 20 photos initially
- Pagination ready (not implemented)
- Future: Infinite scroll, caching

### Caching Strategy
- Supabase client handles auth caching
- Images cached by React Native
- Future: Implement offline mode

## Scalability

### Current Capacity
- Handles thousands of users
- Supabase free tier: 500MB database, 1GB storage
- Unlimited API requests

### To Scale Further
1. Implement CDN for images
2. Add database indexes (already done)
3. Implement pagination
4. Add caching layer
5. Optimize queries

## Security Best Practices

✅ **Implemented:**
- Environment variables for secrets
- Row Level Security on all tables
- Server-side authentication
- Secure image uploads
- Input validation

🔄 **Future Enhancements:**
- Rate limiting
- Content moderation
- Report/block features
- Two-factor authentication
- Email verification

---

This architecture provides a solid foundation for a production social media app with room to scale and add features!
