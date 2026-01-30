import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { IconSymbol } from '../../components/ui/icon-symbol';
import HandwrittenText from '../components/HandwrittenText';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  NotificationPreferences,
} from '../services/notificationPreferences';
import { getCurrentUser } from '../services/auth';
import {
  requestNotificationPermissions,
  scheduleSmartDailyNotification,
} from '../services/notifications';

interface NotificationSetting {
  key: keyof NotificationPreferences;
  title: string;
  description: string;
  icon: string;
}

const notificationSettings: NotificationSetting[] = [
  {
    key: 'notif_daily_rewind',
    title: 'Daily Rewind Reminder',
    description: 'Get reminded to capture your daily moment',
    icon: 'camera.fill',
  },
  {
    key: 'notif_new_message',
    title: 'New Messages',
    description: 'When someone sends you a sticky note',
    icon: 'envelope.fill',
  },
  {
    key: 'notif_message_reminder',
    title: 'Message Your Friends',
    description: 'Reminder to stay connected with friends',
    icon: 'heart.text.square.fill',
  },
  {
    key: 'notif_photo_liked',
    title: 'Likes',
    description: 'When someone likes your Rewind',
    icon: 'heart.fill',
  },
  {
    key: 'notif_photo_commented',
    title: 'Comments',
    description: 'When someone comments on your Rewind',
    icon: 'bubble.left.fill',
  },
  {
    key: 'notif_new_follower',
    title: 'New Followers',
    description: 'When someone starts following you',
    icon: 'person.fill.badge.plus',
  },
  {
    key: 'notif_friend_posted',
    title: 'Friend Posted',
    description: 'When someone you follow posts a Rewind',
    icon: 'photo.on.rectangle.angled',
  },
];

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    loadPreferences();
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const { granted } = await requestNotificationPermissions();
    setPermissionGranted(granted);
  };

  const loadPreferences = async () => {
    setLoading(true);
    const { user } = await getCurrentUser();
    if (user) {
      const { preferences: prefs } = await getNotificationPreferences(user.id);
      if (prefs) {
        setPreferences(prefs);
      }
    }
    setLoading(false);
  };

  const handleToggle = async (key: keyof NotificationPreferences) => {
    if (!preferences) return;

    const { user } = await getCurrentUser();
    if (!user) return;

    // Optimistically update UI
    const newPreferences = {
      ...preferences,
      [key]: !preferences[key],
    };
    setPreferences(newPreferences);

    // Save to database
    setSaving(true);
    const { error } = await updateNotificationPreferences(user.id, {
      [key]: !preferences[key],
    });

    if (error) {
      // Revert on error
      setPreferences(preferences);
      Alert.alert('Error', 'Failed to update notification settings');
    } else {
      // If daily rewind was enabled, reschedule notification
      if (key === 'notif_daily_rewind' && !preferences[key]) {
        await scheduleSmartDailyNotification(preferences.preferred_post_hour || undefined);
      }
    }

    setSaving(false);
  };

  const handleEnableAll = async () => {
    const { user } = await getCurrentUser();
    if (!user) return;

    setSaving(true);
    const allEnabled: Partial<NotificationPreferences> = {
      notif_daily_rewind: true,
      notif_new_message: true,
      notif_message_reminder: true,
      notif_photo_liked: true,
      notif_photo_commented: true,
      notif_new_follower: true,
      notif_friend_posted: true,
    };

    const { error } = await updateNotificationPreferences(user.id, allEnabled);
    if (!error) {
      setPreferences({ ...preferences, ...allEnabled } as NotificationPreferences);
      await scheduleSmartDailyNotification(preferences?.preferred_post_hour || undefined);
      Alert.alert('Success', 'All notifications enabled!');
    } else {
      Alert.alert('Error', 'Failed to enable notifications');
    }
    setSaving(false);
  };

  const handleDisableAll = async () => {
    Alert.alert(
      'Disable All Notifications?',
      "You won't receive any notifications from Rewind",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disable All',
          style: 'destructive',
          onPress: async () => {
            const { user } = await getCurrentUser();
            if (!user) return;

            setSaving(true);
            const allDisabled: Partial<NotificationPreferences> = {
              notif_daily_rewind: false,
              notif_new_message: false,
              notif_message_reminder: false,
              notif_photo_liked: false,
              notif_photo_commented: false,
              notif_new_follower: false,
              notif_friend_posted: false,
            };

            const { error } = await updateNotificationPreferences(user.id, allDisabled);
            if (!error) {
              setPreferences({ ...preferences, ...allDisabled } as NotificationPreferences);
            }
            setSaving(false);
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EF4249" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color="#333" />
        </TouchableOpacity>
        <HandwrittenText size={28} bold>
          Notifications
        </HandwrittenText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Permission Warning */}
        {!permissionGranted && (
          <View style={styles.warningCard}>
            <IconSymbol name="exclamationmark.triangle.fill" size={24} color="#FFA500" />
            <View style={styles.warningText}>
              <Text style={styles.warningTitle}>Notifications Disabled</Text>
              <Text style={styles.warningDescription}>
                Enable notifications in your device settings to receive alerts
              </Text>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={handleEnableAll}
            disabled={saving}
          >
            <IconSymbol name="checkmark.circle.fill" size={20} color="#4CAF50" />
            <Text style={[styles.quickActionText, { color: '#4CAF50' }]}>Enable All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={handleDisableAll}
            disabled={saving}
          >
            <IconSymbol name="xmark.circle.fill" size={20} color="#EF4249" />
            <Text style={[styles.quickActionText, { color: '#EF4249' }]}>Disable All</Text>
          </TouchableOpacity>
        </View>

        {/* Notification Settings */}
        <View style={styles.settingsSection}>
          {notificationSettings.map((setting) => (
            <View key={setting.key} style={styles.settingCard}>
              <View style={styles.settingLeft}>
                <View style={styles.iconContainer}>
                  <IconSymbol name={setting.icon} size={24} color="#EF4249" />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>{setting.title}</Text>
                  <Text style={styles.settingDescription}>{setting.description}</Text>
                </View>
              </View>
              <Switch
                value={preferences?.[setting.key] === true}
                onValueChange={() => handleToggle(setting.key)}
                trackColor={{ false: '#D1D1D1', true: '#FFABAB' }}
                thumbColor={preferences?.[setting.key] ? '#EF4249' : '#F4F4F4'}
                disabled={saving || !permissionGranted}
              />
            </View>
          ))}
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <IconSymbol name="info.circle.fill" size={20} color="#4D96FF" />
          <Text style={styles.infoText}>
            Daily Rewind reminders adapt to your posting habits. The more you use Rewind, the
            smarter your notifications become!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  backButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF9E6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    gap: 12,
  },
  warningText: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#B87503',
    marginBottom: 4,
  },
  warningDescription: {
    fontSize: 14,
    color: '#8B6203',
    lineHeight: 18,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  settingsSection: {
    gap: 12,
    marginBottom: 20,
  },
  settingCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 16,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FF',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1565C0',
    lineHeight: 18,
  },
});
