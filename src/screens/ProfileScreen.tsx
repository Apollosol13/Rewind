import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  Image,
  FlatList,
  Modal,
  SafeAreaView,
  ActionSheetIOS,
  Platform,
  TextInput,
  KeyboardAvoidingView,
  Dimensions,
  TouchableWithoutFeedback,
  Keyboard,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import HandwrittenText from '../components/HandwrittenText';
import PolaroidFrame from '../components/PolaroidFrame';
import { getCurrentUser, getUserProfile, signOut, updateUserProfile, uploadProfilePicture } from '../services/auth';
import { getUserPhotos, deletePhoto } from '../services/photos';
import { getUserStickyNotes, createStickyNote, deleteStickyNote, StickyNote as StickyNoteType } from '../services/stickyNotes';
import { getFollowerCount, getFollowingCount } from '../services/follows';
import { getNewFollowersCount } from '../services/followerBadge';
import { Photo, User } from '../config/supabase';
import StickyNote from '../components/StickyNote';
import {
  scheduleDailyNotification,
  requestNotificationPermissions,
} from '../services/notifications';
import { IconSymbol } from '../../components/ui/icon-symbol';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MonthlyPhotos {
  month: string;
  year: number;
  monthNumber: number;
  photos: Photo[];
}

export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [stickyNotes, setStickyNotes] = useState<StickyNoteType[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [newFollowersCount, setNewFollowersCount] = useState(0);
  const [monthlyPhotos, setMonthlyPhotos] = useState<MonthlyPhotos[]>([]);
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [selectedNote, setSelectedNote] = useState<StickyNoteType | null>(null);
  const [noteText, setNoteText] = useState('');
  const [noteColor, setNoteColor] = useState('yellow');
  const [editUsername, setEditUsername] = useState('');
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [uploading, setUploading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const router = useRouter();

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (photos.length > 0) {
      organizePhotosByMonth();
    }
  }, [photos]);

  const organizePhotosByMonth = () => {
    const grouped = photos.reduce((acc, photo) => {
      const date = new Date(photo.created_at);
      const year = date.getFullYear();
      const month = date.getMonth();
      const monthName = date.toLocaleDateString('en-US', { month: 'long' });
      const key = `${year}-${month}`;

      if (!acc[key]) {
        acc[key] = {
          month: monthName,
          year,
          monthNumber: month,
          photos: [],
        };
      }
      acc[key].photos.push(photo);
      return acc;
    }, {} as Record<string, MonthlyPhotos>);

    // Sort by year and month (most recent first)
    const sorted = Object.values(grouped).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.monthNumber - a.monthNumber;
    });

    setMonthlyPhotos(sorted);
  };

  const loadProfile = async () => {
    try {
      const { user: authUser } = await getCurrentUser();
      if (!authUser) {
        router.replace('/auth');
        return;
      }

      const { profile } = await getUserProfile(authUser.id);
      if (profile) {
        setUser(profile);
      }

      const { photos: userPhotos } = await getUserPhotos(authUser.id);
      if (userPhotos) {
        setPhotos(userPhotos);
      }

      const { notes } = await getUserStickyNotes(authUser.id);
      if (notes) {
        setStickyNotes(notes);
      }

      // Get follow counts
      const { count: followers } = await getFollowerCount(authUser.id);
      const { count: following } = await getFollowingCount(authUser.id);
      const { count: newFollowers } = await getNewFollowersCount(authUser.id);
      setFollowersCount(followers);
      setFollowingCount(following);
      setNewFollowersCount(newFollowers);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/auth');
        },
      },
    ]);
  };

  const enableNotifications = async () => {
    const { granted } = await requestNotificationPermissions();
    if (granted) {
      await scheduleDailyNotification();
      Alert.alert(
        'Notifications Enabled! 🔔',
        "You'll get a random daily reminder to capture your Rewind moment."
      );
    } else {
      Alert.alert(
        'Permission Denied',
        'Please enable notifications in your device settings.'
      );
    }
  };

  const openEditProfile = () => {
    setEditUsername(user?.username || '');
    setEditDisplayName(user?.display_name || '');
    setEditBio(user?.bio || '');
    setShowEditProfile(true);
    setShowSettingsMenu(false);
  };

  const handleUpdateProfile = async () => {
    if (!user || !editUsername.trim()) {
      Alert.alert('Error', 'Username cannot be empty');
      return;
    }

    setUploading(true);
    const { error } = await updateUserProfile(user.id, {
      username: editUsername.trim(),
      display_name: editDisplayName.trim() || editUsername.trim(),
      bio: editBio.trim(),
    });
    setUploading(false);

    if (error) {
      Alert.alert('Error', 'Failed to update profile. Username might be taken.');
      return;
    }

    // Reload profile
    await loadProfile();
    setShowEditProfile(false);
    Alert.alert('Success', 'Profile updated!');
  };

  const handleAddStickyNote = async () => {
    if (!user || !noteText.trim()) {
      Alert.alert('Error', 'Note cannot be empty');
      return;
    }

    setUploading(true);
    const { note, error } = await createStickyNote(user.id, noteText.trim(), noteColor);
    setUploading(false);

    if (error) {
      Alert.alert('Error', 'Failed to create note');
      return;
    }

    if (note) {
      setStickyNotes([note, ...stickyNotes]);
    }

    setNoteText('');
    setNoteColor('yellow');
    setShowAddNote(false);
  };

  const handleDeleteStickyNote = async (noteId: string) => {
    if (!user) return;

    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await deleteStickyNote(noteId, user.id);
            if (!error) {
              setStickyNotes(stickyNotes.filter(n => n.id !== noteId));
            }
          },
        },
      ]
    );
  };

  const handlePickProfilePicture = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0] && user) {
      setUploading(true);
      const { avatarUrl, error } = await uploadProfilePicture(user.id, result.assets[0].uri);
      setUploading(false);

      if (error) {
        Alert.alert('Error', 'Failed to upload profile picture');
        return;
      }

      // Reload profile
      await loadProfile();
      Alert.alert('Success', 'Profile picture updated!');
    }
  };

  const showSettingsOptions = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Edit Profile', 'Add Sticky Note', 'Notification Settings', 'Privacy Policy', 'Terms of Service', 'Sign Out'],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 6,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            openEditProfile();
          } else if (buttonIndex === 2) {
            setShowAddNote(true);
          } else if (buttonIndex === 3) {
            router.push('/notification-settings');
          } else if (buttonIndex === 4) {
            Linking.openURL('https://apollosol13.github.io/rewind-privacy-policy/');
          } else if (buttonIndex === 5) {
            Linking.openURL('https://apollosol13.github.io/rewind-privacy-policy/terms.html');
          } else if (buttonIndex === 6) {
            handleSignOut();
          }
        }
      );
    } else {
      setShowSettingsMenu(true);
    }
  };

  const showPhotoOptions = () => {
    if (!selectedPhoto || !user) return;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Delete Rewind'],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            confirmDelete(selectedPhoto.id);
          }
        }
      );
    } else {
      // Android fallback
      Alert.alert(
        'Photo Options',
        'What would you like to do?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete Rewind',
            style: 'destructive',
            onPress: () => confirmDelete(selectedPhoto.id),
          },
        ]
      );
    }
  };

  const confirmDelete = (photoId: string) => {
    Alert.alert(
      'Delete Rewind',
      'Are you sure? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!user) return;

            const { error } = await deletePhoto(photoId, user.id);
            if (error) {
              Alert.alert('Error', 'Failed to delete photo. Please try again.');
              return;
            }

            // Remove from local state
            setPhotos(photos.filter(p => p.id !== photoId));
            setSelectedPhoto(null);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Settings Menu Button */}
      <TouchableOpacity 
        style={styles.settingsButton}
        onPress={showSettingsOptions}
      >
        <IconSymbol name="ellipsis.circle.fill" size={28} color="#333" />
      </TouchableOpacity>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header with Profile Picture */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handlePickProfilePicture}>
            {user?.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.profilePicture} />
            ) : (
              <View style={styles.profilePicturePlaceholder}>
                <IconSymbol name="person.circle.fill" size={80} color="#DDD" />
              </View>
            )}
            <View style={styles.editBadge}>
              <IconSymbol name="camera.fill" size={14} color="#FFF" />
            </View>
          </TouchableOpacity>
          
          <HandwrittenText size={36} bold>
            @{user?.username || 'username'}
          </HandwrittenText>
          
          {user?.bio && (
            <Text style={styles.bio}>{user.bio}</Text>
          )}

          {/* Stats Row */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{photos.length}</Text>
              <Text style={styles.statLabel}>Rewinds</Text>
            </View>
            <View style={styles.statDivider} />
            <TouchableOpacity 
              style={styles.statItem}
              onPress={() => user && router.push(`/follow-list?userId=${user.id}&tab=followers`)}
            >
              <View style={styles.statBadgeContainer}>
                <Text style={styles.statNumber}>{followersCount}</Text>
                {newFollowersCount > 0 && (
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
              onPress={() => user && router.push(`/follow-list?userId=${user.id}&tab=following`)}
            >
              <Text style={styles.statNumber}>{followingCount}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bulletin Board - Monthly View */}
        <View style={styles.bulletinSection}>
          {monthlyPhotos.length > 0 && (
            <>
              {/* Month Navigation */}
              <View style={styles.monthNavigation}>
                <TouchableOpacity 
                  onPress={() => setCurrentMonthIndex(Math.min(currentMonthIndex + 1, monthlyPhotos.length - 1))}
                  disabled={currentMonthIndex >= monthlyPhotos.length - 1}
                  style={styles.navButton}
                >
                  <IconSymbol 
                    name="chevron.left" 
                    size={24} 
                    color={currentMonthIndex >= monthlyPhotos.length - 1 ? '#CCC' : '#333'} 
                  />
                </TouchableOpacity>
                
                <View style={styles.monthLabel}>
                  <HandwrittenText size={28} bold>
                    {monthlyPhotos[currentMonthIndex]?.month} {monthlyPhotos[currentMonthIndex]?.year}
                  </HandwrittenText>
                </View>
                
                <TouchableOpacity 
                  onPress={() => setCurrentMonthIndex(Math.max(currentMonthIndex - 1, 0))}
                  disabled={currentMonthIndex <= 0}
                  style={styles.navButton}
                >
                  <IconSymbol 
                    name="chevron.right" 
                    size={24} 
                    color={currentMonthIndex <= 0 ? '#CCC' : '#333'} 
                  />
                </TouchableOpacity>
              </View>

              {/* Bulletin Board */}
              <View 
                style={[
                  styles.bulletinBoard, 
                  { 
                    height: Math.max(
                      600, 
                      Math.ceil(((monthlyPhotos[currentMonthIndex]?.photos.length || 0) + stickyNotes.length) / 2) * 260 + 80
                    )
                  }
                ]}
              >
                {/* Render Photos */}
                {monthlyPhotos[currentMonthIndex]?.photos.map((photo, index) => {
                  const col = index % 2;
                  const row = Math.floor(index / 2);
                  const rotations = [-4, 3, -3, 5, -2, 4]; // Random-looking rotations
                  
                  return (
                    <TouchableOpacity
                      key={photo.id}
                      style={[
                        styles.pinnedPolaroid,
                        {
                          transform: [
                            { rotate: `${rotations[index % rotations.length]}deg` },
                          ],
                          left: col === 0 ? '8%' : '52%',
                          top: row * 260 + 20,
                        },
                      ]}
                      onPress={() => setSelectedPhoto(photo)}
                    >
                    {/* Tape */}
                    <View style={[
                      styles.tape, 
                      { 
                        transform: [{ rotate: `${(index % 2 === 0 ? -3 : 3)}deg` }],
                        opacity: 0.85 + (index % 3) * 0.05, // Slight variation in opacity
                      }
                    ]} />
                    
                    {/* Polaroid */}
                    <View style={styles.polaroidContainer}>
                      <View style={styles.imageWrapper}>
                        <Image
                          source={{ uri: photo.image_url }}
                          style={styles.polaroidImage}
                        />
                        {/* Vintage overlay */}
                        <View style={styles.vintageOverlay} />
                        {/* Vignette effect */}
                        <View style={styles.vignette} />
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
                
                {/* Render Sticky Notes */}
                {stickyNotes.map((note, index) => {
                  const photoCount = monthlyPhotos[currentMonthIndex]?.photos.length || 0;
                  const totalIndex = photoCount + index;
                  const col = totalIndex % 2;
                  const row = Math.floor(totalIndex / 2);
                  const rotations = [-4, 3, -3, 5, -2, 4];
                  
                  return (
                    <TouchableOpacity
                      key={note.id}
                      style={[
                        styles.pinnedStickyNote,
                        {
                          transform: [
                            { rotate: `${rotations[totalIndex % rotations.length]}deg` },
                          ],
                          left: col === 0 ? '8%' : '52%',
                          top: row * 260 + 20,
                        },
                      ]}
                      onPress={() => setSelectedNote(note)}
                      activeOpacity={0.8}
                    >
                      {/* Tape */}
                      <View style={[
                        styles.tape, 
                        { 
                          transform: [{ rotate: `${(totalIndex % 2 === 0 ? -3 : 3)}deg` }],
                          opacity: 0.85 + (totalIndex % 3) * 0.05,
                        }
                      ]} />
                      
                      {/* Sticky Note */}
                      <StickyNote
                        text={note.text}
                        color={note.color}
                        onDelete={() => handleDeleteStickyNote(note.id)}
                        truncate={true}
                        maxLines={4}
                        showDelete={false}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {photos.length === 0 && (
            <View style={styles.emptyState}>
              <IconSymbol name="camera" size={60} color="#DDD" />
              <Text style={styles.emptyText}>No Rewinds yet</Text>
              <Text style={styles.emptySubtext}>Start capturing memories!</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Android Settings Menu Modal */}
      {Platform.OS === 'android' && (
        <Modal
          visible={showSettingsMenu}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowSettingsMenu(false)}
        >
          <TouchableOpacity 
            style={styles.menuOverlay}
            activeOpacity={1}
            onPress={() => setShowSettingsMenu(false)}
          >
            <View style={styles.menuContainer}>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={openEditProfile}
              >
                <IconSymbol name="person.crop.circle" size={24} color="#333" />
                <Text style={styles.menuItemText}>Edit Profile</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => {
                  console.log('Add Sticky Note clicked');
                  setShowSettingsMenu(false);
                  setShowAddNote(true);
                  console.log('showAddNote set to true');
                }}
              >
                <IconSymbol name="note.text" size={24} color="#333" />
                <Text style={styles.menuItemText}>Add Sticky Note</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => {
                  setShowSettingsMenu(false);
                  router.push('/notification-settings');
                }}
              >
                <IconSymbol name="bell.badge.fill" size={24} color="#333" />
                <Text style={styles.menuItemText}>Notification Settings</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => {
                  setShowSettingsMenu(false);
                  Linking.openURL('https://apollosol13.github.io/rewind-privacy-policy/');
                }}
              >
                <IconSymbol name="lock.shield.fill" size={24} color="#333" />
                <Text style={styles.menuItemText}>Privacy Policy</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => {
                  setShowSettingsMenu(false);
                  Linking.openURL('https://apollosol13.github.io/rewind-privacy-policy/terms.html');
                }}
              >
                <IconSymbol name="doc.text.fill" size={24} color="#333" />
                <Text style={styles.menuItemText}>Terms of Service</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.menuItem, styles.menuItemDanger]}
                onPress={() => {
                  setShowSettingsMenu(false);
                  handleSignOut();
                }}
              >
                <IconSymbol name="rectangle.portrait.and.arrow.right" size={24} color="#FF4444" />
                <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Add Sticky Note Modal */}
      <Modal
        visible={showAddNote}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddNote(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.noteModalContainer}
        >
          <View style={styles.noteModalContent}>
            <View style={styles.noteModalHeader}>
                <TouchableOpacity onPress={() => setShowAddNote(false)}>
                  <IconSymbol name="xmark.circle.fill" size={28} color="#666" />
                </TouchableOpacity>
                <HandwrittenText size={24} bold>New Note</HandwrittenText>
                <TouchableOpacity 
                  onPress={handleAddStickyNote} 
                  disabled={uploading || !noteText.trim()}
                  style={styles.addButton}
                >
                  <Text style={[
                    styles.addButtonText, 
                    (!noteText.trim() || uploading) && styles.addButtonDisabled
                  ]}>
                    {uploading ? 'Adding...' : 'Add'}
                  </Text>
                </TouchableOpacity>
              </View>

            <ScrollView 
              style={styles.noteFormScroll}
              contentContainerStyle={styles.noteFormContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
                {/* Color Picker First */}
                <View style={styles.colorSection}>
                  <HandwrittenText size={16} bold>Pick a color</HandwrittenText>
                  <View style={styles.colorPickerRow}>
                    {['yellow', 'pink', 'blue', 'green', 'orange'].map((color) => {
                      const bgColor = color === 'yellow' ? '#FEFF9C' : 
                                     color === 'pink' ? '#FFB5E8' : 
                                     color === 'blue' ? '#AFF8DB' : 
                                     color === 'green' ? '#B5F5B5' : '#FFD5A3';
                      return (
                        <TouchableOpacity
                          key={color}
                          style={[
                            styles.colorOptionLarge,
                            { backgroundColor: bgColor },
                            noteColor === color && styles.colorOptionSelected,
                          ]}
                          onPress={() => setNoteColor(color)}
                        >
                          {noteColor === color && (
                            <IconSymbol name="checkmark.circle.fill" size={24} color="#333" />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Sticky Note Preview */}
                <View style={styles.previewSection}>
                  <HandwrittenText size={16} bold>Write your note</HandwrittenText>
                  <View style={[
                    styles.stickyNotePreview,
                    { 
                      backgroundColor: noteColor === 'yellow' ? '#FEFF9C' : 
                                      noteColor === 'pink' ? '#FFB5E8' : 
                                      noteColor === 'blue' ? '#AFF8DB' : 
                                      noteColor === 'green' ? '#B5F5B5' : '#FFD5A3'
                    }
                  ]}>
                    <TextInput
                      style={styles.stickyNoteInput}
                      value={noteText}
                      onChangeText={setNoteText}
                      placeholder="What's on your mind?"
                      placeholderTextColor="rgba(0,0,0,0.3)"
                      maxLength={200}
                      multiline
                      textAlignVertical="top"
                      autoFocus
                    />
                    <View style={styles.noteBottomShadow} />
                  </View>
                  <Text style={styles.charCountNote}>{noteText.length}/200</Text>
                </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* View Sticky Note Modal */}
      <Modal
        visible={!!selectedNote}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setSelectedNote(null)}
      >
        <View style={styles.viewNoteModalContainer}>
          <View style={styles.viewNoteContent}>
            <View style={styles.viewNoteHeader}>
              <TouchableOpacity onPress={() => setSelectedNote(null)}>
                <IconSymbol name="xmark.circle.fill" size={32} color="#666" />
              </TouchableOpacity>
              {selectedNote && (
                <TouchableOpacity onPress={() => {
                  handleDeleteStickyNote(selectedNote.id);
                  setSelectedNote(null);
                }}>
                  <IconSymbol name="trash.fill" size={24} color="#FF4444" />
                </TouchableOpacity>
              )}
            </View>
            
            {selectedNote && (
              <ScrollView 
                style={styles.viewNoteScroll}
                contentContainerStyle={styles.viewNoteScrollContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={[
                  styles.expandedStickyNote,
                  { 
                    backgroundColor: selectedNote.color === 'yellow' ? '#FEFF9C' : 
                                    selectedNote.color === 'pink' ? '#FFB5E8' : 
                                    selectedNote.color === 'blue' ? '#AFF8DB' : 
                                    selectedNote.color === 'green' ? '#B5F5B5' : '#FFD5A3'
                  }
                ]}>
                  <HandwrittenText size={20} style={styles.expandedNoteText}>
                    {selectedNote.text}
                  </HandwrittenText>
                  <View style={styles.expandedNoteShadow} />
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditProfile}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditProfile(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.editModalContainer}
        >
          <SafeAreaView style={styles.editModalContent}>
            <View style={styles.editModalHeader}>
              <TouchableOpacity onPress={() => setShowEditProfile(false)}>
                <Text style={styles.editModalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.editModalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={handleUpdateProfile} disabled={uploading}>
                <Text style={[styles.editModalSave, uploading && styles.editModalSaveDisabled]}>
                  {uploading ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.editFormScroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.editForm}>
              <TouchableOpacity 
                style={styles.editProfilePictureContainer}
                onPress={handlePickProfilePicture}
                disabled={uploading}
              >
                {user?.avatar_url ? (
                  <Image source={{ uri: user.avatar_url }} style={styles.editProfilePicture} />
                ) : (
                  <View style={styles.editProfilePicturePlaceholder}>
                    <IconSymbol name="person.circle.fill" size={60} color="#DDD" />
                  </View>
                )}
                <View style={styles.editProfileBadge}>
                  <IconSymbol name="camera.fill" size={18} color="#FFF" />
                </View>
              </TouchableOpacity>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Username</Text>
                <TextInput
                  style={styles.input}
                  value={editUsername}
                  onChangeText={setEditUsername}
                  placeholder="username"
                  autoCapitalize="none"
                  maxLength={30}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Display Name</Text>
                <TextInput
                  style={styles.input}
                  value={editDisplayName}
                  onChangeText={setEditDisplayName}
                  placeholder="Display Name"
                  maxLength={50}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Bio</Text>
                <TextInput
                  style={[styles.input, styles.bioInput]}
                  value={editBio}
                  onChangeText={setEditBio}
                  placeholder="Tell us about yourself..."
                  maxLength={150}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
                <Text style={styles.charCount}>{editBio.length}/150</Text>
              </View>
            </View>
            </TouchableWithoutFeedback>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Photo Detail Modal */}
      <Modal
        visible={!!selectedPhoto}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.modalBackButton}
            onPress={() => setSelectedPhoto(null)}
          >
            <Text style={styles.modalCloseIcon}>✕</Text>
          </TouchableOpacity>

          {selectedPhoto && (
            <View style={styles.modalContent}>
              <View style={styles.photoWrapper}>
                <PolaroidFrame
                  imageUri={selectedPhoto.image_url}
                  caption={selectedPhoto.caption}
                  date={selectedPhoto.created_at}
                  showRainbow={true}
                  width={340}
                />
                
                <TouchableOpacity
                  style={styles.menuButton}
                  onPress={showPhotoOptions}
                >
                  <Text style={styles.menuIcon}>⋮</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
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
  scrollContent: {
    paddingBottom: 40,
  },
  settingsButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 10,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 20,
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
    color: '#FF4444',
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
    backgroundColor: '#FF4444',
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
    marginBottom: 16,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  editBadge: {
    position: 'absolute',
    bottom: 16,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  section: {
    padding: 20,
  },
  bulletinSection: {
    marginTop: 10,
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
  },
  navButton: {
    padding: 8,
  },
  monthLabel: {
    flex: 1,
    alignItems: 'center',
  },
  bulletinBoard: {
    backgroundColor: '#B8956A', // Darker, more aged cork color
    padding: 20,
    position: 'relative',
    borderRadius: 8,
    marginHorizontal: 10,
    marginTop: 10,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 8,
    borderColor: '#8B7355', // Dark wood frame
  },
  pinnedPolaroid: {
    position: 'absolute',
    width: '40%',
    zIndex: 1,
  },
  pinnedStickyNote: {
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
    backgroundColor: 'rgba(255, 250, 220, 0.7)', // Semi-transparent cream/beige
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
    backgroundColor: '#F8F6F0', // Aged cream color
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
    overflow: 'hidden',
  },
  polaroidImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F0F0F0',
  },
  vintageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 220, 150, 0.15)', // Warm sepia tone
  },
  vignette: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  polaroidCaption: {
    marginTop: 6,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#BBB',
    marginTop: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  modalCloseIcon: {
    fontSize: 24,
    color: '#333',
    fontWeight: '600',
  },
  modalContent: {
    alignItems: 'center',
  },
  photoWrapper: {
    position: 'relative',
  },
  menuButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  menuIcon: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    lineHeight: 24,
  },
  // Settings Menu (Android)
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 20,
  },
  menuContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    fontWeight: '500',
  },
  menuItemDanger: {
    borderBottomWidth: 0,
  },
  menuItemTextDanger: {
    color: '#FF4444',
  },
  // Edit Profile Modal
  editModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  editModalContent: {
    backgroundColor: '#F5F5F0',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: '80%',
  },
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  editModalCancel: {
    fontSize: 16,
    color: '#666',
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  editModalSave: {
    fontSize: 16,
    color: '#FF4444',
    fontWeight: '600',
  },
  editModalSaveDisabled: {
    color: '#CCC',
  },
  editFormScroll: {
    flex: 1,
  },
  editForm: {
    padding: 20,
  },
  editProfilePictureContainer: {
    alignSelf: 'center',
    marginBottom: 30,
  },
  editProfilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  editProfilePicturePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFF',
  },
  editProfileBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFF',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  bioInput: {
    minHeight: 80,
    paddingTop: 12,
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  colorPicker: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  colorOptionSelected: {
    borderColor: '#333',
    borderWidth: 3,
    transform: [{ scale: 1.1 }],
  },
  // Sticky Note Modal
  noteModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  noteModalContent: {
    backgroundColor: '#F5F5F0',
    borderRadius: 20,
    width: '100%',
    maxHeight: '80%',
    minHeight: 400,
  },
  noteModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  addButton: {
    backgroundColor: '#FF4444',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  noteFormScroll: {
    flex: 1,
  },
  noteFormContent: {
    padding: 16,
    paddingBottom: 30,
  },
  colorSection: {
    marginBottom: 20,
  },
  colorPickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 10,
  },
  colorOptionLarge: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  previewSection: {
    marginBottom: 16,
  },
  stickyNotePreview: {
    minHeight: 160,
    marginTop: 12,
    padding: 16,
    paddingTop: 20,
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    position: 'relative',
  },
  stickyNoteInput: {
    fontSize: 17,
    fontFamily: 'Caveat_700Bold',
    color: '#333',
    lineHeight: 26,
    minHeight: 120,
  },
  noteBottomShadow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  charCountNote: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 6,
    fontWeight: '500',
  },
  // View Sticky Note Modal
  viewNoteModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  viewNoteContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%',
  },
  viewNoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  viewNoteScroll: {
    maxHeight: 500,
  },
  viewNoteScrollContent: {
    padding: 20,
  },
  expandedStickyNote: {
    padding: 24,
    borderRadius: 4,
    minHeight: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  expandedNoteText: {
    color: '#333',
    lineHeight: 32,
  },
  expandedNoteShadow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
});
