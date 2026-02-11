import { supabase } from '../config/supabase';

export interface DailyPost {
  id: string;
  user_id: string;
  post_date: string;
  photo_id: string;
  created_at: string;
}

/**
 * Check if user can post (based on 24-hour cycle from last post)
 */
export async function canUserPost(userId: string) {
  try {
    // Get user's last post time from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('last_post_time')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    // If never posted before, they can post
    if (!userData?.last_post_time) {
      console.log('📅 User has never posted - can post');
      return { canPost: true, lastPostTime: null, error: null };
    }

    // Calculate 24 hours from last post
    const lastPostTime = new Date(userData.last_post_time);
    const nextPostTime = new Date(lastPostTime.getTime() + (24 * 60 * 60 * 1000)); // +24 hours
    const now = new Date();

    // Can post if 24 hours have passed
    const canPost = now >= nextPostTime;
    
    const hoursRemaining = canPost ? 0 : Math.ceil((nextPostTime.getTime() - now.getTime()) / (1000 * 60 * 60));
    console.log('📅 Last post:', lastPostTime.toISOString(), '| Can post:', canPost, '| Hours remaining:', hoursRemaining);

    return { 
      canPost, 
      lastPostTime: userData.last_post_time,
      error: null 
    };
  } catch (error) {
    console.error('Error checking if user can post:', error);
    return { canPost: true, lastPostTime: null, error }; // Allow posting on error
  }
}

/**
 * @deprecated Use canUserPost() instead - checks 24-hour cycle, not calendar date
 */
export async function hasPostedToday(userId: string) {
  // Redirect to new function for backwards compatibility
  const { canPost, lastPostTime, error } = await canUserPost(userId);
  return { hasPosted: !canPost, photoId: null, error };
}

/**
 * Record daily post and update last_post_time
 */
export async function recordDailyPost(userId: string, photoId: string) {
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Update user's last post time (critical for 24-hour cycle)
    await supabase
      .from('users')
      .update({ last_post_time: now.toISOString() })
      .eq('id', userId);
    
    // Record in daily_posts table for history tracking
    const { data, error } = await supabase
      .from('daily_posts')
      .insert([
        {
          user_id: userId,
          post_date: today,
          photo_id: photoId,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    console.log('✅ Daily post recorded | last_post_time updated:', now.toISOString());
    return { dailyPost: data as DailyPost, error: null };
  } catch (error) {
    console.error('Error recording daily post:', error);
    return { dailyPost: null, error };
  }
}

/**
 * Get time until next posting window (24 hours from last post)
 */
export function getTimeUntilNextPost(lastPostTime?: string | Date | null) {
  if (!lastPostTime) {
    // No previous post, can post anytime
    return { hours: 0, minutes: 0, seconds: 0, totalMs: 0 };
  }

  const lastPost = typeof lastPostTime === 'string' ? new Date(lastPostTime) : lastPostTime;
  const nextAvailable = new Date(lastPost.getTime() + (24 * 60 * 60 * 1000)); // +24 hours
  const now = new Date();
  
  const diff = nextAvailable.getTime() - now.getTime();
  
  if (diff <= 0) {
    // 24 hours have passed, can post now
    return { hours: 0, minutes: 0, seconds: 0, totalMs: 0 };
  }
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return { hours, minutes, seconds, totalMs: diff };
}

/**
 * Format time remaining as string
 */
export function formatTimeRemaining(hours: number, minutes: number): string {
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}
