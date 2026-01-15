import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getFollowers, getFollowing } from '../services/follows';
import { markFollowersAsViewed } from '../services/followerBadge';
import { getCurrentUser } from '../services/auth';
import { IconSymbol } from '../../components/ui/icon-symbol';
import HandwrittenText from '../components/HandwrittenText';

type TabType = 'followers' | 'following';

interface FollowUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

export default function FollowListScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const userId = params.userId as string;
  const initialTab = (params.tab as TabType) || 'followers';

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [userId]);

  useEffect(() => {
    // Mark followers as viewed when user views the followers tab
    if (activeTab === 'followers') {
      markAsViewed();
    }
  }, [activeTab]);

  async function markAsViewed() {
    try {
      const { user } = await getCurrentUser();
      if (user && user.id === userId) {
        // Only mark as viewed if viewing own followers
        await markFollowersAsViewed(userId);
      }
    } catch (error) {
      console.error('Error marking followers as viewed:', error);
    }
  }

  async function loadData() {
    setLoading(true);
    try {
      // Load both lists
      const [followersResult, followingResult] = await Promise.all([
        getFollowers(userId),
        getFollowing(userId),
      ]);

      if (followersResult.followers) {
        setFollowers(
          followersResult.followers.map((f: any) => ({
            id: f.follower.id,
            username: f.follower.username,
            display_name: f.follower.display_name,
            avatar_url: f.follower.avatar_url,
          }))
        );
      }

      if (followingResult.following) {
        setFollowing(
          followingResult.following.map((f: any) => ({
            id: f.following.id,
            username: f.following.username,
            display_name: f.following.display_name,
            avatar_url: f.following.avatar_url,
          }))
        );
      }
    } catch (error) {
      console.error('Error loading follow data:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleUserPress(userId: string) {
    router.push(`/user/${userId}`);
  }

  function renderUser({ item }: { item: FollowUser }) {
    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => handleUserPress(item.id)}
      >
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <IconSymbol name="person.circle.fill" size={50} color="#ccc" />
          </View>
        )}
        <View style={styles.userInfo}>
          <Text style={styles.displayName}>{item.display_name}</Text>
          <Text style={styles.username}>@{item.username}</Text>
        </View>
        <IconSymbol name="chevron.right" size={20} color="#999" />
      </TouchableOpacity>
    );
  }

  const currentList = activeTab === 'followers' ? followers : following;

  return (
    <SafeAreaView style={styles.container}>
      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'followers' && styles.activeTab]}
          onPress={() => setActiveTab('followers')}
        >
          <HandwrittenText
            style={[
              styles.tabText,
              activeTab === 'followers' && styles.activeTabText,
            ]}
          >
            Followers
          </HandwrittenText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'following' && styles.activeTab]}
          onPress={() => setActiveTab('following')}
        >
          <HandwrittenText
            style={[
              styles.tabText,
              activeTab === 'following' && styles.activeTabText,
            ]}
          >
            Following
          </HandwrittenText>
        </TouchableOpacity>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF4444" />
        </View>
      ) : currentList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconSymbol
            name={activeTab === 'followers' ? 'person.2' : 'person.2.fill'}
            size={60}
            color="#ccc"
          />
          <Text style={styles.emptyText}>
            {activeTab === 'followers'
              ? 'No followers yet'
              : 'Not following anyone yet'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={currentList}
          renderItem={renderUser}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F1E8',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FAF9F6',
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#FF4444',
  },
  tabText: {
    fontSize: 20,
    color: '#999',
  },
  activeTabText: {
    color: '#FF4444',
  },
  listContent: {
    padding: 16,
    paddingTop: 20,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFEF9',
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E8E3D5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: '#FF4444',
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F1E8',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  userInfo: {
    flex: 1,
    marginLeft: 14,
  },
  displayName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2C2C2E',
    marginBottom: 3,
  },
  username: {
    fontSize: 15,
    color: '#8E8E93',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F1E8',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    backgroundColor: '#F5F1E8',
  },
  emptyText: {
    marginTop: 20,
    fontSize: 17,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
