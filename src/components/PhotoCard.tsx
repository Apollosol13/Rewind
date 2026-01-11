import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import PolaroidFrame from './PolaroidFrame';
import { Photo } from '../config/supabase';
import { getRelativeTime } from '../utils/dateFormatter';

interface PhotoCardProps {
  photo: Photo;
  onPress?: () => void;
}

export default function PhotoCard({ photo, onPress }: PhotoCardProps) {
  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.header}>
        <Text style={styles.username}>@{photo.users?.username || 'Unknown'}</Text>
        <Text style={styles.time}>{getRelativeTime(photo.created_at)}</Text>
      </View>

      <PolaroidFrame
        imageUri={photo.image_url}
        caption={photo.caption}
        date={photo.created_at}
        showRainbow={true}
        width={340}
      />

      <View style={styles.interactions}>
        <View style={styles.interactionItem}>
          <Text style={styles.interactionIcon}>❤️</Text>
          <Text style={styles.interactionText}>{photo.likes_count || 0}</Text>
        </View>
        <View style={styles.interactionItem}>
          <Text style={styles.interactionIcon}>💬</Text>
          <Text style={styles.interactionText}>{photo.comments_count || 0}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    marginHorizontal: 20,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  time: {
    fontSize: 14,
    color: '#999',
  },
  interactions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 20,
  },
  interactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  interactionIcon: {
    fontSize: 18,
  },
  interactionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
});
