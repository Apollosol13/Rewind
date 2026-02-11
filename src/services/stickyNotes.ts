import { supabase } from '../config/supabase';

export interface StickyNote {
  id: string;
  user_id: string;
  text: string;
  color: string;
  created_at: string;
}

/**
 * Get sticky notes for a user
 */
export async function getUserStickyNotes(userId: string) {
  try {
    const { data, error } = await supabase
      .from('sticky_notes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { notes: data as StickyNote[], error: null };
  } catch (error) {
    console.error('Error getting sticky notes:', error);
    return { notes: [], error };
  }
}

/**
 * Create a new sticky note
 */
export async function createStickyNote(
  userId: string,
  text: string,
  color: string = 'yellow'
) {
  try {
    const { data, error } = await supabase
      .from('sticky_notes')
      .insert([
        {
          user_id: userId,
          text: text,
          color: color,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return { note: data as StickyNote, error: null };
  } catch (error) {
    console.error('Error creating sticky note:', error);
    return { note: null, error };
  }
}

/**
 * Delete a sticky note
 */
export async function deleteStickyNote(noteId: string, userId: string) {
  try {
    const { error } = await supabase
      .from('sticky_notes')
      .delete()
      .eq('id', noteId)
      .eq('user_id', userId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting sticky note:', error);
    return { error };
  }
}
