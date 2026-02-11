import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import HandwrittenText from '../components/HandwrittenText';
import StickyNote from '../components/StickyNote';
import { IconSymbol } from '../../components/ui/icon-symbol';
import {
  getInbox,
  getSentMessages,
  getMutualFollowers,
  sendStickyMessage,
  deleteStickyMessage,
  markMessageAsRead,
  StickyMessage,
} from '../services/stickyMessages';
import { getCurrentUser } from '../services/auth';
import { supabase } from '../config/supabase';

type Tab = 'inbox' | 'sent';

export default function MessagesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>('inbox');
  const [inboxMessages, setInboxMessages] = useState<StickyMessage[]>([]);
  const [sentMessages, setSentMessages] = useState<StickyMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<StickyMessage | null>(null);
  const [showComposeModal, setShowComposeModal] = useState(false);

  useEffect(() => {
    loadMessages();
  }, [activeTab]);

  // Handle opening specific message from notification
  useEffect(() => {
    const openMessageFromNotification = async () => {
      if (!params.openMessageId) return;
      
      console.log('📬 Attempting to open message from notification:', params.openMessageId);
      
      // First check if message is already loaded in inbox
      const messageInInbox = inboxMessages.find(m => m.id === params.openMessageId);
      if (messageInInbox) {
        console.log('✅ Found message in inbox, opening...');
        handleMessagePress(messageInInbox);
        return;
      }
      
      // If not in loaded messages, fetch directly from database
      try {
        console.log('🔍 Message not in inbox, fetching from database...');
        const { data: message, error } = await supabase
          .from('sticky_messages')
          .select(`
            *,
            sender:sender_id (username, avatar_url)
          `)
          .eq('id', params.openMessageId)
          .single();
        
        if (error) throw error;
        
        if (message) {
          console.log('✅ Fetched message, opening...');
          // Make sure we're on inbox tab since this is a received message
          setActiveTab('inbox');
          handleMessagePress(message as StickyMessage);
        }
      } catch (error) {
        console.error('❌ Error fetching message:', error);
      }
    };
    
    openMessageFromNotification();
  }, [params.openMessageId, inboxMessages]);

  const loadMessages = async () => {
    try {
      const { user } = await getCurrentUser();
      if (!user) return;

      setCurrentUserId(user.id);

      if (activeTab === 'inbox') {
        const { messages } = await getInbox(user.id);
        setInboxMessages(messages);
      } else {
        const { messages } = await getSentMessages(user.id);
        setSentMessages(messages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadMessages();
  };

  const handleMessagePress = async (message: StickyMessage) => {
    setSelectedMessage(message);
    
    // Mark as read if it's an inbox message and unread
    if (activeTab === 'inbox' && !message.is_read) {
      await markMessageAsRead(message.id);
      // Update local state
      setInboxMessages((prev) =>
        prev.map((m) => (m.id === message.id ? { ...m, is_read: true } : m))
      );
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this sticky note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteStickyMessage(messageId);
            setSelectedMessage(null);
            loadMessages(); // Refresh the list
          },
        },
      ]
    );
  };

  const messages = activeTab === 'inbox' ? inboxMessages : sentMessages;
  const unreadCount = inboxMessages.filter((m) => !m.is_read).length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitle}>
          <HandwrittenText size={32} bold>Messages</HandwrittenText>
        </View>
        <TouchableOpacity
          style={styles.composeButton}
          onPress={() => setShowComposeModal(true)}
        >
          <IconSymbol name="square.and.pencil" size={24} color="#EF4249" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'inbox' && styles.activeTab]}
          onPress={() => setActiveTab('inbox')}
        >
          <Text style={[styles.tabText, activeTab === 'inbox' && styles.activeTabText]}>
            Inbox
          </Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sent' && styles.activeTab]}
          onPress={() => setActiveTab('sent')}
        >
          <Text style={[styles.tabText, activeTab === 'sent' && styles.activeTabText]}>
            Sent
          </Text>
        </TouchableOpacity>
      </View>

      {/* Messages List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EF4249" />
        </View>
      ) : (
        <ScrollView
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol
                name={activeTab === 'inbox' ? 'tray' : 'paperplane'}
                size={60}
                color="#DDD"
              />
              <Text style={styles.emptyText}>
                {activeTab === 'inbox'
                  ? 'No messages yet'
                  : "You haven't sent any sticky notes"}
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => setShowComposeModal(true)}
              >
                <Text style={styles.emptyButtonText}>Send a Sticky Note</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.messagesGrid}>
              {messages.map((message) => (
                <TouchableOpacity
                  key={message.id}
                  style={styles.messageCard}
                  onPress={() => handleMessagePress(message)}
                >
                  {activeTab === 'inbox' && !message.is_read && (
                    <View style={styles.unreadDot} />
                  )}
                  <View style={styles.messageHeader}>
                    {activeTab === 'inbox' ? (
                      <Text style={styles.messageUsername}>
                        From: @{message.sender?.username || 'Unknown'}
                      </Text>
                    ) : (
                      <Text style={styles.messageUsername}>
                        To: @{message.recipient?.username || 'Unknown'}
                      </Text>
                    )}
                    <Text style={styles.messageTime}>
                      {new Date(message.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <StickyNote
                    text={message.text}
                    color={message.color as any}
                    truncate={true}
                    maxLines={3}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* View Message Modal */}
      <Modal
        visible={!!selectedMessage}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setSelectedMessage(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setSelectedMessage(null)}>
                <IconSymbol name="xmark.circle.fill" size={28} color="#666" />
              </TouchableOpacity>
              <HandwrittenText size={24} bold style={{ paddingHorizontal: 10 }}>
                {activeTab === 'inbox' ? 'From' : 'To'}: @
                {activeTab === 'inbox'
                  ? selectedMessage?.sender?.username
                  : selectedMessage?.recipient?.username}
              </HandwrittenText>
              <TouchableOpacity
                onPress={() => selectedMessage && handleDeleteMessage(selectedMessage.id)}
              >
                <IconSymbol name="trash.fill" size={24} color="#EF4249" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {selectedMessage && (
                <StickyNote text={selectedMessage.text} color={selectedMessage.color as any} />
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Compose Modal - Placeholder for now */}
      {showComposeModal && (
        <ComposeMessageModal
          visible={showComposeModal}
          onClose={() => setShowComposeModal(false)}
          onSent={() => {
            setShowComposeModal(false);
            loadMessages();
          }}
          currentUserId={currentUserId || ''}
        />
      )}
    </SafeAreaView>
  );
}

// Compose Message Modal Component
interface ComposeMessageModalProps {
  visible: boolean;
  onClose: () => void;
  onSent: () => void;
  currentUserId: string;
}

function ComposeMessageModal({
  visible,
  onClose,
  onSent,
  currentUserId,
}: ComposeMessageModalProps) {
  const [mutualFollowers, setMutualFollowers] = useState<any[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);
  const [messageText, setMessageText] = useState('');
  const [messageColor, setMessageColor] = useState('yellow');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      loadMutualFollowers();
    }
  }, [visible]);

  const loadMutualFollowers = async () => {
    setLoading(true);
    const { mutualFollowers: followers } = await getMutualFollowers(currentUserId);
    setMutualFollowers(followers);
    setLoading(false);
  };

  const handleSend = async () => {
    if (!selectedRecipient || !messageText.trim()) return;

    setSending(true);
    const { message, error } = await sendStickyMessage(
      currentUserId,
      selectedRecipient.id,
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
      setSending(false);
      return;
    }

    Alert.alert('Sent!', `Your sticky note was sent to @${selectedRecipient.username}`);
    setMessageText('');
    setSelectedRecipient(null);
    setSending(false);
    onSent();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.composeModalContainer}>
        <View style={styles.composeModalContent}>
          <View style={styles.composeHeader}>
            <TouchableOpacity onPress={onClose}>
              <IconSymbol name="xmark.circle.fill" size={28} color="#666" />
            </TouchableOpacity>
            <HandwrittenText size={24} bold>New Sticky Note</HandwrittenText>
            <TouchableOpacity
              onPress={handleSend}
              disabled={sending || !selectedRecipient || !messageText.trim()}
            >
              <Text
                style={[
                  styles.sendButton,
                  (!selectedRecipient || !messageText.trim() || sending) &&
                    styles.sendButtonDisabled,
                ]}
              >
                {sending ? 'Sending...' : 'Send'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.composeScroll}>
            {/* Select Recipient */}
            {!selectedRecipient ? (
              <View style={styles.section}>
                <HandwrittenText size={18} bold>Send to:</HandwrittenText>
                {loading ? (
                  <ActivityIndicator style={{ marginTop: 20 }} color="#EF4249" />
                ) : mutualFollowers.length === 0 ? (
                  <Text style={styles.noFollowersText}>
                    No mutual followers yet. Follow someone and have them follow you back!
                  </Text>
                ) : (
                  <View style={styles.followersList}>
                    {mutualFollowers.map((follower) => (
                      <TouchableOpacity
                        key={follower.id}
                        style={styles.followerCard}
                        onPress={() => setSelectedRecipient(follower)}
                      >
                        {follower.avatar_url ? (
                          <Image 
                            source={{ uri: follower.avatar_url }} 
                            style={styles.followerAvatar}
                          />
                        ) : (
                          <View style={styles.followerAvatarPlaceholder}>
                            <IconSymbol name="person.fill" size={24} color="#999" />
                          </View>
                        )}
                        <Text style={styles.followerUsername}>@{follower.username}</Text>
                        <IconSymbol name="chevron.right" size={20} color="#999" />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ) : (
              <>
                {/* Selected Recipient */}
                <View style={styles.selectedRecipient}>
                  <Text style={styles.toLabel}>To:</Text>
                  <View style={styles.recipientInfo}>
                    {selectedRecipient.avatar_url ? (
                      <Image 
                        source={{ uri: selectedRecipient.avatar_url }} 
                        style={styles.selectedAvatar}
                      />
                    ) : (
                      <View style={styles.selectedAvatarPlaceholder}>
                        <IconSymbol name="person.fill" size={18} color="#999" />
                      </View>
                    )}
                    <Text style={styles.recipientUsername}>@{selectedRecipient.username}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedRecipient(null)}>
                    <Text style={styles.changeButton}>Change</Text>
                  </TouchableOpacity>
                </View>

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
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    flex: 1,
    paddingRight: 10,
  },
  composeButton: {
    padding: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  activeTab: {
    borderBottomColor: '#EF4249',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#EF4249',
    fontWeight: '700',
  },
  unreadBadge: {
    backgroundColor: '#EF4249',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#EF4249',
    borderRadius: 25,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  messagesGrid: {
    gap: 16,
  },
  messageCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4249',
    zIndex: 10,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  messageUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  messageTime: {
    fontSize: 12,
    color: '#999',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  modalContent: {
    backgroundColor: '#F5F5F0',
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  modalScroll: {
    padding: 16,
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
    height: '90%',
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
  section: {
    marginBottom: 24,
  },
  noFollowersText: {
    fontSize: 14,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
    lineHeight: 20,
  },
  followersList: {
    marginTop: 16,
    gap: 12,
  },
  followerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 12,
    gap: 12,
  },
  followerUsername: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  followerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  followerAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedRecipient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  toLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  recipientInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recipientUsername: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  selectedAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F0F0F0',
  },
  selectedAvatarPlaceholder: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeButton: {
    fontSize: 14,
    color: '#EF4249',
    fontWeight: '600',
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
});
