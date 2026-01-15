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
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import CameraButton from '../components/CameraButton';
import PolaroidFrame from '../components/PolaroidFrame';
import HandwrittenText from '../components/HandwrittenText';
import StyleDial, { PhotoStyle } from '../components/StyleDial';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { uploadPhoto } from '../services/photos';
import { getCurrentUser } from '../services/auth';
import { hasPostedToday, recordDailyPost, getTimeUntilNextPost, formatTimeRemaining } from '../services/dailyPost';
import { savePreferredPostHour } from '../services/notificationPreferences';
import { scheduleSmartDailyNotification } from '../services/notifications';
import * as Haptics from 'expo-haptics';

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [photoStyle, setPhotoStyle] = useState<PhotoStyle>('polaroid');
  const [alreadyPosted, setAlreadyPosted] = useState(false);
  const [timeUntilNext, setTimeUntilNext] = useState({ hours: 0, minutes: 0 });
  const [checkingStatus, setCheckingStatus] = useState(true);
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();

  // Request permissions on mount
  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  // Check daily post status on mount
  useEffect(() => {
    checkDailyPostStatus();
    updateTimeRemaining();
    
    // Update countdown every minute
    const interval = setInterval(() => {
      updateTimeRemaining();
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const checkDailyPostStatus = async () => {
    const { user } = await getCurrentUser();
    if (user) {
      const { hasPosted } = await hasPostedToday(user.id);
      setAlreadyPosted(hasPosted);
    }
    setCheckingStatus(false);
  };

  const updateTimeRemaining = () => {
    const time = getTimeUntilNextPost();
    setTimeUntilNext(time);
  };

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
    // Check if user has already posted today
    if (alreadyPosted) {
      Alert.alert(
        '📸 Already Posted Today!',
        `You've already shared your Rewind for today.\n\nNext post available in ${formatTimeRemaining(timeUntilNext.hours, timeUntilNext.minutes)}`,
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

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

      // Record daily post
      if (photo) {
        await recordDailyPost(user.id, photo.id);
        setAlreadyPosted(true);

        // Save preferred posting hour for smart notifications
        const currentHour = new Date().getHours();
        await savePreferredPostHour(user.id, currentHour);
        
        // Reschedule daily notification based on this time
        await scheduleSmartDailyNotification(currentHour);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Navigate to feed after successful upload
      router.replace('/(tabs)');
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
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.previewContainer}>
          <TouchableOpacity 
            style={styles.previewBackButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backIcon}>✕</Text>
          </TouchableOpacity>
          
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
      </TouchableWithoutFeedback>
    );
  }

  // Camera view
  return (
    <View style={styles.container}>
      {/* Back button */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backIcon}>✕</Text>
      </TouchableOpacity>

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

      {/* Daily Post Status Banner */}
      {!checkingStatus && alreadyPosted && (
        <View style={styles.statusBanner}>
          <IconSymbol name="checkmark.circle.fill" size={20} color="#4CAF50" />
          <Text style={styles.statusText}>
            Posted today! Next in {formatTimeRemaining(timeUntilNext.hours, timeUntilNext.minutes)}
          </Text>
        </View>
      )}

      {/* Polaroid branding */}
      <View style={styles.brandingContainer}>
        <HandwrittenText size={32} bold>Rewind</HandwrittenText>
        <Text style={styles.tagline}>
          {alreadyPosted ? 'See you tomorrow!' : 'Capture the moment'}
        </Text>
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

        <View style={styles.dialContainer}>
          <StyleDial 
            selectedStyle={photoStyle}
            onStyleChange={setPhotoStyle}
          />
        </View>
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
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  backIcon: {
    fontSize: 24,
    color: '#333',
    fontWeight: '600',
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
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginTop: 10,
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#2C5F2D',
    fontWeight: '600',
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
  dialContainer: {
    width: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#F5F5F0',
    paddingTop: 60,
  },
  previewBackButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
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
    fontSize: 18,
    color: '#333',
    minHeight: 80,
    textAlignVertical: 'top',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    fontWeight: '500',
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
