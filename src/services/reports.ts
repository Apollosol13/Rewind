import { supabase } from '../config/supabase';

export interface Report {
  id: string;
  reporter_id: string;
  reported_user_id?: string;
  photo_id?: string;
  comment_id?: string;
  message_id?: string;
  reason: string;
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  created_at: string;
  reviewed_at?: string;
}

export type ReportReason =
  | 'spam'
  | 'harassment'
  | 'hate_speech'
  | 'violence'
  | 'nudity'
  | 'inappropriate'
  | 'copyright'
  | 'impersonation'
  | 'other';

/**
 * Report a photo
 */
export async function reportPhoto(
  reporterId: string,
  photoId: string,
  reportedUserId: string,
  reason: ReportReason,
  description?: string
) {
  try {
    const { data, error } = await supabase
      .from('reports')
      .insert({
        reporter_id: reporterId,
        photo_id: photoId,
        reported_user_id: reportedUserId,
        reason,
        description,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return { report: data, error: null };
  } catch (error) {
    console.error('Error reporting photo:', error);
    return { report: null, error };
  }
}

/**
 * Report a user (profile/behavior)
 */
export async function reportUser(
  reporterId: string,
  reportedUserId: string,
  reason: ReportReason,
  description?: string
) {
  try {
    const { data, error } = await supabase
      .from('reports')
      .insert({
        reporter_id: reporterId,
        reported_user_id: reportedUserId,
        reason,
        description,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return { report: data, error: null };
  } catch (error) {
    console.error('Error reporting user:', error);
    return { report: null, error };
  }
}

/**
 * Report a comment
 */
export async function reportComment(
  reporterId: string,
  commentId: string,
  reportedUserId: string,
  reason: ReportReason,
  description?: string
) {
  try {
    const { data, error } = await supabase
      .from('reports')
      .insert({
        reporter_id: reporterId,
        comment_id: commentId,
        reported_user_id: reportedUserId,
        reason,
        description,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return { report: data, error: null };
  } catch (error) {
    console.error('Error reporting comment:', error);
    return { report: null, error };
  }
}

/**
 * Report a sticky message
 */
export async function reportMessage(
  reporterId: string,
  messageId: string,
  reportedUserId: string,
  reason: ReportReason,
  description?: string
) {
  try {
    const { data, error } = await supabase
      .from('reports')
      .insert({
        reporter_id: reporterId,
        message_id: messageId,
        reported_user_id: reportedUserId,
        reason,
        description,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return { report: data, error: null };
  } catch (error) {
    console.error('Error reporting message:', error);
    return { report: null, error };
  }
}

/**
 * Get user's reports
 */
export async function getUserReports(userId: string) {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('reporter_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { reports: data || [], error: null };
  } catch (error) {
    console.error('Error getting reports:', error);
    return { reports: [], error };
  }
}

/**
 * Check if user has already reported this content
 */
export async function hasReported(
  reporterId: string,
  photoId?: string,
  userId?: string,
  commentId?: string,
  messageId?: string
) {
  try {
    let query = supabase
      .from('reports')
      .select('id')
      .eq('reporter_id', reporterId);

    if (photoId) query = query.eq('photo_id', photoId);
    if (userId) query = query.eq('reported_user_id', userId);
    if (commentId) query = query.eq('comment_id', commentId);
    if (messageId) query = query.eq('message_id', messageId);

    const { data, error } = await query.limit(1);

    if (error) throw error;
    return { hasReported: (data && data.length > 0), error: null };
  } catch (error) {
    console.error('Error checking if reported:', error);
    return { hasReported: false, error };
  }
}

/**
 * Get report reason display text
 */
export function getReasonDisplayText(reason: ReportReason): string {
  const reasonMap: Record<ReportReason, string> = {
    spam: 'Spam',
    harassment: 'Harassment or Bullying',
    hate_speech: 'Hate Speech',
    violence: 'Violence or Dangerous Content',
    nudity: 'Nudity or Sexual Content',
    inappropriate: 'Inappropriate Content',
    copyright: 'Copyright Violation',
    impersonation: 'Impersonation',
    other: 'Other',
  };
  return reasonMap[reason] || 'Other';
}
