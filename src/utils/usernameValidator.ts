// Lightweight profanity filter - no regex, just array lookups
const BLOCKED_WORDS = [
  'fuck', 'shit', 'bitch', 'ass', 'cunt', 'dick', 'cock', 'pussy', 'nigger', 'nigga',
  'fag', 'faggot', 'retard', 'rape', 'nazi', 'hitler', 'kkk', 'chink', 'spic',
  'kike', 'wetback', 'beaner', 'gook', 'jap', 'paki', 'raghead', 'towelhead',
  'whore', 'slut', 'coon', 'tranny', 'dyke', 'homo', 'porn', 'sex', 'xxx',
  // Leetspeak variations
  'fuk', 'fck', 'sht', 'btch', 'dck', 'ngg', 'fgt', 'rtrd', 'nzi'
];

export interface UsernameValidation {
  valid: boolean;
  error?: string;
}

/**
 * Validates username for length, format, and inappropriate content
 */
export function validateUsername(username: string): UsernameValidation {
  const trimmed = username.trim().toLowerCase();
  
  // Check length
  if (trimmed.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' };
  }
  
  if (trimmed.length > 20) {
    return { valid: false, error: 'Username must be less than 20 characters' };
  }
  
  // Check for blocked words (simple substring match)
  for (const word of BLOCKED_WORDS) {
    if (trimmed.includes(word)) {
      return { valid: false, error: 'Username contains inappropriate content' };
    }
  }
  
  // Check alphanumeric + underscore only
  if (!/^[a-z0-9_]+$/.test(trimmed)) {
    return { valid: false, error: 'Username can only contain letters, numbers, and underscores' };
  }
  
  return { valid: true };
}
