import { supabase } from '../config/supabase';
import { shouldSendNotification } from './notificationPreferences';
import { sendNewFollowerNotification } from './notifications';

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

/**
 * Follow a user
 */
export async function followUser(followerId: string, followingId: string) {
  try {
    const { data, error } = await supabase
      .from('follows')
      .insert([
        {
          follower_id: followerId,
          following_id: followingId,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Send notification to the user being followed if they have it enabled
    if (data) {
      const userWantsNotif = await shouldSendNotification(followingId, 'notif_new_follower');
      if (userWantsNotif) {
        // Get follower username for notification
        const { data: followerData } = await supabase
          .from('users')
          .select('username')
          .eq('id', followerId)
          .single();
        
        if (followerData) {
          console.log('🔔 Sending follower notification to:', followingId);
          await sendNewFollowerNotification(followingId, followerData.username, followerId);
        }
      }
    }

    return { follow: data as Follow, error: null };
  } catch (error) {
    console.error('Error following user:', error);
    return { follow: null, error };
  }
}

/**
 * Unfollow a user
 */
export async function unfollowUser(followerId: string, followingId: string) {
  try {
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return { error };
  }
}

/**
 * Check if user is following another user
 */
export async function isFollowing(followerId: string, followingId: string) {
  try {
    const { data, error } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    return { isFollowing: !!data, error: null };
  } catch (error) {
    console.error('Error checking follow status:', error);
    return { isFollowing: false, error };
  }
}

/**
 * Get follower count for a user
 */
export async function getFollowerCount(userId: string) {
  try {
    const { count, error } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId);

    if (error) throw error;
    return { count: count || 0, error: null };
  } catch (error) {
    console.error('Error getting follower count:', error);
    return { count: 0, error };
  }
}

/**
 * Get following count for a user
 */
export async function getFollowingCount(userId: string) {
  try {
    const { count, error } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId);

    if (error) throw error;
    return { count: count || 0, error: null };
  } catch (error) {
    console.error('Error getting following count:', error);
    return { count: 0, error };
  }
}

/**
 * Get followers list
 */
export async function getFollowers(userId: string) {
  try {
    const { data, error } = await supabase
      .from('follows')
      .select(`
        id,
        follower_id,
        created_at,
        follower:users!follows_follower_id_fkey(id, username, display_name, avatar_url)
      `)
      .eq('following_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { followers: data, error: null };
  } catch (error) {
    console.error('Error getting followers:', error);
    return { followers: [], error };
  }
}

/**
 * Get following list
 */
export async function getFollowing(userId: string) {
  try {
    const { data, error } = await supabase
      .from('follows')
      .select(`
        id,
        following_id,
        created_at,
        following:users!follows_following_id_fkey(id, username, display_name, avatar_url)
      `)
      .eq('follower_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { following: data, error: null };
  } catch (error) {
    console.error('Error getting following:', error);
    return { following: [], error };
  }
}
