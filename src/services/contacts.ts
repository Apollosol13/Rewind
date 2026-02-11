import * as Contacts from 'expo-contacts';
import * as Crypto from 'expo-crypto';
import { supabase } from '../config/supabase';
import { User } from '../config/supabase';

/**
 * Request permission to access contacts
 */
export async function requestContactsPermission() {
  try {
    const { status } = await Contacts.requestPermissionsAsync();
    return { granted: status === 'granted', error: null };
  } catch (error) {
    console.error('Error requesting contacts permission:', error);
    return { granted: false, error };
  }
}

/**
 * Hash a phone number for privacy-preserving contact matching
 */
async function hashPhoneNumber(phoneNumber: string): Promise<string> {
  // Normalize phone number: remove all non-digits
  const normalized = phoneNumber.replace(/\D/g, '');
  
  // Hash with SHA256
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    normalized
  );
  
  return hash;
}

/**
 * Get all phone contacts and hash their numbers
 */
async function getHashedContacts() {
  try {
    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
    });

    if (!data || data.length === 0) {
      return [];
    }

    const hashedContacts: { hash: string; name: string }[] = [];

    for (const contact of data) {
      if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
        for (const phone of contact.phoneNumbers) {
          if (phone.number) {
            const hash = await hashPhoneNumber(phone.number);
            hashedContacts.push({
              hash,
              name: contact.name || 'Unknown',
            });
          }
        }
      }
    }

    return hashedContacts;
  } catch (error) {
    console.error('Error getting hashed contacts:', error);
    return [];
  }
}

/**
 * Find users on REWIND from phone contacts
 */
export async function findContactsOnApp(currentUserId: string) {
  try {
    // Get permission first
    const { granted } = await requestContactsPermission();
    if (!granted) {
      return { 
        users: [], 
        error: { message: 'Contacts permission denied', code: 'PERMISSION_DENIED' } 
      };
    }

    // Get hashed contacts
    const hashedContacts = await getHashedContacts();
    
    if (hashedContacts.length === 0) {
      return { users: [], error: null };
    }

    // Query Supabase for matching phone hashes
    const hashes = hashedContacts.map(c => c.hash);
    
    // Don't select phone_hash - just use it for filtering
    const { data, error } = await supabase
      .from('users')
      .select('id, username, display_name, avatar_url, bio')
      .in('phone_hash', hashes)
      .neq('id', currentUserId);

    if (error) {
      // If phone_hash column doesn't exist, return empty results
      if (error.message?.includes('column') && error.message?.includes('phone_hash')) {
        console.warn('phone_hash column not found. Please run Supabase migration.');
        return { 
          users: [], 
          error: { 
            message: 'Contact sync not set up. Please run Supabase migrations.', 
            code: 'COLUMN_NOT_FOUND' 
          } 
        };
      }
      // Handle RLS/Bad Request errors
      if (error.message?.includes('Bad Request')) {
        console.warn('Database access error. Check RLS policies.');
        return { 
          users: [], 
          error: { 
            message: 'Unable to access contact data. Please check database permissions.', 
            code: 'ACCESS_DENIED' 
          } 
        };
      }
      throw error;
    }

    // Return found users
    // Note: We can't match contact names without selecting phone_hash
    // But users will still see their friends' usernames and display names
    const matchedUsers = (data || []).map(user => ({
      ...user,
      contactName: undefined, // Can't match without phone_hash in response
    }));

    return { users: matchedUsers as (User & { contactName?: string })[], error: null };
  } catch (error) {
    console.error('Error finding contacts on app:', error);
    return { users: [], error };
  }
}

/**
 * Update current user's phone hash
 */
export async function updateUserPhoneHash(userId: string, phoneNumber: string) {
  try {
    const hash = await hashPhoneNumber(phoneNumber);
    
    const { error } = await supabase
      .from('users')
      .update({ phone_hash: hash })
      .eq('id', userId);

    if (error) throw error;
    
    return { error: null };
  } catch (error) {
    console.error('Error updating phone hash:', error);
    return { error };
  }
}

/**
 * Remove user's phone hash (for privacy)
 */
export async function removeUserPhoneHash(userId: string) {
  try {
    const { error } = await supabase
      .from('users')
      .update({ phone_hash: null })
      .eq('id', userId);

    if (error) throw error;
    
    return { error: null };
  } catch (error) {
    console.error('Error removing phone hash:', error);
    return { error };
  }
}
