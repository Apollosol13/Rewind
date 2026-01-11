import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import PhotoCard from '../components/PhotoCard';
import HandwrittenText from '../components/HandwrittenText';
import { getFeed } from '../services/photos';
import { Photo } from '../config/supabase';

export default function FeedScreen() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async () => {
    try {
      const { photos: fetchedPhotos, error } = await getFeed();
      if (!error && fetchedPhotos) {
        setPhotos(fetchedPhotos);
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

  const renderHeader = () => (
    <View style={styles.header}>
      <HandwrittenText size={36} bold>Rewind</HandwrittenText>
      <Text style={styles.subtitle}>Today's memories</Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>📸</Text>
      <HandwrittenText size={26} bold>No Rewinds yet</HandwrittenText>
      <Text style={styles.emptyText}>
        Be the first to capture a moment!
      </Text>
      <TouchableOpacity 
        style={styles.captureButton}
        onPress={() => router.push('/camera')}
      >
        <Text style={styles.captureButtonText}>Take a Rewind</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF4444" />
        <HandwrittenText size={20} style={styles.loadingText}>
          Loading memories...
        </HandwrittenText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={photos}
        renderItem={({ item }) => (
          <PhotoCard 
            photo={item} 
            onPress={() => {
              // Navigate to photo detail (to be implemented)
              console.log('Photo pressed:', item.id);
            }}
          />
        )}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FF4444"
          />
        }
        contentContainerStyle={photos.length === 0 ? styles.emptyList : undefined}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating camera button */}
      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={() => router.push('/camera')}
      >
        <Text style={styles.floatingButtonText}>📸</Text>
      </TouchableOpacity>
    </View>
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
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 10,
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
  emptyEmoji: {
    fontSize: 80,
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
    backgroundColor: '#FF4444',
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
    backgroundColor: '#FF4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingButtonText: {
    fontSize: 32,
  },
});
