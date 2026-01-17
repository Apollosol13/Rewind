import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Platform,
  ActionSheetIOS,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getUserProfile } from '../services/auth';
import { getUserPhotos } from '../services/photos';
import { getFollowerCount, getFollowingCount, isFollowing, followUser, unfollowUser } from '../services/follows';
import { getNewFollowersCount } from '../services/followerBadge';
import { areMutualFollowers, sendStickyMessage, canSendMessageTo } from '../services/stickyMessages';
import { blockUser, unblockUser, isUserBlocked } from '../services/blocks';
import { reportUser, ReportReason, getReasonDisplayText } from '../services/reports';
import { User, Photo } from '../config/supabase';
import { IconSymbol } from '../../components/ui/icon-symbol';
import HandwrittenText from '../components/HandwrittenText';
import PolaroidFrame from '../components/PolaroidFrame';
import { getCurrentUser } from '../services/auth';

interface MonthlyPhotos {
  monthLabel: string;
  monthYear: string;
  photos: Photo[];
}

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [newFollowersCount, setNewFollowersCount] = useState(0);
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [isMutualFollowers, setIsMutualFollowers] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [messageColor, setMessageColor] = useState('yellow');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [monthlyPhotos, setMonthlyPhotos] = useState<MonthlyPhotos[]>([]);
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, [userId]);

  useEffect(() => {
    if (photos.length > 0) {
      organizePhotosByMonth();
    }
  }, [photos]);

  const loadUserProfile = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      
      // Get current user
      const { user: authUser } = await getCurrentUser();
      setCurrentUserId(authUser?.id || null);

      // Get user profile
      const { profile } = await getUserProfile(userId);
      if (profile) {
        setUser(profile);
      }

      // Get user photos
      const { photos: userPhotos } = await getUserPhotos(userId);
      if (userPhotos) {
        setPhotos(userPhotos);
      }

      // Get follow counts
      const { count: followers } = await getFollowerCount(userId);
      const { count: following } = await getFollowingCount(userId);
      const { count: newFollowers } = await getNewFollowersCount(userId);
      setFollowersCount(followers);
      setFollowingCount(following);
      setNewFollowersCount(newFollowers);

      // Check if current user is following this user
      if (authUser?.id) {
        const { isFollowing: following } = await isFollowing(authUser.id, userId);
        setIsFollowingUser(following);

        // Check if mutual followers
        const { areMutual } = await areMutualFollowers(authUser.id, userId);
        setIsMutualFollowers(areMutual);

        // Check if user is blocked
        const { isBlocked: blocked } = await isUserBlocked(authUser.id, userId);
        setIsBlocked(blocked);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const organizePhotosByMonth = () => {
    const grouped = photos.reduce((acc, photo) => {
      const date = new Date(photo.created_at);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      if (!acc[monthYear]) {
        acc[monthYear] = { monthLabel, monthYear, photos: [] };
      }
      acc[monthYear].photos.push(photo);
      return acc;
    }, {} as Record<string, MonthlyPhotos>);

    const sortedMonths = Object.values(grouped).sort((a, b) => 
      b.monthYear.localeCompare(a.monthYear)
    );

    setMonthlyPhotos(sortedMonths);
  };

  const handleFollowToggle = async () => {
    if (!currentUserId || !userId) return;

    setFollowLoading(true);
    
    if (isFollowingUser) {
      const { error } = await unfollowUser(currentUserId, userId);
      if (!error) {
        setIsFollowingUser(false);
        setFollowersCount(prev => prev - 1);
      } else {
        Alert.alert('Error', 'Failed to unfollow user');
      }
    } else {
      const { error } = await followUser(currentUserId, userId);
      if (!error) {
        setIsFollowingUser(true);
        setFollowersCount(prev => prev + 1);
      } else {
        Alert.alert('Error', 'Failed to follow user');
      }
    }
    
    setFollowLoading(false);
  };

  const handleBlockUser = async () => {
    if (!currentUserId || !userId) return;

    if (isBlocked) {
      // Unblock user
      Alert.alert(
        'Unblock User',
        `Unblock @${user?.username}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Unblock',
            onPress: async () => {
              const { error } = await unblockUser(currentUserId, userId);
              if (!error) {
                setIsBlocked(false);
                Alert.alert('Unblocked', `You have unblocked @${user?.username}`);
                loadUserProfile(); // Reload to update UI
              } else {
                Alert.alert('Error', 'Failed to unblock user');
              }
            },
          },
        ]
      );
    } else {
      // Block user
      Alert.alert(
        'Block User',
        `Block @${user?.username}? You won't see each other's content and you'll both be unfollowed.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Block',
            style: 'destructive',
            onPress: async () => {
              const { error } = await blockUser(currentUserId, userId);
              if (!error) {
                setIsBlocked(true);
                setIsFollowingUser(false);
                setIsMutualFollowers(false);
                Alert.alert('Blocked', `You have blocked @${user?.username}`);
                router.back(); // Go back to previous screen
              } else {
                Alert.alert('Error', 'Failed to block user');
              }
            },
          },
        ]
      );
    }
  };

  const handleReportUser = () => {
    if (!currentUserId || !userId) return;

    const reasons: ReportReason[] = [
      'spam',
      'harassment',
      'hate_speech',
      'violence',
      'nudity',
      'inappropriate',
      'impersonation',
      'other',
    ];

    Alert.alert(
      'Report User',
      `Why are you reporting @${user?.username}?`,
      [
        ...reasons.map(reason => ({
          text: getReasonDisplayText(reason),
          onPress: () => handleSubmitReport(reason),
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleSubmitReport = async (reason: ReportReason) => {
    if (!currentUserId || !userId) return;

    const { error } = await reportUser(currentUserId, userId, reason);
    if (!error) {
      Alert.alert(
        'Report Submitted',
        'Thank you for helping keep Rewind safe. We\'ll review this report.',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    }
  };

  const showProfileOptions = () => {
    if (Platform.OS === 'ios') {
      const options = isBlocked 
        ? ['Cancel', 'Unblock User']
        : ['Cancel', 'Block User', 'Report User'];
      
      const destructiveIndex = isBlocked ? -1 : 1;

      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 0,
          destructiveButtonIndex: destructiveIndex,
        },
        (buttonIndex) => {
          if (isBlocked) {
            if (buttonIndex === 1) handleBlockUser();
          } else {
            if (buttonIndex === 1) handleBlockUser();
            else if (buttonIndex === 2) handleReportUser();
          }
        }
      );
    } else {
      setShowProfileMenu(true);
    }
  };

  const handleSendStickyNote = async () => {
    if (!currentUserId || !userId || !messageText.trim()) return;

    setSendingMessage(true);
    const { message, error } = await sendStickyMessage(
      currentUserId,
      userId,
      messageText,
      messageColor
    );

    if (error) {
      if (error.code === 'RATE_LIMIT') {
        Alert.alert(
          '⏰ Slow Down!',
          error.message,
          [{ text: 'OK', style: 'default' }]
        );
      } else {
        Alert.alert('Error', 'Failed to send sticky note. Please try again.');
      }
      setSendingMessage(false);
      return;
    }

    Alert.alert('Sent!', `Your sticky note was sent to @${user?.username}`);
    setMessageText('');
    setShowComposeModal(false);
    setSendingMessage(false);
  };

  const handleOpenCompose = async () => {
    if (!currentUserId || !userId) return;

    // Check rate limit before opening modal
    const { canSend, minutesRemaining } = await canSendMessageTo(currentUserId, userId);
    if (!canSend) {
      Alert.alert(
        '⏰ Wait a bit!',
        `You can send another sticky note to @${user?.username} in ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}.`,
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    setShowComposeModal(true);
  };

  const goToPreviousMonth = () => {
    if (currentMonthIndex < monthlyPhotos.length - 1) {
      setCurrentMonthIndex(currentMonthIndex + 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonthIndex > 0) {
      setCurrentMonthIndex(currentMonthIndex - 1);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF5757" />
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.errorText}>User not found</Text>
      </SafeAreaView>
    );
  }

  const bulletinBoardHeight = Math.max(
    600,
    Math.ceil((monthlyPhotos[currentMonthIndex]?.photos.length || 0) / 2) * 260 + 80
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={28} color="#333" />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          {currentUserId && currentUserId !== userId && (
            <TouchableOpacity onPress={showProfileOptions} style={styles.menuButton}>
              <IconSymbol name="ellipsis.circle" size={28} color="#333" />
            </TouchableOpacity>
          )}
        </View>

        {/* Profile Header */}
        <View style={styles.profileHeader}>
          {user.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={styles.profilePicture} />
          ) : (
            <View style={styles.profilePicturePlaceholder}>
              <IconSymbol name="person.circle.fill" size={80} color="#DDD" />
            </View>
          )}
          
          <HandwrittenText size={36} bold style={{ paddingHorizontal: 10 }}>
            @{user.username}
          </HandwrittenText>
          
          {user.bio && (
            <Text style={styles.bio}>{user.bio}</Text>
          )}

          {/* Stats Row */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{photos.length}</Text>
              <Text style={styles.statLabel}>REWNDs</Text>
            </View>
            <View style={styles.statDivider} />
            <TouchableOpacity 
              style={styles.statItem}
              onPress={() => router.push(`/follow-list?userId=${userId}&tab=followers`)}
            >
              <View style={styles.statBadgeContainer}>
                <Text style={styles.statNumber}>{followersCount}</Text>
                {currentUserId === userId && newFollowersCount > 0 && (
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>+{newFollowersCount}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.statLabel}>Followers</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity 
              style={styles.statItem}
              onPress={() => router.push(`/follow-list?userId=${userId}&tab=following`)}
            >
              <Text style={styles.statNumber}>{followingCount}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          {currentUserId && currentUserId !== userId && !isBlocked && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.followButton, isFollowingUser && styles.followingButton]}
                onPress={handleFollowToggle}
                disabled={followLoading}
              >
                {followLoading ? (
                  <ActivityIndicator size="small" color={isFollowingUser ? "#666" : "#FFF"} />
                ) : (
                  <>
                    <IconSymbol 
                      name={isFollowingUser ? "person.fill.checkmark" : "person.fill.badge.plus"} 
                      size={18} 
                      color={isFollowingUser ? "#666" : "#FFF"} 
                    />
                    <Text style={[styles.followButtonText, isFollowingUser && styles.followingButtonText]}>
                      {isFollowingUser ? 'Following' : 'Follow'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Send Sticky Note Button (only for mutual followers) */}
              {isMutualFollowers && (
                <TouchableOpacity
                  style={styles.stickyNoteButton}
                  onPress={handleOpenCompose}
                >
                  <IconSymbol name="note.text" size={18} color="#333" />
                  <Text style={styles.stickyNoteButtonText}>Send Note</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Show message if blocked */}
          {currentUserId && currentUserId !== userId && isBlocked && (
            <View style={styles.blockedMessage}>
              <Text style={styles.blockedMessageText}>
                You have blocked this user
              </Text>
              <TouchableOpacity onPress={handleBlockUser}>
                <Text style={styles.unblockLink}>Unblock</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Bulletin Board */}
        <View style={styles.bulletinSection}>
          {monthlyPhotos.length > 0 && (
            <>
              <View style={styles.monthNavigation}>
                <TouchableOpacity
                  onPress={goToPreviousMonth}
                  disabled={currentMonthIndex === monthlyPhotos.length - 1}
                  style={styles.navButton}
                >
                  <IconSymbol
                    name="chevron.left.circle.fill"
                    size={28}
                    color={currentMonthIndex === monthlyPhotos.length - 1 ? '#CCC' : '#333'}
                  />
                </TouchableOpacity>
                <View style={styles.monthLabel}>
                  <HandwrittenText size={28} bold>
                    {monthlyPhotos[currentMonthIndex]?.monthLabel}
                  </HandwrittenText>
                </View>
                <TouchableOpacity
                  onPress={goToNextMonth}
                  disabled={currentMonthIndex === 0}
                  style={styles.navButton}
                >
                  <IconSymbol
                    name="chevron.right.circle.fill"
                    size={28}
                    color={currentMonthIndex === 0 ? '#CCC' : '#333'}
                  />
                </TouchableOpacity>
              </View>

              <View style={[styles.bulletinBoard, { height: bulletinBoardHeight }]}>
                {monthlyPhotos[currentMonthIndex]?.photos.map((photo, index) => {
                  const col = index % 2;
                  const row = Math.floor(index / 2);
                  const rotations = [-4, 3, -3, 5, -2, 4];

                  return (
                    <View
                      key={photo.id}
                      style={[
                        styles.pinnedPolaroid,
                        {
                          transform: [
                            { rotate: `${rotations[index % rotations.length]}deg` },
                          ],
                          left: col === 0 ? '8%' : '52%',
                          top: row * 260 + 20,
                          width: '40%',
                        },
                      ]}
                    >
                      <View style={[
                        styles.tape,
                        {
                          transform: [{ rotate: `${(index % 2 === 0 ? -3 : 3)}deg` }],
                          opacity: 0.85 + (index % 3) * 0.05,
                        }
                      ]} />

                      <View style={styles.polaroidContainer}>
                        <View style={styles.imageWrapper}>
                          <Image
                            source={{ uri: photo.image_url }}
                            style={styles.polaroidImage}
                          />
                          {/* Apply filter overlays based on photo_style */}
                          <FilterOverlay filterId={(photo.photo_style as any) || 'polaroid'} />
                        </View>
                        <View style={styles.polaroidCaption}>
                          <HandwrittenText size={14}>
                            {photo.caption?.substring(0, 25) || '...'}
                          </HandwrittenText>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </>
          )}

          {photos.length === 0 && (
            <View style={styles.emptyState}>
              <IconSymbol name="camera" size={60} color="#DDD" />
              <Text style={styles.emptyText}>No REWNDs yet</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Compose Sticky Note Modal */}
      <Modal
        visible={showComposeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowComposeModal(false)}
      >
        <View style={styles.composeModalContainer}>
          <View style={styles.composeModalContent}>
            <View style={styles.composeHeader}>
              <TouchableOpacity onPress={() => setShowComposeModal(false)}>
                <IconSymbol name="xmark.circle.fill" size={28} color="#666" />
              </TouchableOpacity>
              <HandwrittenText size={24} bold style={{ paddingHorizontal: 10 }}>
                Send to @{user?.username}
              </HandwrittenText>
              <TouchableOpacity
                onPress={handleSendStickyNote}
                disabled={sendingMessage || !messageText.trim()}
              >
                <Text
                  style={[
                    styles.sendButton,
                    (!messageText.trim() || sendingMessage) && styles.sendButtonDisabled,
                  ]}
                >
                  {sendingMessage ? 'Sending...' : 'Send'}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.composeScroll}>
              {/* Color Picker */}
              <View style={styles.colorSection}>
                <HandwrittenText size={16} bold>Pick a color</HandwrittenText>
                <View style={styles.colorPickerRow}>
                  {['yellow', 'pink', 'blue', 'green', 'orange'].map((color) => {
                    const bgColor =
                      color === 'yellow'
                        ? '#FEFF9C'
                        : color === 'pink'
                        ? '#FFB5E8'
                        : color === 'blue'
                        ? '#AFF8DB'
                        : color === 'green'
                        ? '#B5F5B5'
                        : '#FFD5A3';
                    return (
                      <TouchableOpacity
                        key={color}
                        style={[
                          styles.colorOption,
                          { backgroundColor: bgColor },
                          messageColor === color && styles.colorOptionSelected,
                        ]}
                        onPress={() => setMessageColor(color)}
                      >
                        {messageColor === color && (
                          <IconSymbol name="checkmark.circle.fill" size={20} color="#333" />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Message Input */}
              <View style={styles.messageInputSection}>
                <HandwrittenText size={16} bold>Write your message</HandwrittenText>
                <TextInput
                  style={[
                    styles.messageInput,
                    {
                      backgroundColor:
                        messageColor === 'yellow'
                          ? '#FEFF9C'
                          : messageColor === 'pink'
                          ? '#FFB5E8'
                          : messageColor === 'blue'
                          ? '#AFF8DB'
                          : messageColor === 'green'
                          ? '#B5F5B5'
                          : '#FFD5A3',
                    },
                  ]}
                  value={messageText}
                  onChangeText={setMessageText}
                  placeholder="What do you want to say?"
                  placeholderTextColor="rgba(0,0,0,0.3)"
                  maxLength={300}
                  multiline
                  textAlignVertical="top"
                  autoFocus
                />
                <Text style={styles.charCount}>{messageText.length}/300</Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Profile Menu Modal (Android) */}
      {Platform.OS === 'android' && (
        <Modal
          visible={showProfileMenu}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowProfileMenu(false)}
        >
          <TouchableOpacity 
            style={styles.menuOverlay}
            activeOpacity={1}
            onPress={() => setShowProfileMenu(false)}
          >
            <View style={styles.menuContainer}>
              {isBlocked ? (
                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => {
                    setShowProfileMenu(false);
                    handleBlockUser();
                  }}
                >
                  <IconSymbol name="person.fill.xmark" size={24} color="#333" />
                  <Text style={styles.menuItemText}>Unblock User</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity 
                    style={styles.menuItem}
                    onPress={() => {
                      setShowProfileMenu(false);
                      handleBlockUser();
                    }}
                  >
                    <IconSymbol name="person.fill.xmark" size={24} color="#FF5757" />
                    <Text style={[styles.menuItemText, { color: '#FF5757' }]}>Block User</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.menuItem}
                    onPress={() => {
                      setShowProfileMenu(false);
                      handleReportUser();
                    }}
                  >
                    <IconSymbol name="flag" size={24} color="#333" />
                    <Text style={styles.menuItemText}>Report User</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F0',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: 8,
  },
  profileHeader: {
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 20,
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  profilePicturePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  bio: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 30,
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 16,
    paddingHorizontal: 40,
    backgroundColor: '#F8F6F0',
    borderRadius: 16,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF5757',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontWeight: '500',
  },
  statBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  newBadge: {
    backgroundColor: '#FF5757',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#DDD',
    marginHorizontal: 8,
  },
  followButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FF5757',
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  followingButton: {
    backgroundColor: '#E8E8E8',
  },
  followButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    paddingHorizontal: 20,
  },
  stickyNoteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFD93D',
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  stickyNoteButtonText: {
    color: '#333',
    fontSize: 15,
    fontWeight: '600',
  },
  blockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FF5757',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  unblockButton: {
    backgroundColor: '#F0F0F0',
  },
  blockButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  unblockButtonText: {
    color: '#666',
  },
  reportIconButton: {
    padding: 12,
    marginLeft: 8,
  },
  menuButton: {
    padding: 4,
  },
  blockedMessage: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  blockedMessageText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
  },
  unblockLink: {
    fontSize: 15,
    color: '#FF5757',
    fontWeight: '600',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    padding: 20,
    paddingTop: 60,
  },
  menuContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
  },
  composeModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  composeModalContent: {
    backgroundColor: '#F5F5F0',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '75%',
  },
  composeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  sendButton: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF5757',
  },
  sendButtonDisabled: {
    color: '#CCC',
  },
  composeScroll: {
    flex: 1,
    padding: 16,
  },
  colorSection: {
    marginBottom: 20,
  },
  colorPickerRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#333',
  },
  messageInputSection: {
    marginBottom: 20,
  },
  messageInput: {
    marginTop: 12,
    padding: 16,
    borderRadius: 8,
    fontSize: 16,
    minHeight: 150,
    textAlignVertical: 'top',
    fontFamily: 'System',
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  bulletinSection: {
    marginTop: 10,
    paddingHorizontal: 10,
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  navButton: {
    padding: 8,
  },
  monthLabel: {
    flex: 1,
    alignItems: 'center',
  },
  bulletinBoard: {
    backgroundColor: '#B8956A',
    minHeight: 600,
    padding: 20,
    position: 'relative',
    borderRadius: 8,
    marginHorizontal: 10,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 8,
    borderColor: '#8B7355',
  },
  pinnedPolaroid: {
    position: 'absolute',
    width: '40%',
    zIndex: 1,
  },
  tape: {
    position: 'absolute',
    top: -15,
    left: '50%',
    marginLeft: -30,
    width: 60,
    height: 25,
    backgroundColor: 'rgba(255, 250, 220, 0.7)',
    borderRadius: 2,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 0.5,
    borderColor: 'rgba(200, 200, 180, 0.3)',
  },
  polaroidContainer: {
    backgroundColor: '#F8F6F0',
    padding: 10,
    paddingBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
    overflow: 'hidden',
  },
  polaroidImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  vintageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 220, 150, 0.15)',
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    borderRadius: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 40,
  },
  polaroidCaption: {
    marginTop: 8,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
});
