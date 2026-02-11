import { supabase } from '../config/supabase';
import { User } from '../config/supabase';

/**
 * Search for users by username or display name
 */
export async function searchUsers(query: string, currentUserId?: string) {
  try {
    if (!query.trim()) {
      return { users: [], error: null };
    }

    const searchTerm = query.trim().toLowerCase();

    // Search by username or display_name (case insensitive)
    let queryBuilder = supabase
      .from('users')
      .select('id, username, display_name, avatar_url, bio')
      .or(`username.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`)
      .limit(20);

    // Exclude current user from results
    if (currentUserId) {
      queryBuilder = queryBuilder.neq('id', currentUserId);
    }

    const { data, error } = await queryBuilder;

    if (error) throw error;

    // Sort results: exact matches first, then starts with, then contains
    const sortedResults = (data || []).sort((a, b) => {
      const aUsername = a.username.toLowerCase();
      const bUsername = b.username.toLowerCase();
      
      // Exact match
      if (aUsername === searchTerm) return -1;
      if (bUsername === searchTerm) return 1;
      
      // Starts with
      if (aUsername.startsWith(searchTerm) && !bUsername.startsWith(searchTerm)) return -1;
      if (bUsername.startsWith(searchTerm) && !aUsername.startsWith(searchTerm)) return 1;
      
      // Alphabetical
      return aUsername.localeCompare(bUsername);
    });

    return { users: sortedResults as User[], error: null };
  } catch (error) {
    console.error('Error searching users:', error);
    return { users: [], error };
  }
}

/**
 * Get suggested users (sorted by popularity - most followers first)
 */
export async function getSuggestedUsers(currentUserId: string, limit: number = 10) {
  try {
    // Get users with their follower counts
    const { data, error } = await supabase
      .from('users')
      .select(`
        id, 
        username, 
        display_name, 
        avatar_url, 
        bio,
        followers:follows!follows_following_id_fkey(count)
      `)
      .neq('id', currentUserId)
      .limit(50); // Get more, then filter and limit

    if (error) throw error;

    // Get list of users we're already following
    const { data: following } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', currentUserId);

    const followingIds = new Set(following?.map(f => f.following_id) || []);
    
    // Filter out users we're already following
    const notFollowing = (data || []).filter(u => !followingIds.has(u.id));
    
    // Sort by follower count (popularity)
    const sorted = notFollowing.sort((a, b) => {
      const aCount = a.followers?.[0]?.count || 0;
      const bCount = b.followers?.[0]?.count || 0;
      return bCount - aCount; // Descending order
    });
    
    // Take top X most popular
    const suggested = sorted.slice(0, limit).map(user => ({
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      bio: user.bio,
    }));

    return { users: suggested as User[], error: null };
  } catch (error) {
    console.error('Error getting suggested users:', error);
    return { users: [], error };
  }
}
