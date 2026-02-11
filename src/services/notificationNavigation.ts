import { router } from 'expo-router';

/**
 * Handle navigation from notification tap
 */
export function handleNotificationNavigation(notificationData: any) {
  console.log('🔔 Handling notification navigation:', notificationData);
  
  const { type, photoId, messageId, followerId } = notificationData;

  // Small delay to ensure app is ready for navigation
  setTimeout(() => {
    switch (type) {
      case 'photo_liked':
      case 'photo_commented':
      case 'friend_posted':
        if (photoId) {
          // Navigate to feed with photo ID in params
          // The feed will need to handle opening the specific photo
          router.push({
            pathname: '/(tabs)',
            params: { openPhotoId: photoId }
          });
        } else {
          // No photo ID, just go to feed
          router.push('/(tabs)');
        }
        break;
      
      case 'new_message':
        if (messageId) {
          // Navigate to messages tab with message ID to open conversation
          router.push({
            pathname: '/(tabs)/messages',
            params: { openMessageId: messageId }
          });
        } else {
          // No message ID, just go to messages tab
          router.push('/(tabs)/messages');
        }
        break;
      
      case 'new_follower':
        if (followerId) {
          // Navigate to follower's profile
          router.push(`/user/${followerId}`);
        } else {
          // No follower ID, go to own profile to see followers
          router.push('/(tabs)/profile');
        }
        break;
      
      case 'daily_rewind':
        // Navigate to camera
        router.push('/camera');
        break;
      
      case 'message_reminder':
        // Navigate to messages
        router.push('/(tabs)/messages');
        break;
      
      default:
        // Unknown type, navigate to feed
        console.log('⚠️ Unknown notification type:', type);
        router.push('/(tabs)');
    }
  }, 100);
}
