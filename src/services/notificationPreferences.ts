import { supabase } from '../config/supabase';

export interface NotificationPreferences {
  notif_daily_rewind: boolean;
  notif_new_message: boolean;
  notif_message_reminder: boolean;
  notif_photo_liked: boolean;
  notif_photo_commented: boolean;
  notif_new_follower: boolean;
  notif_friend_posted: boolean;
  push_token?: string | null;
  preferred_post_hour?: number | null;
}

/**
 * Get user's notification preferences
 */
export async function getNotificationPreferences(userId: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('notif_daily_rewind, notif_new_message, notif_message_reminder, notif_photo_liked, notif_photo_commented, notif_new_follower, notif_friend_posted, push_token, preferred_post_hour')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return { preferences: data as NotificationPreferences, error: null };
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    return { preferences: null, error };
  }
}

/**
 * Update user's notification preferences
 */
export async function updateNotificationPreferences(
  userId: string,
  preferences: Partial<NotificationPreferences>
) {
  try {
    const { error } = await supabase
      .from('users')
      .update(preferences)
      .eq('id', userId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return { error };
  }
}

/**
 * Save push notification token
 */
export async function savePushToken(userId: string, token: string) {
  try {
    const { error } = await supabase
      .from('users')
      .update({ push_token: token })
      .eq('id', userId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error saving push token:', error);
    return { error };
  }
}

/**
 * Save user's preferred posting hour (for smart notifications)
 */
export async function savePreferredPostHour(userId: string, hour: number) {
  try {
    const { error } = await supabase
      .from('users')
      .update({ preferred_post_hour: hour })
      .eq('id', userId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error saving preferred post hour:', error);
    return { error };
  }
}

/**
 * Check if user wants to receive a specific notification type
 */
export async function shouldSendNotification(
  userId: string,
  notificationType: keyof NotificationPreferences
): Promise<boolean> {
  const { preferences } = await getNotificationPreferences(userId);
  if (!preferences) return false;
  return preferences[notificationType] === true;
}
