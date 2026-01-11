import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import CameraButton from '../components/CameraButton';
import PolaroidFrame from '../components/PolaroidFrame';
import HandwrittenText from '../components/HandwrittenText';
import { uploadPhoto } from '../services/photos';
import { getCurrentUser } from '../services/auth';
import * as Haptics from 'expo-haptics';

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();

  // Request permissions on mount
  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            📸 We need camera access to capture your Rewind moments
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const photo = await cameraRef.current.takePictureAsync();
        if (photo?.uri) {
          setCapturedImage(photo.uri);
        }
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to capture photo');
      }
    }
  };

  const retakePicture = () => {
    setCapturedImage(null);
    setCaption('');
  };

  const handleUpload = async () => {
    if (!capturedImage) return;

    try {
      setUploading(true);
      const { user } = await getCurrentUser();
      
      if (!user) {
        Alert.alert('Error', 'Please sign in to upload photos');
        return;
      }

      const { photo, error } = await uploadPhoto(capturedImage, caption, user.id);
      
      if (error) {
        Alert.alert('Error', 'Failed to upload photo. Please try again.');
        return;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success! 🎉', 'Your Rewind has been shared!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Error uploading:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Preview modal after capturing
  if (capturedImage) {
    return (
      <View style={styles.previewContainer}>
        <View style={styles.previewHeader}>
          <HandwrittenText size={28} bold>Your Rewind</HandwrittenText>
        </View>

        <View style={styles.previewContent}>
          <PolaroidFrame
            imageUri={capturedImage}
            caption={caption}
            date={new Date()}
            showRainbow={true}
            width={340}
          />

          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.captionContainer}
          >
            <TextInput
              style={styles.captionInput}
              placeholder="Add a caption..."
              placeholderTextColor="#999"
              value={caption}
              onChangeText={setCaption}
              maxLength={100}
              multiline
            />
          </KeyboardAvoidingView>
        </View>

        <View style={styles.previewActions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.retakeButton]} 
            onPress={retakePicture}
            disabled={uploading}
          >
            <Text style={styles.actionButtonText}>Retake</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.shareButton]} 
            onPress={handleUpload}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.actionButtonText}>Share 📸</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Camera view
  return (
    <View style={styles.container}>
      {/* Polaroid Camera Frame */}
      <View style={styles.cameraFrame}>
        {/* Rainbow stripe at top */}
        <View style={styles.rainbowContainer}>
          <View style={styles.rainbowStripe}>
            <View style={[styles.stripe, { backgroundColor: '#FF6B6B' }]} />
            <View style={[styles.stripe, { backgroundColor: '#FFA500' }]} />
            <View style={[styles.stripe, { backgroundColor: '#FFD93D' }]} />
            <View style={[styles.stripe, { backgroundColor: '#6BCB77' }]} />
            <View style={[styles.stripe, { backgroundColor: '#4D96FF' }]} />
            <View style={[styles.stripe, { backgroundColor: '#9D84B7' }]} />
          </View>
        </View>

        <CameraView 
          style={styles.camera}
          facing={facing}
          ref={cameraRef}
        />
      </View>

      {/* Polaroid branding */}
      <View style={styles.brandingContainer}>
        <HandwrittenText size={32} bold>Rewind</HandwrittenText>
        <Text style={styles.tagline}>Capture the moment</Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity 
          style={styles.flipButton} 
          onPress={toggleCameraFacing}
        >
          <Text style={styles.flipIcon}>🔄</Text>
        </TouchableOpacity>

        <CameraButton onPress={takePicture} />

        <View style={{ width: 60 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F0',
    justifyContent: 'center',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  permissionButton: {
    backgroundColor: '#FF4444',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cameraFrame: {
    margin: 20,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  rainbowContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  rainbowStripe: {
    flexDirection: 'row',
    width: 60,
    height: 8,
    borderRadius: 2,
    overflow: 'hidden',
  },
  stripe: {
    flex: 1,
  },
  camera: {
    aspectRatio: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  brandingContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  tagline: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    letterSpacing: 1,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 30,
  },
  flipButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  flipIcon: {
    fontSize: 28,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#F5F5F0',
    paddingTop: 60,
  },
  previewHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  previewContent: {
    alignItems: 'center',
  },
  captionContainer: {
    width: '100%',
    paddingHorizontal: 40,
    marginTop: 20,
  },
  captionInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    minHeight: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    paddingHorizontal: 40,
    marginTop: 30,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  retakeButton: {
    backgroundColor: '#666',
  },
  shareButton: {
    backgroundColor: '#FF4444',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
