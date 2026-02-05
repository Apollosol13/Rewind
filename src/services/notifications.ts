import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '../config/supabase';

// Configure how notifications should be displayed
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, // Keep for backwards compatibility
    shouldShowBanner: true, // New API for iOS 14+
    shouldShowList: true, // Show in notification list
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions() {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return { granted: false, error: 'Permission not granted' };
    }

    // For iOS, also request provisional permissions
    if (Platform.OS === 'ios') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return { granted: true, error: null };
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return { granted: false, error };
  }
}

/**
 * Register device push token for current user
 */
export async function registerPushToken(userId: string) {
  try {
    // For Expo Go, use experienceId from the slug
    // For standalone builds, projectId would be from app.json
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: 'a08f49c7-53f3-450d-a487-797c2c32f224',
    });

    console.log('📱 Got push token:', token.data);

    // Save to database
    const { error } = await supabase
      .from('users')
      .update({ push_token: token.data })
      .eq('id', userId);

    if (error) throw error;

    console.log('✅ Push token registered for user:', userId);
    return { token: token.data, error: null };
  } catch (error) {
    console.error('Error registering push token:', error);
    console.log('💡 Push notifications require a standalone build (TestFlight/Production)');
    console.log('   Local notifications will still work in development builds');
    return { token: null, error };
  }
}

/**
 * Send push notification to a specific user
 */
export async function sendPushNotificationToUser(
  userId: string,
  title: string,
  body: string,
  data?: any
) {
  try {
    // Get user's push token from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('push_token')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    if (!userData?.push_token) {
      console.log('⚠️ User has no push token registered:', userId);
      console.log('💡 Skipping notification - user needs to login on a production build');
      return { error: 'No push token' };
    }

    // Send push notification via Expo's push service
    const message = {
      to: userData.push_token,
      sound: 'default',
      title,
      body,
      data,
      priority: 'high',
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    console.log('📤 Push notification sent:', result);

    return { error: null };
  } catch (error) {
    console.error('Error sending push notification:', error);
    return { error };
  }
}

/**
 * Schedule daily random notification (BeReal style)
 */
export async function scheduleDailyNotification() {
  try {
    // Cancel any existing notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Generate random time between 9 AM and 11 PM
    const randomHour = Math.floor(Math.random() * 14) + 9; // 9-23
    const randomMinute = Math.floor(Math.random() * 60); // 0-59

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '⚡️ Time to Rewind!',
        body: 'Capture this moment - you have 2 minutes! ⏱️',
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { type: 'daily_prompt' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: randomHour,
        minute: randomMinute,
        repeats: true,
      },
    });

    console.log(`📅 Daily notification scheduled at ${randomHour}:${randomMinute}`);
    return { notificationId, error: null };
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return { notificationId: null, error };
  }
}

/**
 * Send immediate test notification
 */
export async function sendTestNotification() {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📸 Test Notification',
        body: 'Notifications are working!',
        sound: true,
      },
      trigger: { seconds: 2 },
    });
    return { error: null };
  } catch (error) {
    console.error('Error sending test notification:', error);
    return { error };
  }
}

/**
 * Get all scheduled notifications
 */
export async function getScheduledNotifications() {
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    return { notifications, error: null };
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return { notifications: [], error };
  }
}

/**
 * Schedule smart daily notification based on user's posting habits
 */
export async function scheduleSmartDailyNotification(preferredHour?: number) {
  try {
    // Cancel any existing daily notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    let hour: number;
    let minute: number;

    if (preferredHour !== undefined && preferredHour !== null) {
      // Use user's preferred time (±15 minutes for variety)
      hour = preferredHour;
      minute = Math.floor(Math.random() * 30) - 15; // -15 to +15 minutes
      if (minute < 0) {
        minute += 60;
        hour = hour > 0 ? hour - 1 : 23;
      }
      if (minute >= 60) {
        minute -= 60;
        hour = hour < 23 ? hour + 1 : 0;
      }
    } else {
      // No history yet, use random time between 9 AM and 11 PM
      hour = Math.floor(Math.random() * 14) + 9; // 9-23
      minute = Math.floor(Math.random() * 60); // 0-59
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '⚡️ Time to Rewind!',
        body: 'Capture this moment and share your day! 📸',
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { type: 'daily_rewind' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        repeats: true,
      },
    });

    console.log(`📅 Smart daily notification scheduled at ${hour}:${String(minute).padStart(2, '0')}`);
    return { notificationId, error: null };
  } catch (error) {
    console.error('Error scheduling smart notification:', error);
    return { notificationId: null, error };
  }
}

/**
 * Send notification for new message (Push notification to recipient)
 */
export async function sendNewMessageNotification(recipientUserId: string, senderUsername: string, messageId?: string) {
  try {
    await sendPushNotificationToUser(
      recipientUserId,
      '📬 New Sticky Note!',
      `@${senderUsername} sent you a sticky note message`,
      { type: 'new_message', messageId }
    );
    return { error: null };
  } catch (error) {
    console.error('Error sending new message notification:', error);
    return { error };
  }
}

/**
 * Send notification reminder to message friends
 */
export async function sendMessageReminderNotification() {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💌 Stay Connected!',
        body: "Send a sticky note to a friend - it's been a while!",
        sound: true,
        data: { type: 'message_reminder' },
      },
      trigger: null, // Show immediately
    });
    return { error: null };
  } catch (error) {
    console.error('Error sending message reminder notification:', error);
    return { error };
  }
}

/**
 * Send notification for photo liked (Push notification to photo owner)
 */
export async function sendPhotoLikedNotification(photoOwnerId: string, likerUsername: string, photoId?: string) {
  try {
    await sendPushNotificationToUser(
      photoOwnerId,
      '❤️ New Like!',
      `@${likerUsername} liked your Rewind`,
      { type: 'photo_liked', photoId }
    );
    return { error: null };
  } catch (error) {
    console.error('Error sending photo liked notification:', error);
    return { error };
  }
}

/**
 * Send notification for photo commented (Push notification to photo owner)
 */
export async function sendPhotoCommentedNotification(
  photoOwnerId: string,
  commenterUsername: string,
  commentText: string,
  photoId?: string
) {
  try {
    const truncatedComment = commentText.length > 50 
      ? commentText.substring(0, 50) + '...' 
      : commentText;
    
    await sendPushNotificationToUser(
      photoOwnerId,
      '💬 New Comment!',
      `@${commenterUsername}: ${truncatedComment}`,
      { type: 'photo_commented', photoId }
    );
    return { error: null };
  } catch (error) {
    console.error('Error sending photo commented notification:', error);
    return { error };
  }
}

/**
 * Send notification for new follower (Push notification to followed user)
 */
export async function sendNewFollowerNotification(followedUserId: string, followerUsername: string, followerId?: string) {
  try {
    await sendPushNotificationToUser(
      followedUserId,
      '👋 New Follower!',
      `@${followerUsername} started following you`,
      { type: 'new_follower', followerId }
    );
    return { error: null };
  } catch (error) {
    console.error('Error sending new follower notification:', error);
    return { error };
  }
}

/**
 * Send notification when a friend posts (Push notification to followers)
 */
export async function sendFriendPostedNotification(
  followerId: string,
  posterUsername: string,
  photoId: string
) {
  try {
    await sendPushNotificationToUser(
      followerId,
      '📸 Friend Posted!',
      `@${posterUsername} just posted a new Rewind`,
      { type: 'friend_posted', photoId }
    );
    return { error: null };
  } catch (error) {
    console.error('Error sending friend posted notification:', error);
    return { error };
  }
}

/**
 * Schedule exact 24-hour notification (BeReal style timer system)
 * Timer starts when notification is sent, user has 3:30 to post
 */
export async function scheduleExact24HourNotification(userId: string, postTime: Date) {
  try {
    // Cancel any existing notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Calculate exact 24 hours from post time
    const tomorrow = new Date(postTime);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const hour = tomorrow.getHours();
    const minute = tomorrow.getMinutes();

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '⚡️ Time to Rewind!',
        body: 'You have 3 minutes and 30 seconds! ⏱️',
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { 
          type: 'daily_rewind',
          deadline: new Date(tomorrow.getTime() + 210000).toISOString(), // +3:30 (210 seconds)
          sentAt: tomorrow.toISOString(),
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        repeats: true,
      },
    });

    // Save notification time to database
    await supabase
      .from('users')
      .update({ 
        last_post_time: postTime.toISOString(),
        notification_time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`,
      })
      .eq('id', userId);

    console.log(`⏰ 24-hour notification scheduled for ${hour}:${String(minute).padStart(2, '0')} daily`);
    return { notificationId, hour, minute, error: null };
  } catch (error) {
    console.error('Error scheduling 24-hour notification:', error);
    return { notificationId: null, hour: null, minute: null, error };
  }
}

/**
 * Calculate if current time is within deadline (for timer display)
 */
export function getTimerInfo(notificationData: any): { timeRemaining: number | null; isLate: boolean } {
  if (!notificationData?.deadline) {
    return { timeRemaining: null, isLate: false };
  }

  const deadline = new Date(notificationData.deadline);
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();

  if (diff > 0) {
    // Still within timer
    return { timeRemaining: Math.floor(diff / 1000), isLate: false };
  } else {
    // Past deadline
    return { timeRemaining: 0, isLate: true };
  }
}

/**
 * Schedule multiple random "Time to Rewind!" notifications per day (BeReal style)
 * @param count - Number of notifications per day (default: 3)
 */
export async function scheduleRandomDailyNotifications(count: number = 3) {
  try {
    console.log(`📱 Scheduling ${count} random notifications for today...`);
    
    // Cancel all existing scheduled notifications
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Define "active hours" for notifications (8 AM to 10 PM)
    const startHour = 8;
    const endHour = 22;
    const totalMinutes = (endHour - startHour) * 60;
    
    // Generate random times
    const randomTimes: Date[] = [];
    const usedMinutes = new Set<number>();
    
    for (let i = 0; i < count; i++) {
      let randomMinute;
      // Ensure times are at least 2 hours apart
      do {
        randomMinute = Math.floor(Math.random() * totalMinutes);
      } while (
        Array.from(usedMinutes).some(used => Math.abs(used - randomMinute) < 120)
      );
      
      usedMinutes.add(randomMinute);
      
      const notificationTime = new Date(today);
      notificationTime.setHours(startHour + Math.floor(randomMinute / 60));
      notificationTime.setMinutes(randomMinute % 60);
      notificationTime.setSeconds(0);
      
      // If time has already passed today, schedule for tomorrow
      if (notificationTime <= now) {
        notificationTime.setDate(notificationTime.getDate() + 1);
      }
      
      randomTimes.push(notificationTime);
    }
    
    // Sort times chronologically
    randomTimes.sort((a, b) => a.getTime() - b.getTime());
    
    // Schedule each notification
    for (const time of randomTimes) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ Time to Rewind!',
          body: 'Capture your moment and share it with friends! 📸',
          sound: true,
          data: {
            type: 'daily_rewind',
            scheduledFor: time.toISOString(),
          },
        },
        trigger: {
          date: time,
        },
      });
      
      console.log(`✅ Scheduled notification for ${time.toLocaleString()}`);
    }
    
    console.log(`✅ Successfully scheduled ${count} notifications`);
    return { success: true, times: randomTimes };
  } catch (error) {
    console.error('❌ Error scheduling random notifications:', error);
    return { success: false, error };
  }
}
