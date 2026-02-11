# Timer System (BeReal-Style)

## Overview
Rewind now features a BeReal-style timer system for daily posts:
- **First post sets the schedule**: Users post whenever they want the first time, which sets their daily notification time
- **24-hour cycle**: Every 24 hours, users get notified at the exact time they originally posted
- **3:30 countdown**: Users have 3 minutes and 30 seconds to post after notification
- **Late badge**: Posts after the timer show a "LATE" badge on the timeline

## Database Schema

### Users Table
```sql
-- Daily notification timing
notification_time TIME DEFAULT NULL          -- Time of day for notifications (e.g. "14:47:00")
last_post_time TIMESTAMP WITH TIME ZONE      -- When user last posted (for 24h cycle)
```

### Photos Table
```sql
-- Timer tracking
posted_on_time BOOLEAN DEFAULT true          -- Whether posted within 3:30 timer
minutes_late INTEGER DEFAULT 0               -- How many minutes late (0 if on time)
```

## User Flow

### First-Time User
1. Opens app, no timer active
2. Takes photo whenever they want (e.g. 2:47 PM)
3. Posts photo → Sets notification for 2:47 PM daily
4. Next day at 2:47 PM: Gets notification with 3:30 timer

### Existing User (After Update)
1. Has the app, no `notification_time` set (NULL in database)
2. Takes their next photo (first post after update)
3. Posts photo → Sets notification for exact time posted
4. 24 hours later: Gets notification at that time

### Daily Posting
1. At scheduled time (e.g. 2:47 PM): Notification sent
2. Camera screen shows countdown: "⏱️ 3:30"
3. User has until 2:50:30 PM to post
4. If within time: Photo marked `posted_on_time: true`
5. If after time: Photo marked `posted_on_time: false`, "LATE" badge shown

## Implementation Details

### Notification Storage
When a daily rewind notification is received, the deadline is stored in AsyncStorage:
```typescript
{
  type: 'daily_rewind',
  deadline: '2026-01-30T14:50:30.000Z', // +3:30 from notification time
  sentAt: '2026-01-30T14:47:00.000Z'
}
```

### Timer Calculation
```typescript
const timerInfo = getTimerInfo(notificationData);
// Returns: { timeRemaining: 210, isLate: false }
```

### Photo Upload
```typescript
// Track on-time vs late
const postedOnTime = !isLate;
const minutesLate = isLate ? Math.floor(timeDiff / 60000) : 0;

// Save to database
await supabase
  .from('photos')
  .update({ 
    posted_on_time: postedOnTime,
    minutes_late: minutesLate 
  })
  .eq('id', photoId);
```

### Notification Scheduling
```typescript
// Schedule exact 24-hour notification
await scheduleExact24HourNotification(userId, postTime);
// Notification will fire at exact same time tomorrow
```

## Migration Guide

### For Existing Users
No manual migration needed! The system checks:
```typescript
if (user.notification_time === null) {
  // First post after update → set schedule
  await scheduleExact24HourNotification(userId, now);
} else {
  // Already has schedule → continue as normal
}
```

### Database Migration
Run the SQL migration in Supabase:
```bash
# File: supabase-migration-timer-system.sql
psql < supabase-migration-timer-system.sql
```

This adds:
- `notification_time` to users table
- `posted_on_time` and `minutes_late` to photos table

## UI Components

### CameraScreen Timer Display
- **Active timer**: Red badge with countdown "⏱️ 3:30"
- **Late**: Orange badge "⚠️ LATE"
- **No timer**: Shows "REWND" branding

### PhotoCard Late Badge
- Orange "LATE" badge next to timestamp
- Only shown if `posted_on_time === false`

## Testing

### Test First Post
1. Fresh install or clear `notification_time`
2. Post a photo at any time
3. Check logs: Should see "⏰ Next notification scheduled for exactly 24 hours from now"
4. Check database: `notification_time` and `last_post_time` should be set

### Test Timer
1. Manually trigger notification (or wait 24 hours)
2. Open camera: Should see countdown timer
3. Wait for timer to expire: Should see "LATE" badge
4. Post photo: Should be marked as late

### Test Late Badge
1. Post a photo while timer shows "LATE"
2. View feed: Photo should have orange "LATE" badge
3. Check database: `posted_on_time: false`, `minutes_late > 0`

## Key Functions

### `scheduleExact24HourNotification(userId, postTime)`
- Cancels existing notifications
- Schedules daily notification at exact time
- Updates database with `notification_time` and `last_post_time`

### `getTimerInfo(notificationData)`
- Returns `{ timeRemaining, isLate }`
- Used to display countdown and determine late status

### `checkTimerStatus()`
- Reads notification data from AsyncStorage
- Updates CameraScreen timer state
- Called on mount

## Notes

- Timer data is stored locally in AsyncStorage for immediate access
- Database stores notification schedule for server-side push notifications
- First post sets the user's personal daily schedule
- No "random time" notifications—users control when they want to be reminded
- Seamless migration: existing users start their 24h cycle on next post
