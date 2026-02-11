import { useFocusEffect, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { IconSymbol } from '../../components/ui/icon-symbol';
import HandwrittenText from '../components/HandwrittenText';
import PhotoCard from '../components/PhotoCard';
import PolaroidFrame from '../components/PolaroidFrame';
import { Photo, User } from '../config/supabase';
import { getCurrentUser } from '../services/auth';
import { findContactsOnApp } from '../services/contacts';
import { followUser, isFollowing, unfollowUser } from '../services/follows';
import {
    addComment,
    addCommentReply,
    deleteComment,
    getComments,
    getFeed,
    hasUserLikedPhoto,
    likePhoto,
    unlikePhoto
} from '../services/photos';
import { reportComment, reportPhoto, ReportReason } from '../services/reports';
import { getSuggestedUsers, searchUsers } from '../services/search';

export default function FeedScreen() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [photoLikes, setPhotoLikes] = useState<Record<string, boolean>>({});
  const [photoComments, setPhotoComments] = useState<Record<string, any[]>>({});
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [hasPostedToday, setHasPostedToday] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [contactUsers, setContactUsers] = useState<(User & { contactName?: string })[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [userFollowStatus, setUserFollowStatus] = useState<Record<string, boolean>>({});
  const router = useRouter();

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      loadFeed();
    }
  }, [currentUserId]);

  // Reload feed when screen comes into focus (syncs comments/likes from other screens)
  useFocusEffect(
    React.useCallback(() => {
      if (currentUserId) {
        loadFeed();
      }
    }, [currentUserId])
  );

  const loadCurrentUser = async () => {
    const { user } = await getCurrentUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const loadFeed = async () => {
    try {
      // Check if user can post (24-hour cycle check)
      // DISABLED - One-photo-per-day limit removed
      // if (currentUserId) {
      //   const { canPost } = await canUserPost(currentUserId);
      //   setHasPostedToday(!canPost); // hasPostedToday = true if can't post yet
      // }

      const { photos: fetchedPhotos, error } = await getFeed();
      if (!error && fetchedPhotos) {
        setPhotos(fetchedPhotos);
        
        // Load likes and comments for each photo
        if (currentUserId) {
          const likes: Record<string, boolean> = {};
          const comments: Record<string, any[]> = {};
          
          await Promise.all(
            fetchedPhotos.map(async (photo) => {
              const [{ liked }, { comments: photoComments }] = await Promise.all([
                hasUserLikedPhoto(photo.id, currentUserId),
                getComments(photo.id),
              ]);
              likes[photo.id] = liked;
              // Ensure unique comments by ID (prevents duplicates)
              const uniqueComments = Array.from(
                new Map((photoComments || []).map(c => [c.id, c])).values()
              );
              comments[photo.id] = uniqueComments;
            })
          );
          
          setPhotoLikes(likes);
          setPhotoComments(comments);
        }
      }
    } catch (error) {
      console.error('Error loading feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFeed();
    setRefreshing(false);
  };

  const handlePhotoLike = async (photoId: string) => {
    if (!currentUserId) return;
    
    await likePhoto(photoId, currentUserId);
    setPhotoLikes(prev => ({ ...prev, [photoId]: true }));
    
    // Update photo likes count
    setPhotos(prev => prev.map(p => 
      p.id === photoId ? { ...p, likes_count: (p.likes_count || 0) + 1 } : p
    ));
  };

  const handlePhotoUnlike = async (photoId: string) => {
    if (!currentUserId) return;
    
    await unlikePhoto(photoId, currentUserId);
    setPhotoLikes(prev => ({ ...prev, [photoId]: false }));
    
    // Update photo likes count
    setPhotos(prev => prev.map(p => 
      p.id === photoId ? { ...p, likes_count: Math.max(0, (p.likes_count || 0) - 1) } : p
    ));
  };

  const handlePhotoComment = async (photoId: string, text: string) => {
    if (!currentUserId) return;
    
    console.log('💬 FeedScreen: Adding comment to photo', photoId);
    const { error } = await addComment(photoId, currentUserId, text);
    if (!error) {
      // Reload comments for this photo
      const { comments: fetchedComments } = await getComments(photoId);
      if (fetchedComments) {
        console.log('📦 Fetched comments count:', fetchedComments.length);
        console.log('📋 Comment IDs:', fetchedComments.map(c => `${c.id.substring(0, 8)}...`));
        
        // Ensure unique comments by ID (prevents duplicates)
        const uniqueComments = Array.from(
          new Map(fetchedComments.map(c => [c.id, c])).values()
        );
        console.log('✅ Unique comments count:', uniqueComments.length);
        
        setPhotoComments(prev => ({ ...prev, [photoId]: uniqueComments }));
        
        // Update photo comments count
        setPhotos(prev => prev.map(p => 
          p.id === photoId ? { ...p, comments_count: uniqueComments.length } : p
        ));
      }
    }
  };

  const openPhotoDetail = async (photo: Photo) => {
    setSelectedPhoto(photo);
    setCommentText('');
    setReplyingTo(null);
  };

  const closePhotoDetail = () => {
    setSelectedPhoto(null);
    setCommentText('');
    setReplyingTo(null);
  };

  const handleModalAddComment = async () => {
    if (!currentUserId || !selectedPhoto || !commentText.trim()) return;
    
    console.log('💬 FeedScreen Modal: Adding comment');
    let result;
    if (replyingTo) {
      result = await addCommentReply(
        selectedPhoto.id,
        currentUserId,
        commentText.trim(),
        replyingTo.id
      );
    } else {
      result = await addComment(selectedPhoto.id, currentUserId, commentText.trim());
    }
    
    if (!result.error) {
      // Reload comments
      const { comments: fetchedComments } = await getComments(selectedPhoto.id);
      if (fetchedComments) {
        console.log('📦 Modal: Fetched comments count:', fetchedComments.length);
        console.log('📋 Modal: Comment IDs:', fetchedComments.map(c => `${c.id.substring(0, 8)}...`));
        
        // Ensure unique comments by ID (prevents duplicates)
        const uniqueComments = Array.from(
          new Map(fetchedComments.map(c => [c.id, c])).values()
        );
        console.log('✅ Modal: Unique comments count:', uniqueComments.length);
        
        setPhotoComments(prev => ({ ...prev, [selectedPhoto.id]: uniqueComments }));
        
        // Update photo comments count
        setPhotos(prev => prev.map(p => 
          p.id === selectedPhoto.id ? { ...p, comments_count: uniqueComments.length } : p
        ));
      }
      setCommentText('');
      setReplyingTo(null);
    }
  };

  const handleDeleteComment = async (photoId: string, commentId: string) => {
    if (!currentUserId) return;
    
    const { error } = await deleteComment(commentId, currentUserId);
    if (!error) {
      // Reload comments
      const { comments: fetchedComments } = await getComments(photoId);
      if (fetchedComments) {
        // Ensure unique comments by ID (prevents duplicates)
        const uniqueComments = Array.from(
          new Map(fetchedComments.map(c => [c.id, c])).values()
        );
        setPhotoComments(prev => ({ ...prev, [photoId]: uniqueComments }));
        
        // Update photo comments count
        setPhotos(prev => prev.map(p => 
          p.id === photoId ? { ...p, comments_count: uniqueComments.length } : p
        ));
      }
    }
  };

  const handleReportPhoto = async (photo: Photo) => {
    if (!currentUserId) return;

    const reasons: ReportReason[] = [
      'spam',
      'harassment',
      'hate_speech',
      'violence',
      'nudity',
      'inappropriate',
      'other',
    ];

    const getReasonDisplayText = (reason: ReportReason): string => {
      const displayTexts: Record<ReportReason, string> = {
        spam: 'Spam',
        harassment: 'Harassment',
        hate_speech: 'Hate Speech',
        violence: 'Violence',
        nudity: 'Nudity or Sexual Content',
        inappropriate: 'Inappropriate Content',
        impersonation: 'Impersonation',
        other: 'Other',
      };
      return displayTexts[reason];
    };

    Alert.alert(
      'Report Photo',
      `Why are you reporting @${photo.users?.username}'s photo?`,
      [
        ...reasons.map(reason => ({
          text: getReasonDisplayText(reason),
          onPress: () => submitPhotoReport(photo, reason),
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const submitPhotoReport = async (photo: Photo, reason: ReportReason) => {
    if (!currentUserId) return;
    
    const { error } = await reportPhoto(
      currentUserId,
      photo.id,
      photo.user_id,
      reason
    );
    
    if (!error) {
      Alert.alert(
        'Report Submitted',
        'Thank you for helping keep REWIND safe. We\'ll review this report within 24 hours.',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    }
  };

  const handleReportComment = async (commentId: string, reportedUserId: string) => {
    if (!currentUserId) return;

    const reasons: ReportReason[] = [
      'spam',
      'harassment',
      'hate_speech',
      'violence',
      'inappropriate',
      'other',
    ];

    const getReasonDisplayText = (reason: ReportReason): string => {
      const displayTexts: Record<ReportReason, string> = {
        spam: 'Spam',
        harassment: 'Harassment',
        hate_speech: 'Hate Speech',
        violence: 'Violence',
        nudity: 'Nudity or Sexual Content',
        inappropriate: 'Inappropriate Content',
        impersonation: 'Impersonation',
        other: 'Other',
      };
      return displayTexts[reason];
    };

    Alert.alert(
      'Report Comment',
      'Why are you reporting this comment?',
      [
        ...reasons.map(reason => ({
          text: getReasonDisplayText(reason),
          onPress: () => submitCommentReport(commentId, reportedUserId, reason),
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const submitCommentReport = async (commentId: string, reportedUserId: string, reason: ReportReason) => {
    if (!currentUserId) return;
    
    const { error } = await reportComment(
      currentUserId,
      commentId,
      reportedUserId,
      reason
    );
    
    if (!error) {
      Alert.alert(
        'Report Submitted',
        'Thank you. We\'ll review this comment within 24 hours.',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    }
  };

  const handleModalDeleteComment = async (commentId: string) => {
    if (!currentUserId || !selectedPhoto) return;
    
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await handleDeleteComment(selectedPhoto.id, commentId);
          },
        },
      ]
    );
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    const { users } = await searchUsers(query, currentUserId || undefined);
    setSearchResults(users);
    
    // Check follow status for each user
    if (currentUserId && users.length > 0) {
      const statuses: Record<string, boolean> = {};
      for (const user of users) {
        const { following } = await isFollowing(currentUserId, user.id);
        statuses[user.id] = following;
      }
      setUserFollowStatus(statuses);
    }
    
    setSearchLoading(false);
  };

  const loadSuggestedUsers = async () => {
    if (!currentUserId) return;
    
    const { users } = await getSuggestedUsers(currentUserId, 5);
    setSuggestedUsers(users);
    
    // Check follow status
    if (users.length > 0) {
      const statuses: Record<string, boolean> = {};
      for (const user of users) {
        const { following } = await isFollowing(currentUserId, user.id);
        statuses[user.id] = following;
      }
      setUserFollowStatus(prev => ({ ...prev, ...statuses }));
    }
  };

  const handleFindContacts = async () => {
    if (!currentUserId) return;
    
    setContactsLoading(true);
    const { users, error } = await findContactsOnApp(currentUserId);
    
    if (error) {
      if (error.code === 'PERMISSION_DENIED') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your contacts to find friends on REWIND.',
          [{ text: 'OK' }]
        );
      } else if (error.code === 'COLUMN_NOT_FOUND' || error.code === 'ACCESS_DENIED') {
        // Database not set up yet or RLS issue
        console.warn('Contact sync not configured properly');
        // Don't show alert - just fail silently for now
        // Users can still search manually
      } else {
        // Handle other errors
        console.error('Error finding contacts:', error);
        Alert.alert(
          'Error',
          'Unable to sync contacts. Please try again later.',
          [{ text: 'OK' }]
        );
      }
    } else if (users) {
      setContactUsers(users);
      
      // Check follow status
      if (users.length > 0) {
        const statuses: Record<string, boolean> = {};
        for (const user of users) {
          const { following } = await isFollowing(currentUserId, user.id);
          statuses[user.id] = following;
        }
        setUserFollowStatus(prev => ({ ...prev, ...statuses }));
      }
      
      if (users.length === 0) {
        Alert.alert(
          'No Contacts Found',
          'None of your contacts are on REWIND yet. Invite them to join!',
          [{ text: 'OK' }]
        );
      }
    }
    
    setContactsLoading(false);
  };

  const handleFollowUser = async (userId: string) => {
    if (!currentUserId) return;
    
    await followUser(currentUserId, userId);
    setUserFollowStatus(prev => ({ ...prev, [userId]: true }));
  };

  const handleUnfollowUser = async (userId: string) => {
    if (!currentUserId) return;
    
    await unfollowUser(currentUserId, userId);
    setUserFollowStatus(prev => ({ ...prev, [userId]: false }));
  };

  const openSearchModal = async () => {
    setShowSearchModal(true);
    if (suggestedUsers.length === 0) {
      await loadSuggestedUsers();
    }
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.header}>
        <HandwrittenText size={36} bold style={{ paddingHorizontal: 10 }}>REWIND</HandwrittenText>
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={openSearchModal}
        >
          <IconSymbol name="magnifyingglass" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      <Text style={styles.subtitle}>Today's memories</Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <IconSymbol 
        name="camera.fill" 
        size={80} 
        color="#CCCCCC"
        style={styles.emptyCameraIcon}
      />
      <HandwrittenText size={26} bold style={{ paddingHorizontal: 10 }}>No REWINDs yet</HandwrittenText>
      <Text style={styles.emptyText}>
        Be the first to capture a moment!
      </Text>
      <TouchableOpacity 
        style={styles.captureButton}
        onPress={() => router.push('/camera')}
      >
        <Text style={styles.captureButtonText}>Take a REWIND</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EF4249" />
        <HandwrittenText size={20} style={styles.loadingText}>
          Loading memories...
        </HandwrittenText>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={photos}
        renderItem={({ item }) => (
          <PhotoCard 
            photo={item}
            currentUserId={currentUserId}
            hasLiked={photoLikes[item.id] || false}
            comments={photoComments[item.id] || []}
            onLike={() => handlePhotoLike(item.id)}
            onUnlike={() => handlePhotoUnlike(item.id)}
            onAddComment={(text) => handlePhotoComment(item.id, text)}
            onViewAllComments={() => openPhotoDetail(item)}
            onReply={(comment) => {
              setSelectedPhoto(item);
              setReplyingTo(comment);
            }}
            onDeleteComment={(commentId) => handleDeleteComment(item.id, commentId)}
            onReport={() => handleReportPhoto(item)}
            onReportComment={handleReportComment}
          />
        )}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#EF4249"
          />
        }
        contentContainerStyle={[
          photos.length === 0 ? styles.emptyList : styles.centeredContent
        ]}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating camera button */}
      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={() => router.push('/camera')}
      >
        <IconSymbol name="camera.fill" size={32} color="white" />
        {hasPostedToday && (
          <View style={styles.postedBadge}>
            <IconSymbol name="checkmark.circle.fill" size={20} color="#4CAF50" />
          </View>
        )}
      </TouchableOpacity>

      {/* Photo Detail Modal */}
      <Modal
        visible={!!selectedPhoto}
        animationType="slide"
        transparent={false}
        onRequestClose={closePhotoDetail}
      >
        <SafeAreaView style={styles.modalContainer}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContent}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={closePhotoDetail}>
                <IconSymbol name="xmark" size={24} color="#333" />
              </TouchableOpacity>
              <HandwrittenText size={20} bold style={{ paddingHorizontal: 10 }}>
                @{selectedPhoto?.users?.username}
              </HandwrittenText>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.modalScroll}>
              {/* Photo */}
              {selectedPhoto && (
                <View style={styles.photoContainer}>
                  <PolaroidFrame
                    imageUri={selectedPhoto.image_url}
                    caption={selectedPhoto.caption}
                    date={selectedPhoto.created_at}
                    showRainbow={true}
                    width={340}
                    filterId={selectedPhoto.photo_style as any || 'polaroid'}
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
                  <Text style={styles.actionCount}>{selectedPhoto && photoComments[selectedPhoto.id] ? photoComments[selectedPhoto.id].length : 0}</Text>
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
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Search Modal */}
      <Modal
        visible={showSearchModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSearchModal(false)}
      >
        <SafeAreaView style={styles.searchModalContainer}>
          <View style={styles.searchModalHeader}>
            <TouchableOpacity onPress={() => setShowSearchModal(false)}>
              <IconSymbol name="xmark.circle.fill" size={28} color="#666" />
            </TouchableOpacity>
            <HandwrittenText size={24} bold>Find People</HandwrittenText>
            <View style={{ width: 28 }} />
          </View>

          <View style={styles.searchInputContainer}>
            <IconSymbol name="magnifyingglass" size={20} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by username..."
              value={searchQuery}
              onChangeText={handleSearch}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => handleSearch('')}>
                <IconSymbol name="xmark.circle.fill" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView style={styles.searchScrollView}>
            {searchLoading ? (
              <View style={styles.searchLoadingContainer}>
                <ActivityIndicator size="large" color="#EF4249" />
              </View>
            ) : searchQuery.length > 0 ? (
              searchResults.length > 0 ? (
                <View style={styles.searchResultsContainer}>
                  <Text style={styles.searchSectionTitle}>Search Results</Text>
                  {searchResults.map((user) => (
                    <TouchableOpacity
                      key={user.id}
                      style={styles.userItem}
                      onPress={() => {
                        setShowSearchModal(false);
                        router.push(`/user/${user.id}`);
                      }}
                    >
                      {user.avatar_url ? (
                        <Image source={{ uri: user.avatar_url }} style={styles.userAvatar} />
                      ) : (
                        <View style={styles.userAvatarPlaceholder}>
                          <IconSymbol name="person.fill" size={24} color="#999" />
                        </View>
                      )}
                      <View style={styles.userInfo}>
                        <Text style={styles.userDisplayName}>{user.display_name}</Text>
                        <Text style={styles.userUsername}>@{user.username}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          if (userFollowStatus[user.id]) {
                            handleUnfollowUser(user.id);
                          } else {
                            handleFollowUser(user.id);
                          }
                        }}
                        style={[
                          styles.followButton,
                          userFollowStatus[user.id] && styles.followingButton
                        ]}
                      >
                        <Text style={[
                          styles.followButtonText,
                          userFollowStatus[user.id] && styles.followingButtonText
                        ]}>
                          {userFollowStatus[user.id] ? 'Following' : 'Follow'}
                        </Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.noResultsContainer}>
                  <IconSymbol name="magnifyingglass" size={60} color="#CCC" />
                  <Text style={styles.noResultsText}>No users found</Text>
                </View>
              )
            ) : contactUsers.length > 0 ? (
              <View style={styles.searchResultsContainer}>
                <Text style={styles.searchSectionTitle}>Contacts on REWIND</Text>
                {contactUsers.map((user) => (
                  <TouchableOpacity
                    key={user.id}
                    style={styles.userItem}
                    onPress={() => {
                      setShowSearchModal(false);
                      router.push(`/user/${user.id}`);
                    }}
                  >
                    {user.avatar_url ? (
                      <Image source={{ uri: user.avatar_url }} style={styles.userAvatar} />
                    ) : (
                      <View style={styles.userAvatarPlaceholder}>
                        <IconSymbol name="person.fill" size={24} color="#999" />
                      </View>
                    )}
                    <View style={styles.userInfo}>
                      <Text style={styles.userDisplayName}>
                        {user.display_name || user.contactName}
                      </Text>
                      <Text style={styles.userUsername}>@{user.username}</Text>
                      {user.contactName && (
                        <Text style={styles.contactNameText}>📱 {user.contactName}</Text>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        if (userFollowStatus[user.id]) {
                          handleUnfollowUser(user.id);
                        } else {
                          handleFollowUser(user.id);
                        }
                      }}
                      style={[
                        styles.followButton,
                        userFollowStatus[user.id] && styles.followingButton
                      ]}
                    >
                      <Text style={[
                        styles.followButtonText,
                        userFollowStatus[user.id] && styles.followingButtonText
                      ]}>
                        {userFollowStatus[user.id] ? 'Following' : 'Follow'}
                      </Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            ) : suggestedUsers.length > 0 ? (
              <View style={styles.searchResultsContainer}>
                <Text style={styles.searchSectionTitle}>Suggested for You</Text>
                {suggestedUsers.map((user) => (
                  <TouchableOpacity
                    key={user.id}
                    style={styles.userItem}
                    onPress={() => {
                      setShowSearchModal(false);
                      router.push(`/user/${user.id}`);
                    }}
                  >
                    {user.avatar_url ? (
                      <Image source={{ uri: user.avatar_url }} style={styles.userAvatar} />
                    ) : (
                      <View style={styles.userAvatarPlaceholder}>
                        <IconSymbol name="person.fill" size={24} color="#999" />
                      </View>
                    )}
                    <View style={styles.userInfo}>
                      <Text style={styles.userDisplayName}>{user.display_name}</Text>
                      <Text style={styles.userUsername}>@{user.username}</Text>
                      {user.bio && (
                        <Text style={styles.userBio} numberOfLines={1}>{user.bio}</Text>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        if (userFollowStatus[user.id]) {
                          handleUnfollowUser(user.id);
                        } else {
                          handleFollowUser(user.id);
                        }
                      }}
                      style={[
                        styles.followButton,
                        userFollowStatus[user.id] && styles.followingButton
                      ]}
                    >
                      <Text style={[
                        styles.followButtonText,
                        userFollowStatus[user.id] && styles.followingButtonText
                      ]}>
                        {userFollowStatus[user.id] ? 'Following' : 'Follow'}
                      </Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
          </ScrollView>
        </SafeAreaView>
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
  loadingText: {
    marginTop: 20,
    color: '#666',
  },
  headerContainer: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 10,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    width: '100%',
    position: 'relative',
  },
  searchButton: {
    position: 'absolute',
    right: 20,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyCameraIcon: {
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  captureButton: {
    backgroundColor: '#EF4249',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  captureButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EF4249',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  postedBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  // Photo Detail Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#F5F5F0',
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFF',
  },
  modalScroll: {
    flex: 1,
  },
  photoContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  camcorderImage: {
    width: 340,
    height: 340,
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
    fontStyle: 'italic',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    gap: 10,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    padding: 8,
  },
  // Search Modal Styles
  searchModalContainer: {
    flex: 1,
    backgroundColor: '#F5F5F0',
  },
  searchModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFF',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  findContactsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#EF4249',
    gap: 10,
  },
  findContactsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4249',
  },
  searchScrollView: {
    flex: 1,
  },
  searchLoadingContainer: {
    paddingTop: 60,
    alignItems: 'center',
  },
  searchResultsContainer: {
    paddingHorizontal: 16,
  },
  searchSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    marginTop: 8,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  userAvatarPlaceholder: {
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
  userDisplayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  userUsername: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  userBio: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  contactNameText: {
    fontSize: 12,
    color: '#EF4249',
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
    borderColor: '#E0E0E0',
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  followingButtonText: {
    color: '#666',
  },
  vcrContainer: {
    width: 340,
    height: 340,
    backgroundColor: '#000',
    borderRadius: 8,
    overflow: 'hidden',
  },
  vcrImage: {
    width: '100%',
    height: '100%',
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  noResultsText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  centeredContent: {
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
});
