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
import { CameraView, CameraType, FlashMode, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import CameraButton from '../components/CameraButton';
import PolaroidFrame from '../components/PolaroidFrame';
import HandwrittenText from '../components/HandwrittenText';
import StyleDial, { PhotoStyle } from '../components/StyleDial';
import CamcorderOverlay from '../components/CamcorderOverlay';
import FilterOverlay from '../components/FilterOverlay';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { uploadPhoto } from '../services/photos';
import { uploadPhotoToBackend } from '../services/backendApi';
import { shouldShowFilterOverlay } from '../utils/filterPresets';
import { getCurrentUser } from '../services/auth';
import { hasPostedToday, recordDailyPost, getTimeUntilNextPost, formatTimeRemaining } from '../services/dailyPost';
import { savePreferredPostHour } from '../services/notificationPreferences';
import { scheduleSmartDailyNotification } from '../services/notifications';
import * as Haptics from 'expo-haptics';

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
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

  // TEMPORARILY DISABLED FOR TESTING - Check daily post status on mount
  useEffect(() => {
    // checkDailyPostStatus();
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
    // TEMPORARILY DISABLED FOR TESTING - Check if user has already posted today
    // if (alreadyPosted) {
    //   Alert.alert(
    //     '📸 Already Posted Today!',
    //     `You've already shared your Rewind for today.\n\nNext post available in ${formatTimeRemaining(timeUntilNext.hours, timeUntilNext.minutes)}`,
    //     [{ text: 'OK', style: 'default' }]
    //   );
    //   return;
    // }

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

      console.log('📸 Uploading photo via backend...');
      
      // Upload to backend (includes compression and Supabase storage)
      const photo = await uploadPhotoToBackend(
        capturedImage,
        caption,
        photoStyle
      );
      
      console.log(`✅ Photo uploaded! Compression: ${photo.processing?.savings || 'N/A'}`);
      
      if (!photo) {
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

  const toggleFlash = () => {
    setFlash(current => current === 'off' ? 'on' : 'off');
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
            <HandwrittenText size={28} bold style={{ paddingHorizontal: 10 }}>Your REWND</HandwrittenText>
          </View>

          <View style={styles.previewContent}>
            <View style={styles.previewImageContainer}>
              <PolaroidFrame
                imageUri={capturedImage}
                caption={caption}
                date={new Date()}
                showRainbow={true}
                width={340}
                filterId={photoStyle}
              />
            </View>

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

  // Polaroid Camera UI
  return (
    <View style={styles.container}>
      {/* Polaroid Camera Body */}
      <View style={styles.polaroidBody}>
        {/* Top Section - Viewfinder & Controls */}
        <View style={styles.topSection}>
          {/* Back button (subtle) */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backIcon}>✕</Text>
          </TouchableOpacity>

          {/* REWND Branding */}
          <View style={styles.brandingTop}>
            <HandwrittenText size={24} bold style={styles.brandText}>REWND</HandwrittenText>
          </View>

          {/* Flash Toggle */}
          <TouchableOpacity 
            style={styles.flashToggle} 
            onPress={toggleFlash}
          >
            <View style={[
              styles.flashToggleTrack,
              flash !== 'off' && styles.flashToggleTrackActive
            ]}>
              <View style={[
                styles.flashToggleThumb,
                flash !== 'off' && styles.flashToggleThumbActive
              ]}>
                <Text style={styles.flashToggleIcon}>⚡</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Rainbow Stripe */}
        <View style={styles.rainbowStripe}>
          <View style={[styles.stripe, { backgroundColor: '#FF5757' }]} />
          <View style={[styles.stripe, { backgroundColor: '#FFA500' }]} />
          <View style={[styles.stripe, { backgroundColor: '#FFD93D' }]} />
          <View style={[styles.stripe, { backgroundColor: '#6BCB77' }]} />
          <View style={[styles.stripe, { backgroundColor: '#4D96FF' }]} />
          <View style={[styles.stripe, { backgroundColor: '#9D84B7' }]} />
        </View>

        {/* LCD Screen */}
        <View style={styles.lcdFrame}>
          <CameraView 
            style={styles.camera}
            facing={facing}
            flash={flash}
            ref={cameraRef}
          />

          {/* Filter overlay - applies image effects for all filters */}
          <FilterOverlay filterId={photoStyle} />
          
          {/* Camcorder UI overlay - REC indicator, frame corners, etc. */}
          {shouldShowFilterOverlay(photoStyle) && (
            <CamcorderOverlay timestamp={new Date()} />
          )}
        </View>

        {/* TEMPORARILY DISABLED FOR TESTING - Daily Post Status */}
        {/* {!checkingStatus && alreadyPosted && (
          <View style={styles.statusBanner}>
            <Text style={styles.statusTextSmall}>
              ✓ Posted • Next in {formatTimeRemaining(timeUntilNext.hours, timeUntilNext.minutes)}
            </Text>
          </View>
        )} */}

        {/* Bottom Controls Section */}
        <View style={styles.controlsSection}>
          {/* Filter Mode Dial */}
          <View style={styles.modeDialSection}>
            <StyleDial 
              selectedStyle={photoStyle}
              onStyleChange={setPhotoStyle}
            />
          </View>

          {/* Big Shutter Button */}
          <View style={styles.shutterSection}>
            <TouchableOpacity 
              style={styles.bigShutterButton}
              onPress={takePicture}
              activeOpacity={0.7}
            >
              <View style={styles.shutterButtonInner} />
            </TouchableOpacity>
          </View>

          {/* Flip Camera Button */}
          <TouchableOpacity 
            style={styles.flipCameraButton}
            onPress={toggleCameraFacing}
          >
            <Text style={styles.flipCameraText}>🔄</Text>
          </TouchableOpacity>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8E5DC',
  },
  polaroidBody: {
    flex: 1,
    width: '100%',
    backgroundColor: '#E8E5DC',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 15,
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 18,
    color: '#333',
    fontWeight: '600',
  },
  brandingTop: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 10,
    overflow: 'visible',
  },
  brandText: {
    color: '#333',
    paddingRight: 8,
  },
  flashToggle: {
    padding: 4,
  },
  flashToggleTrack: {
    width: 52,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  flashToggleTrackActive: {
    backgroundColor: '#FFD93D',
  },
  flashToggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  flashToggleThumbActive: {
    alignSelf: 'flex-end',
  },
  flashToggleIcon: {
    fontSize: 14,
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
    backgroundColor: '#FF5757',
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
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  stripe: {
    flex: 1,
  },
  lcdFrame: {
    width: '100%',
    aspectRatio: 0.85,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 6,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  camera: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  statusBanner: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  statusTextSmall: {
    fontSize: 11,
    color: '#2C5F2D',
    fontWeight: '600',
  },
  controlsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 25,
    paddingHorizontal: 10,
    marginTop: 20,
  },
  modeDialSection: {
    alignItems: 'center',
    flex: 1,
  },
  modeLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#666',
    marginBottom: 4,
    letterSpacing: 1,
  },
  shutterSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  bigShutterButton: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    backgroundColor: '#FF5757',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF5757',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 4,
    borderColor: '#FFF',
  },
  shutterButtonInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FF3333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  flipCameraButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  flipCameraText: {
    fontSize: 24,
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
  previewImageContainer: {
    position: 'relative',
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
    backgroundColor: '#FF5757',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
