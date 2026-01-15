import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import PolaroidFrame from './PolaroidFrame';
import HandwrittenText from './HandwrittenText';
import { Photo } from '../config/supabase';
import { getRelativeTime } from '../utils/dateFormatter';
import { IconSymbol } from '../../components/ui/icon-symbol';

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
  onReport
}: PhotoCardProps) {
  const router = useRouter();
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState('');
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

  const handleSubmitComment = () => {
    if (commentText.trim()) {
      onAddComment(commentText.trim());
      setCommentText('');
      setShowCommentInput(false);
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

  const topComments = comments.filter(c => !c.parent_comment_id).slice(0, 2);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => photo.users?.id && router.push(`/user/${photo.users.id}`)}>
          <HandwrittenText size={18} bold>@{photo.users?.username || 'Unknown'}</HandwrittenText>
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <Text style={styles.time}>{getRelativeTime(photo.created_at)}</Text>
          {currentUserId !== photo.user_id && onReport && (
            <TouchableOpacity onPress={onReport} style={styles.reportButton}>
              <IconSymbol name="flag" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Polaroid Photo */}
      <PolaroidFrame
        imageUri={photo.image_url}
        caption={photo.caption}
        date={photo.created_at}
        showRainbow={true}
        width={340}
      />

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleLike}
        >
          <IconSymbol 
            name={isLiked ? "heart.fill" : "heart"} 
            size={28} 
            color={isLiked ? "#FF4444" : "#333"} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setShowCommentInput(!showCommentInput)}
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
            <View key={comment.id} style={styles.commentRowContainer}>
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
                  <IconSymbol name="trash" size={14} color="#FF4444" />
                </TouchableOpacity>
              )}
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

      {/* Comment Input */}
      {showCommentInput && (
        <View style={styles.commentInputContainer}>
          <TextInput
            style={styles.commentInput}
            placeholder="Add a comment..."
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={500}
            autoFocus
          />
          <TouchableOpacity 
            onPress={handleSubmitComment}
            disabled={!commentText.trim()}
          >
            <IconSymbol 
              name="paperplane.fill" 
              size={24} 
              color={commentText.trim() ? "#FF4444" : "#CCC"} 
            />
          </TouchableOpacity>
        </View>
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
  reportButton: {
    padding: 4,
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
});
