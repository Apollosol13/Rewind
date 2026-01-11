import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  Image,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import HandwrittenText from '../components/HandwrittenText';
import PolaroidFrame from '../components/PolaroidFrame';
import { getCurrentUser, getUserProfile, signOut } from '../services/auth';
import { getUserPhotos } from '../services/photos';
import { Photo, User } from '../config/supabase';
import {
  scheduleDailyNotification,
  requestNotificationPermissions,
} from '../services/notifications';

export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { user: authUser } = await getCurrentUser();
      if (!authUser) {
        router.replace('/auth');
        return;
      }

      const { profile } = await getUserProfile(authUser.id);
      if (profile) {
        setUser(profile);
      }

      const { photos: userPhotos } = await getUserPhotos(authUser.id);
      if (userPhotos) {
        setPhotos(userPhotos);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/auth');
        },
      },
    ]);
  };

  const enableNotifications = async () => {
    const { granted } = await requestNotificationPermissions();
    if (granted) {
      await scheduleDailyNotification();
      Alert.alert(
        'Notifications Enabled! 🔔',
        "You'll get a random daily reminder to capture your Rewind moment."
      );
    } else {
      Alert.alert(
        'Permission Denied',
        'Please enable notifications in your device settings.'
      );
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <HandwrittenText size={36} bold>
            @{user?.username || 'username'}
          </HandwrittenText>
          {user?.display_name && (
            <Text style={styles.displayName}>{user.display_name}</Text>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{photos.length}</Text>
            <Text style={styles.statLabel}>Rewinds</Text>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <TouchableOpacity
            style={styles.settingItem}
            onPress={enableNotifications}
          >
            <Text style={styles.settingIcon}>🔔</Text>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Enable Daily Notifications</Text>
              <Text style={styles.settingDescription}>
                Get reminded at a random time each day
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleSignOut}>
            <Text style={styles.settingIcon}>👋</Text>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Sign Out</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Photo Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Rewinds</Text>
          {photos.length > 0 ? (
            <View style={styles.photoGrid}>
              {photos.map((photo) => (
                <View key={photo.id} style={styles.gridItem}>
                  <Image
                    source={{ uri: photo.image_url }}
                    style={styles.gridImage}
                  />
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📸</Text>
              <Text style={styles.emptyText}>No Rewinds yet</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F0',
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
  },
  displayName: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FF4444',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  settingIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridItem: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'white',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
