import { supabase } from '../config/supabase';

/**
 * Get count of new followers since last viewed
 */
export async function getNewFollowersCount(userId: string): Promise<{ count: number; error: any }> {
  try {
    // Get user's last_viewed_followers_at timestamp
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('last_viewed_followers_at')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    // If never viewed, count all followers
    const lastViewed = userData?.last_viewed_followers_at || new Date(0).toISOString();

    // Count followers created after last viewed time
    const { count, error: countError } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId)
      .gt('created_at', lastViewed);

    if (countError) throw countError;

    return { count: count || 0, error: null };
  } catch (error) {
    console.error('Error getting new followers count:', error);
    return { count: 0, error };
  }
}

/**
 * Mark followers as viewed (update last_viewed_followers_at to now)
 */
export async function markFollowersAsViewed(userId: string): Promise<{ error: any }> {
  try {
    const { error } = await supabase
      .from('users')
      .update({ last_viewed_followers_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('Error marking followers as viewed:', error);
    return { error };
  }
}
