import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { Photo } from '../config/supabase';
import { getRelativeTime } from '../utils/dateFormatter';
import HandwrittenText from './HandwrittenText';
import PolaroidFrame from './PolaroidFrame';

interface PhotoCardProps {
  photo: Photo;
  currentUserId: string | null;
  hasLiked: boolean;
  comments: any[];
  onLike: () => void;
  onUnlike: () => void;
  onAddComment: (text: string) => void;
  onViewAllComments: () => void;
  onReply: (comment: any) => void;
  onDeleteComment: (commentId: string) => void;
  onReport?: () => void;
  onReportComment?: (commentId: string, reportedUserId: string) => void;
}

export default function PhotoCard({ 
  photo, 
  currentUserId,
  hasLiked,
  comments,
  onLike,
  onUnlike,
  onAddComment,
  onViewAllComments,
  onReply,
  onDeleteComment,
  onReport,
  onReportComment
}: PhotoCardProps) {
  const router = useRouter();
  const [likesCount, setLikesCount] = useState(photo.likes_count || 0);
  const [isLiked, setIsLiked] = useState(hasLiked);

  useEffect(() => {
    setIsLiked(hasLiked);
  }, [hasLiked]);

  useEffect(() => {
    setLikesCount(photo.likes_count || 0);
  }, [photo.likes_count]);

  const handleLike = () => {
    if (isLiked) {
      setIsLiked(false);
      setLikesCount(prev => Math.max(0, prev - 1));
      onUnlike();
    } else {
      setIsLiked(true);
      setLikesCount(prev => prev + 1);
      onLike();
    }
  };

  const handleDeleteComment = (commentId: string) => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDeleteComment(commentId),
        },
      ]
    );
  };

  const handleReplyToComment = (comment: any) => {
    onReply(comment);
  };

  const topComments = comments.filter(c => !c.parent_comment_id).slice(0, 2);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => photo.users?.id && router.push(`/user/${photo.users.id}`)}>
          <HandwrittenText size={18} bold style={{ paddingHorizontal: 5 }}>@{photo.users?.username || 'Unknown'}</HandwrittenText>
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <Text style={styles.time}>{getRelativeTime(photo.created_at)}</Text>
          {/* LATE badge removed - timer system disabled */}
          {currentUserId !== photo.user_id && onReport && (
            <TouchableOpacity onPress={onReport} style={styles.reportButton}>
              <IconSymbol name="flag" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Photo */}
      <View style={styles.polaroidContainer}>
        <PolaroidFrame
          imageUri={photo.image_url}
          caption={photo.caption}
          date={photo.created_at}
          showRainbow={true}
          width={340}
          filterId={photo.photo_style as any || 'polaroid'}
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleLike}
        >
          <IconSymbol 
            name={isLiked ? "heart.fill" : "heart"} 
            size={28} 
            color={isLiked ? "#EF4249" : "#333"} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={onViewAllComments}
        >
          <IconSymbol name="bubble.left" size={28} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Likes Count */}
      {likesCount > 0 && (
        <Text style={styles.likesCount}>
          {likesCount} {likesCount === 1 ? 'like' : 'likes'}
        </Text>
      )}

      {/* Comments Preview */}
      {topComments.length > 0 && (
        <View style={styles.commentsPreview}>
          {topComments.map((comment) => (
            <View key={comment.id}>
              <TouchableOpacity
                style={styles.commentRowContainer}
                onLongPress={() => {
                  if (comment.user_id !== currentUserId && onReportComment) {
                    Alert.alert(
                      'Report Comment',
                      'Report this comment as inappropriate?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { 
                          text: 'Report', 
                          style: 'destructive',
                          onPress: () => onReportComment(comment.id, comment.user_id)
                        }
                      ]
                    );
                  }
                }}
                activeOpacity={comment.user_id !== currentUserId ? 0.7 : 1}
              >
              <View style={styles.commentRow}>
                <TouchableOpacity onPress={() => comment.users?.id && router.push(`/user/${comment.users.id}`)}>
                  <Text style={styles.commentUsername}>@{comment.users?.username}</Text>
                </TouchableOpacity>
                <Text style={styles.commentText}>{comment.text}</Text>
              </View>
              {comment.user_id === currentUserId && (
                <TouchableOpacity 
                  onPress={() => handleDeleteComment(comment.id)}
                  style={styles.deleteButton}
                >
                  <IconSymbol name="trash" size={14} color="#EF4249" />
                </TouchableOpacity>
              )}
              </TouchableOpacity>
              {/* Reply button below comment */}
              <TouchableOpacity 
                onPress={() => handleReplyToComment(comment)}
                style={styles.replyButtonContainer}
              >
                <Text style={styles.replyButtonText}>Reply</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* View All Comments */}
      {comments.length > 2 && (
        <TouchableOpacity onPress={onViewAllComments}>
          <Text style={styles.viewAllComments}>
            View all {comments.length} comments
          </Text>
        </TouchableOpacity>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  lateBadge: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  lateBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  reportButton: {
    padding: 4,
  },
  polaroidContainer: {
    alignItems: 'center',
    width: '100%',
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
  camcorderImage: {
    width: 340,
    height: 340,
    borderRadius: 8,
    backgroundColor: '#000',
  },
  actions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 16,
  },
  actionButton: {
    padding: 4,
  },
  likesCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
  },
  commentsPreview: {
    marginTop: 12,
    gap: 6,
  },
  commentRowContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  commentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  deleteButton: {
    padding: 4,
    marginLeft: 8,
  },
  commentUsername: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  commentText: {
    fontSize: 13,
    color: '#333',
    flex: 1,
  },
  viewAllComments: {
    fontSize: 13,
    color: '#999',
    marginTop: 8,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 12,
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 80,
  },
  replyButtonContainer: {
    paddingLeft: 16,
    marginTop: 2,
    marginBottom: 4,
  },
  replyButtonText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
});
