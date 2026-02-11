import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getFollowers, getFollowing, followUser, unfollowUser, isFollowing } from '../services/follows';
import { getCurrentUser } from '../services/auth';
import { markFollowersAsViewed } from '../services/followerBadge';
import { supabase, User } from '../config/supabase';
import { IconSymbol } from '../../components/ui/icon-symbol';
import HandwrittenText from '../components/HandwrittenText';

type Tab = 'followers' | 'following';

export default function FollowListScreen() {
  const { userId, tab } = useLocalSearchParams<{ userId: string; tab?: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>((tab as Tab) || 'followers');
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [followStatus, setFollowStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (userId) {
      loadData();
    }
  }, [userId, activeTab, currentUserId]);

  const loadCurrentUser = async () => {
    const { user } = await getCurrentUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const loadData = async () => {
    setLoading(true);
    // Clear old follow status to prevent showing stale data
    setFollowStatus({});
    
    try {
      if (activeTab === 'followers') {
        const { followers: data } = await getFollowers(userId);
        // Extract the nested user objects
        const followerUsers = data.map((item: any) => item.follower).filter(Boolean);
        
        // Mark followers as viewed when viewing own followers
        if (currentUserId && userId === currentUserId) {
          await markFollowersAsViewed(currentUserId);
        }
        
        // Batch check follow status for all followers in ONE query
        const statuses: Record<string, boolean> = {};
        if (currentUserId && followerUsers.length > 0) {
          const userIds = followerUsers.map(u => u.id);
          const { data: followData } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', currentUserId)
            .in('following_id', userIds);
          
          // Create a set of IDs we're following
          const followingIds = new Set(followData?.map(f => f.following_id) || []);
          
          // Set status for all users at once
          followerUsers.forEach(user => {
            statuses[user.id] = followingIds.has(user.id);
          });
        }
        
        // Set all state at once to prevent UI flashing
        setFollowers(followerUsers);
        setFollowStatus(statuses);
      } else {
        const { following: data } = await getFollowing(userId);
        // Extract the nested user objects
        const followingUsers = data.map((item: any) => item.following).filter(Boolean);
        
        // Batch check follow status for all following in ONE query
        const statuses: Record<string, boolean> = {};
        if (currentUserId && followingUsers.length > 0) {
          const userIds = followingUsers.map(u => u.id);
          const { data: followData } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', currentUserId)
            .in('following_id', userIds);
          
          // Create a set of IDs we're following
          const followingIds = new Set(followData?.map(f => f.following_id) || []);
          
          // Set status for all users at once
          followingUsers.forEach(user => {
            statuses[user.id] = followingIds.has(user.id);
          });
        }
        
        // Set all state at once to prevent UI flashing
        setFollowing(followingUsers);
        setFollowStatus(statuses);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async (targetUserId: string) => {
    if (!currentUserId) return;
    
    const isCurrentlyFollowing = followStatus[targetUserId];
    
    if (isCurrentlyFollowing) {
      await unfollowUser(currentUserId, targetUserId);
      setFollowStatus(prev => ({ ...prev, [targetUserId]: false }));
    } else {
      await followUser(currentUserId, targetUserId);
      setFollowStatus(prev => ({ ...prev, [targetUserId]: true }));
    }
  };

  const users = activeTab === 'followers' ? followers : following;

  const renderUser = ({ item }: { item: User }) => {
    const isCurrentUser = item.id === currentUserId;
    const isFollowing = followStatus[item.id];
    const hasStatusLoaded = item.id in followStatus;

    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => router.push(`/user/${item.id}`)}
      >
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <IconSymbol name="person.circle.fill" size={50} color="#DDD" />
          </View>
        )}
        
        <View style={styles.userInfo}>
          <Text style={styles.username}>@{item.username}</Text>
          {item.display_name && (
            <Text style={styles.displayName}>{item.display_name}</Text>
          )}
        </View>

        {!isCurrentUser && hasStatusLoaded && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              handleFollowToggle(item.id);
            }}
            style={[
              styles.followButton,
              isFollowing && styles.followingButton
            ]}
          >
            <Text style={[
              styles.followButtonText,
              isFollowing && styles.followingButtonText
            ]}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'followers' && styles.activeTab]}
          onPress={() => setActiveTab('followers')}
        >
          <Text style={[styles.tabText, activeTab === 'followers' && styles.activeTabText]}>
            Followers
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'following' && styles.activeTab]}
          onPress={() => setActiveTab('following')}
        >
          <Text style={[styles.tabText, activeTab === 'following' && styles.activeTabText]}>
            Following
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EF4249" />
        </View>
      ) : (
        <FlatList
          data={users}
          renderItem={renderUser}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <IconSymbol 
                name={activeTab === 'followers' ? 'person.2.slash' : 'person.slash'} 
                size={60} 
                color="#CCC" 
              />
              <Text style={styles.emptyText}>
                {activeTab === 'followers' 
                  ? 'No followers yet' 
                  : 'Not following anyone yet'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#EF4249',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
  },
  activeTabText: {
    color: '#EF4249',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    marginVertical: 4,
    marginHorizontal: 8,
    borderRadius: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  displayName: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  followButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#EF4249',
  },
  followingButton: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  followingButtonText: {
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
});
