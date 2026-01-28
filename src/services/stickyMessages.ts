import { supabase } from '../config/supabase';
import { shouldSendNotification } from './notificationPreferences';
import { sendNewMessageNotification } from './notifications';

export interface StickyMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  text: string;
  color: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    username: string;
    avatar_url: string | null;
  };
  recipient?: {
    username: string;
    avatar_url: string | null;
  };
}

export interface RateLimitError {
  message: string;
  code: string;
  minutesRemaining?: number;
}

/**
 * Get mutual followers (people who both follow you and you follow them)
 */
export async function getMutualFollowers(userId: string) {
  try {
    const { data, error } = await supabase
      .from('follows')
      .select(`
        following_id,
        users:following_id (
          id,
          username,
          avatar_url
        )
      `)
      .eq('follower_id', userId);

    if (error) throw error;

    // Filter to only include mutual followers
    const mutualFollowers = await Promise.all(
      (data || []).map(async (follow: any) => {
        const { data: reverseFollow } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', follow.following_id)
          .eq('following_id', userId)
          .single();

        if (reverseFollow) {
          return follow.users;
        }
        return null;
      })
    );

    return {
      mutualFollowers: mutualFollowers.filter((f) => f !== null),
      error: null,
    };
  } catch (error) {
    console.error('Error getting mutual followers:', error);
    return { mutualFollowers: [], error };
  }
}

/**
 * Check if two users are mutual followers
 */
export async function areMutualFollowers(userId1: string, userId2: string) {
  try {
    const { data: follow1, error: error1 } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', userId1)
      .eq('following_id', userId2)
      .single();

    const { data: follow2, error: error2 } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', userId2)
      .eq('following_id', userId1)
      .single();

    const areMutual = !!follow1 && !!follow2;
    return { areMutual, error: null };
  } catch (error) {
    console.error('Error checking mutual followers:', error);
    return { areMutual: false, error };
  }
}

/**
 * Check if user can send a message (rate limiting: 1 per hour per person)
 */
export async function canSendMessageTo(senderId: string, recipientId: string) {
  try {
    // Get the last message sent from sender to recipient
    const { data, error } = await supabase
      .from('sticky_messages')
      .select('created_at')
      .eq('sender_id', senderId)
      .eq('recipient_id', recipientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows

    if (!data) {
      // No previous message, can send
      return { canSend: true, minutesRemaining: 0, error: null };
    }

    // Check if 1 hour has passed
    const lastMessageTime = new Date(data.created_at).getTime();
    const now = new Date().getTime();
    const oneHourMs = 60 * 60 * 1000;
    const timeSinceLastMessage = now - lastMessageTime;

    if (timeSinceLastMessage >= oneHourMs) {
      return { canSend: true, minutesRemaining: 0, error: null };
    }

    // Calculate minutes remaining
    const timeRemaining = oneHourMs - timeSinceLastMessage;
    const minutesRemaining = Math.ceil(timeRemaining / (60 * 1000));

    return { canSend: false, minutesRemaining, error: null };
  } catch (error) {
    console.error('Error checking rate limit:', error);
    return { canSend: false, minutesRemaining: 0, error };
  }
}

/**
 * Send a sticky message (with rate limiting)
 */
export async function sendStickyMessage(
  senderId: string,
  recipientId: string,
  text: string,
  color: string = 'yellow'
) {
  try {
    // Check rate limit first
    const { canSend, minutesRemaining } = await canSendMessageTo(senderId, recipientId);
    if (!canSend) {
      return {
        message: null,
        error: {
          message: `Please wait ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''} before sending another sticky note to this person.`,
          code: 'RATE_LIMIT',
          minutesRemaining,
        },
      };
    }

    const { data, error } = await supabase
      .from('sticky_messages')
      .insert([
        {
          sender_id: senderId,
          recipient_id: recipientId,
          text,
          color,
        },
      ])
      .select(`
        *,
        sender:sender_id (username, avatar_url),
        recipient:recipient_id (username, avatar_url)
      `)
      .single();

    if (error) throw error;

    // Send notification to recipient if they have it enabled
    if (data) {
      const recipientWantsNotif = await shouldSendNotification(recipientId, 'notif_new_message');
      if (recipientWantsNotif) {
        // Get sender username for notification
        const { data: senderData } = await supabase
          .from('users')
          .select('username')
          .eq('id', senderId)
          .single();
        
        if (senderData) {
          console.log('🔔 Sending message notification to recipient:', recipientId);
          await sendNewMessageNotification(recipientId, senderData.username, data.id);
        }
      }
    }

    return { message: data as StickyMessage, error: null };
  } catch (error) {
    console.error('Error sending sticky message:', error);
    return { message: null, error };
  }
}

/**
 * Get inbox (received messages)
 */
export async function getInbox(userId: string) {
  try {
    const { data, error } = await supabase
      .from('sticky_messages')
      .select(`
        *,
        sender:sender_id (username, avatar_url)
      `)
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { messages: data as StickyMessage[], error: null };
  } catch (error) {
    console.error('Error getting inbox:', error);
    return { messages: [], error };
  }
}

/**
 * Get sent messages
 */
export async function getSentMessages(userId: string) {
  try {
    const { data, error } = await supabase
      .from('sticky_messages')
      .select(`
        *,
        recipient:recipient_id (username, avatar_url)
      `)
      .eq('sender_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { messages: data as StickyMessage[], error: null };
  } catch (error) {
    console.error('Error getting sent messages:', error);
    return { messages: [], error };
  }
}

/**
 * Get conversation between two users
 */
export async function getConversation(userId: string, otherUserId: string) {
  try {
    const { data, error } = await supabase
      .from('sticky_messages')
      .select(`
        *,
        sender:sender_id (username, avatar_url),
        recipient:recipient_id (username, avatar_url)
      `)
      .or(
        `and(sender_id.eq.${userId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${userId})`
      )
      .order('created_at', { ascending: true });

    if (error) throw error;
    return { messages: data as StickyMessage[], error: null };
  } catch (error) {
    console.error('Error getting conversation:', error);
    return { messages: [], error };
  }
}

/**
 * Mark message as read
 */
export async function markMessageAsRead(messageId: string) {
  try {
    const { error } = await supabase
      .from('sticky_messages')
      .update({ is_read: true })
      .eq('id', messageId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error marking message as read:', error);
    return { error };
  }
}

/**
 * Mark all messages from a user as read
 */
export async function markAllMessagesAsRead(userId: string, senderId: string) {
  try {
    const { error } = await supabase
      .from('sticky_messages')
      .update({ is_read: true })
      .eq('recipient_id', userId)
      .eq('sender_id', senderId)
      .eq('is_read', false);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error marking all messages as read:', error);
    return { error };
  }
}

/**
 * Delete message
 */
export async function deleteStickyMessage(messageId: string) {
  try {
    const { error } = await supabase
      .from('sticky_messages')
      .delete()
      .eq('id', messageId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting sticky message:', error);
    return { error };
  }
}

/**
 * Get unread message count
 */
export async function getUnreadCount(userId: string) {
  try {
    const { count, error } = await supabase
      .from('sticky_messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return { count: count || 0, error: null };
  } catch (error) {
    console.error('Error getting unread count:', error);
    return { count: 0, error };
  }
}
