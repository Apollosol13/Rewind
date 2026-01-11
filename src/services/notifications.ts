import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications should be displayed
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
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
 * Schedule daily random notification (BeReal style)
 */
export async function scheduleDailyNotification() {
  try {
    // Cancel any existing notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Generate random time between 9 AM and 11 PM
    const randomHour = Math.floor(Math.random() * 14) + 9; // 9-23
    const randomMinute = Math.floor(Math.random() * 60); // 0-59

    const trigger = {
      hour: randomHour,
      minute: randomMinute,
      repeats: true,
    };

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '⚡️ Time to Rewind!',
        body: 'Capture this moment - you have 2 minutes! ⏱️',
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { type: 'daily_prompt' },
      },
      trigger,
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
