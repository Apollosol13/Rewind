import { supabase } from '../config/supabase';

export interface BlockedUser {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

/**
 * Block a user
 */
export async function blockUser(blockerId: string, blockedId: string) {
  try {
    // Can't block yourself
    if (blockerId === blockedId) {
      throw new Error('Cannot block yourself');
    }

    const { data, error } = await supabase
      .from('blocked_users')
      .insert({
        blocker_id: blockerId,
        blocked_id: blockedId,
      })
      .select()
      .single();

    if (error) {
      // Check if already blocked (unique constraint violation)
      if (error.code === '23505') {
        return { blocked: data, error: null, alreadyBlocked: true };
      }
      throw error;
    }

    // Unfollow both ways when blocking
    await Promise.all([
      unfollowOnBlock(blockerId, blockedId),
      unfollowOnBlock(blockedId, blockerId),
    ]);

    return { blocked: data, error: null, alreadyBlocked: false };
  } catch (error) {
    console.error('Error blocking user:', error);
    return { blocked: null, error, alreadyBlocked: false };
  }
}

/**
 * Unblock a user
 */
export async function unblockUser(blockerId: string, blockedId: string) {
  try {
    const { error } = await supabase
      .from('blocked_users')
      .delete()
      .eq('blocker_id', blockerId)
      .eq('blocked_id', blockedId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error unblocking user:', error);
    return { error };
  }
}

/**
 * Check if user is blocked
 */
export async function isUserBlocked(blockerId: string, blockedId: string) {
  try {
    const { data, error } = await supabase
      .from('blocked_users')
      .select('id')
      .eq('blocker_id', blockerId)
      .eq('blocked_id', blockedId)
      .limit(1);

    if (error) throw error;
    return { isBlocked: (data && data.length > 0), error: null };
  } catch (error) {
    console.error('Error checking if blocked:', error);
    return { isBlocked: false, error };
  }
}

/**
 * Check if there's a mutual block (either user blocked the other)
 */
export async function isMutuallyBlocked(userId1: string, userId2: string) {
  try {
    const { data, error} = await supabase
      .from('blocked_users')
      .select('id')
      .or(`and(blocker_id.eq.${userId1},blocked_id.eq.${userId2}),and(blocker_id.eq.${userId2},blocked_id.eq.${userId1})`)
      .limit(1);

    if (error) throw error;
    return { isBlocked: (data && data.length > 0), error: null };
  } catch (error) {
    console.error('Error checking mutual block:', error);
    return { isBlocked: false, error };
  }
}

/**
 * Get list of blocked users
 */
export async function getBlockedUsers(blockerId: string) {
  try {
    const { data, error } = await supabase
      .from('blocked_users')
      .select(`
        id,
        blocked_id,
        created_at,
        users:blocked_id (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('blocker_id', blockerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { blockedUsers: data || [], error: null };
  } catch (error) {
    console.error('Error getting blocked users:', error);
    return { blockedUsers: [], error };
  }
}

/**
 * Get list of users who blocked this user
 */
export async function getUsersWhoBlockedMe(userId: string) {
  try {
    const { data, error } = await supabase
      .from('blocked_users')
      .select('blocker_id')
      .eq('blocked_id', userId);

    if (error) throw error;
    return { blockerIds: data?.map(b => b.blocker_id) || [], error: null };
  } catch (error) {
    console.error('Error getting blockers:', error);
    return { blockerIds: [], error };
  }
}

/**
 * Helper: Unfollow when blocking
 */
async function unfollowOnBlock(followerId: string, followingId: string) {
  try {
    await supabase
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);
  } catch (error) {
    console.error('Error unfollowing on block:', error);
  }
}
