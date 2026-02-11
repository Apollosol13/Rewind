import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActionSheetIOS,
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '../../components/ui/icon-symbol';
import FilterOverlay from '../components/FilterOverlay';
import HandwrittenText from '../components/HandwrittenText';
import PolaroidFrame from '../components/PolaroidFrame';
import { Photo, User } from '../config/supabase';
import { getCurrentUser, getUserProfile } from '../services/auth';
import { blockUser, isUserBlocked, unblockUser } from '../services/blocks';
import { getNewFollowersCount } from '../services/followerBadge';
import { followUser, getFollowerCount, getFollowingCount, isFollowing, unfollowUser } from '../services/follows';
import {
    addComment,
    addCommentReply,
    deleteComment as deletePhotoComment,
    getComments,
    getUserPhotos,
    hasUserLikedPhoto,
    likePhoto,
    unlikePhoto
} from '../services/photos';
import { ReportReason, getReasonDisplayText, reportUser } from '../services/reports';
import { areMutualFollowers, canSendMessageTo, sendStickyMessage } from '../services/stickyMessages';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 768;

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
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [photoLikes, setPhotoLikes] = useState<Record<string, boolean>>({});
  const [photoComments, setPhotoComments] = useState<Record<string, any[]>>({});
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<any>(null);

  useEffect(() => {
    loadUserProfile();
  }, [userId]);

  // Reload profile when screen comes into focus (syncs comments/likes from other screens)
  useFocusEffect(
    React.useCallback(() => {
      if (userId) {
        loadUserProfile();
      }
    }, [userId])
  );

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
        `Block @${user?.username}? Their content will be removed from your feed instantly, you won't see each other's posts, and you'll both be unfollowed.`,
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
                Alert.alert('Blocked', `You have blocked @${user?.username}. Their content has been removed from your feed.`);
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

  const loadPhotoDetails = async (photoId: string) => {
    if (!currentUserId) return;
    
    try {
      // Check if user liked this photo
      const { liked } = await hasUserLikedPhoto(photoId, currentUserId);
      setPhotoLikes(prev => ({ ...prev, [photoId]: liked }));
      
      // Load comments
      const { comments } = await getComments(photoId);
      // Ensure unique comments by ID (prevents duplicates)
      const uniqueComments = Array.from(
        new Map((comments || []).map(c => [c.id, c])).values()
      );
      setPhotoComments(prev => ({ ...prev, [photoId]: uniqueComments }));
    } catch (error) {
      console.error('Error loading photo details:', error);
    }
  };

  const handlePhotoLike = async (photoId: string) => {
    if (!currentUserId) return;
    
    try {
      await likePhoto(photoId, currentUserId);
      setPhotoLikes(prev => ({ ...prev, [photoId]: true }));
      
      // Update likes count in photos array
      setPhotos(prev => prev.map(p => 
        p.id === photoId ? { ...p, likes_count: (p.likes_count || 0) + 1 } : p
      ));
      
      // Update selectedPhoto if it's the current one
      if (selectedPhoto?.id === photoId) {
        setSelectedPhoto(prev => prev ? { ...prev, likes_count: (prev.likes_count || 0) + 1 } : null);
      }
    } catch (error) {
      console.error('Error liking photo:', error);
    }
  };

  const handlePhotoUnlike = async (photoId: string) => {
    if (!currentUserId) return;
    
    try {
      await unlikePhoto(photoId, currentUserId);
      setPhotoLikes(prev => ({ ...prev, [photoId]: false }));
      
      // Update likes count in photos array
      setPhotos(prev => prev.map(p => 
        p.id === photoId ? { ...p, likes_count: Math.max((p.likes_count || 0) - 1, 0) } : p
      ));
      
      // Update selectedPhoto if it's the current one
      if (selectedPhoto?.id === photoId) {
        setSelectedPhoto(prev => prev ? { ...prev, likes_count: Math.max((prev.likes_count || 0) - 1, 0) } : null);
      }
    } catch (error) {
      console.error('Error unliking photo:', error);
    }
  };

  const handleModalAddComment = async () => {
    if (!selectedPhoto || !currentUserId || !commentText.trim()) return;
    
    try {
      if (replyingTo) {
        // Add reply
        await addCommentReply(selectedPhoto.id, currentUserId, commentText.trim(), replyingTo.id);
      } else {
        // Add comment
        await addComment(selectedPhoto.id, currentUserId, commentText.trim());
      }
      
      setCommentText('');
      setReplyingTo(null);
      
      // Reload comments
      await loadPhotoDetails(selectedPhoto.id);
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment');
    }
  };

  const handleModalDeleteComment = async (commentId: string) => {
    if (!currentUserId) return;
    
    try {
      await deletePhotoComment(commentId, currentUserId);
      
      // Reload comments
      if (selectedPhoto) {
        await loadPhotoDetails(selectedPhoto.id);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      Alert.alert('Error', 'Failed to delete comment');
    }
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
        <ActivityIndicator size="large" color="#EF4249" />
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
    Math.ceil((monthlyPhotos[currentMonthIndex]?.photos.length || 0) / (isTablet ? 3 : 2)) * (isTablet ? 220 : 260) + 80
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
              <Text style={styles.statLabel}>REWINDs</Text>
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
                  const numCols = isTablet ? 3 : 2;
                  const col = index % numCols;
                  const row = Math.floor(index / numCols);
                  const rotations = [-4, 3, -3, 5, -2, 4];

                  // Calculate left position based on column
                  let leftPos = '8%';
                  if (isTablet) {
                    leftPos = col === 0 ? '5%' : col === 1 ? '37%' : '69%';
                  } else {
                    leftPos = col === 0 ? '8%' : '52%';
                  }

                  return (
                    <TouchableOpacity
                      key={photo.id}
                      style={[
                        styles.pinnedPolaroid,
                        {
                          transform: [
                            { rotate: `${rotations[index % rotations.length]}deg` },
                          ],
                          left: leftPos,
                          top: row * (isTablet ? 220 : 260) + 20,
                          width: isTablet ? '28%' : '40%',
                        },
                      ]}
                      onPress={() => {
                        setSelectedPhoto(photo);
                        loadPhotoDetails(photo.id);
                      }}
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
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {photos.length === 0 && (
            <View style={styles.emptyState}>
              <IconSymbol name="camera" size={60} color="#DDD" />
              <Text style={styles.emptyText}>No REWINDs yet</Text>
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
                    <IconSymbol name="person.fill.xmark" size={24} color="#EF4249" />
                    <Text style={[styles.menuItemText, { color: '#EF4249' }]}>Block User</Text>
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

      {/* Photo Detail Modal */}
      <Modal
        visible={!!selectedPhoto}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {
          setSelectedPhoto(null);
          setCommentText('');
          setReplyingTo(null);
        }}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.photoModalHeader}>
              <TouchableOpacity 
                onPress={() => {
                  setSelectedPhoto(null);
                  setCommentText('');
                  setReplyingTo(null);
                }}
              >
                <Text style={styles.modalCloseIcon}>✕</Text>
              </TouchableOpacity>
              
              <View style={{ width: 24 }} />
              <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.photoModalScroll}>
              {/* Photo */}
              {selectedPhoto && (
                <View style={styles.photoContainer}>
                  <PolaroidFrame
                    imageUri={selectedPhoto.image_url}
                    caption={selectedPhoto.caption}
                    date={selectedPhoto.created_at}
                    showRainbow={true}
                    width={300}
                    filterId={(selectedPhoto.photo_style as any) || 'polaroid'}
                  />
                </View>
              )}

              {/* Likes and Actions */}
              <View style={styles.actionsContainer}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => selectedPhoto && (photoLikes[selectedPhoto.id] ? handlePhotoUnlike(selectedPhoto.id) : handlePhotoLike(selectedPhoto.id))}
                >
                  <IconSymbol 
                    name={selectedPhoto && photoLikes[selectedPhoto.id] ? "heart.fill" : "heart"} 
                    size={28} 
                    color={selectedPhoto && photoLikes[selectedPhoto.id] ? "#EF4249" : "#333"} 
                  />
                  <Text style={styles.actionCount}>{selectedPhoto?.likes_count || 0}</Text>
                </TouchableOpacity>
                
                <View style={styles.actionButton}>
                  <IconSymbol name="bubble.left" size={28} color="#333" />
                  <Text style={styles.actionCount}>
                    {selectedPhoto && photoComments[selectedPhoto.id] 
                      ? photoComments[selectedPhoto.id].length 
                      : selectedPhoto?.comments_count || 0}
                  </Text>
                </View>
              </View>

              {/* Comments Section */}
              <View style={styles.commentsSection}>
                <Text style={styles.commentsTitle}>Comments</Text>
                
                {selectedPhoto && photoComments[selectedPhoto.id]?.filter(c => !c.parent_comment_id).map((comment) => (
                  <View key={comment.id}>
                    <View style={styles.commentItem}>
                      <View style={styles.commentHeader}>
                        <HandwrittenText size={14} bold style={{ paddingHorizontal: 5 }}>
                          @{comment.users?.username}
                        </HandwrittenText>
                        {comment.user_id === currentUserId && (
                          <TouchableOpacity onPress={() => handleModalDeleteComment(comment.id)}>
                            <IconSymbol name="trash" size={16} color="#EF4249" />
                          </TouchableOpacity>
                        )}
                      </View>
                      <Text style={styles.commentText}>{comment.text}</Text>
                      <TouchableOpacity onPress={() => setReplyingTo(comment)}>
                        <Text style={styles.replyButton}>Reply</Text>
                      </TouchableOpacity>
                    </View>
                    
                    {/* Replies */}
                    {selectedPhoto && photoComments[selectedPhoto.id]?.filter(c => c.parent_comment_id === comment.id).map((reply) => (
                      <View key={reply.id} style={styles.replyItem}>
                        <View style={styles.commentHeader}>
                          <HandwrittenText size={12} bold style={{ paddingHorizontal: 5 }}>
                            @{reply.users?.username}
                          </HandwrittenText>
                          {reply.user_id === currentUserId && (
                            <TouchableOpacity onPress={() => handleModalDeleteComment(reply.id)}>
                              <IconSymbol name="trash" size={14} color="#EF4249" />
                            </TouchableOpacity>
                          )}
                        </View>
                        <Text style={styles.replyText}>{reply.text}</Text>
                      </View>
                    ))}
                  </View>
                ))}
                
                {selectedPhoto && (!photoComments[selectedPhoto.id] || photoComments[selectedPhoto.id].length === 0) && (
                  <Text style={styles.noComments}>No comments yet. Be the first!</Text>
                )}
              </View>
            </ScrollView>

            {/* Comment Input */}
            <View style={styles.commentInputContainer}>
              {replyingTo && (
                <View style={styles.replyingToBar}>
                  <Text style={styles.replyingToText}>
                    Replying to @{replyingTo.users?.username}
                  </Text>
                  <TouchableOpacity onPress={() => setReplyingTo(null)}>
                    <IconSymbol name="xmark.circle.fill" size={20} color="#999" />
                  </TouchableOpacity>
                </View>
              )}
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Add a comment..."
                  value={commentText}
                  onChangeText={setCommentText}
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity 
                  style={styles.sendButton}
                  onPress={handleModalAddComment}
                  disabled={!commentText.trim()}
                >
                  <IconSymbol 
                    name="paperplane.fill" 
                    size={24} 
                    color={commentText.trim() ? "#EF4249" : "#CCC"} 
                  />
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
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
    color: '#EF4249',
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
    backgroundColor: '#EF4249',
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
    backgroundColor: '#EF4249',
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
    backgroundColor: '#EF4249',
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
    color: '#EF4249',
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
    color: '#EF4249',
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
    marginHorizontal: isTablet ? 40 : 10,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 8,
    borderColor: '#8B7355',
    ...(isTablet && {
      maxWidth: 900,
      alignSelf: 'center',
      width: '95%',
    }),
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
  camcorderThumbnailOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
  },
  camcorderTop: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 5,
  },
  recIndicatorSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
    gap: 3,
  },
  recTextSmall: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: 'bold',
    fontFamily: 'Courier',
  },
  recDotSmall: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FF0000',
  },
  cornerSmallTL: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 12,
    height: 12,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: '#FF0000',
  },
  cornerSmallTR: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 12,
    height: 12,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: '#FF0000',
  },
  cornerSmallBL: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    width: 12,
    height: 12,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderColor: '#FF0000',
  },
  cornerSmallBR: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: '#FF0000',
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#F5F5F0',
  },
  photoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFF',
  },
  modalCloseIcon: {
    fontSize: 24,
    color: '#333',
    fontWeight: '600',
  },
  photoModalScroll: {
    flex: 1,
  },
  photoContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  camcorderImage: {
    width: 300,
    height: 300,
    borderRadius: 8,
    backgroundColor: '#000',
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  commentsSection: {
    padding: 20,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  commentItem: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 6,
  },
  replyButton: {
    fontSize: 12,
    color: '#EF4249',
    fontWeight: '600',
  },
  replyItem: {
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
    padding: 10,
    marginLeft: 30,
    marginBottom: 8,
  },
  replyText: {
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
  },
  noComments: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 30,
  },
  commentInputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#FFF',
  },
  replyingToBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F0F0F0',
  },
  replyingToText: {
    fontSize: 12,
    color: '#666',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  modalContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoWrapper: {
    alignItems: 'center',
  },
  vcrContainer: {
    width: 300,
    height: 300,
    backgroundColor: '#000',
    borderRadius: 8,
    overflow: 'hidden',
  },
  vcrImage: {
    width: '100%',
    height: '100%',
  },
});
