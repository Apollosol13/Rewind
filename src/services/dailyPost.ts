import { supabase } from '../config/supabase';

export interface DailyPost {
  id: string;
  user_id: string;
  post_date: string;
  photo_id: string;
  created_at: string;
}

/**
 * Check if user has posted today
 */
export async function hasPostedToday(userId: string) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('daily_posts')
      .select('id, photo_id')
      .eq('user_id', userId)
      .eq('post_date', today)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return { hasPosted: !!data, photoId: data?.photo_id, error: null };
  } catch (error) {
    console.error('Error checking daily post:', error);
    return { hasPosted: false, photoId: null, error };
  }
}

/**
 * Record daily post
 */
export async function recordDailyPost(userId: string, photoId: string) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
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
    return { dailyPost: data as DailyPost, error: null };
  } catch (error) {
    console.error('Error recording daily post:', error);
    return { dailyPost: null, error };
  }
}

/**
 * Get time until next posting window (midnight)
 */
export function getTimeUntilNextPost() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const diff = tomorrow.getTime() - now.getTime();
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
