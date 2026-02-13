// Lightweight profanity filter - no regex, just array lookups
const BLOCKED_WORDS = [
  // Profanity
  'fuck', 'shit', 'bitch', 'ass', 'cunt', 'dick', 'cock', 'pussy', 'nigger', 'nigga',
  'fag', 'faggot', 'retard', 'rape', 'nazi', 'hitler', 'kkk', 'chink', 'spic',
  'kike', 'wetback', 'beaner', 'gook', 'jap', 'paki', 'raghead', 'towelhead',
  'whore', 'slut', 'coon', 'tranny', 'dyke', 'homo', 'porn', 'sex', 'xxx',
  // Leetspeak variations
  'fuk', 'fck', 'sht', 'btch', 'dck', 'ngg', 'fgt', 'rtrd', 'nzi',
  // Drug-related terms
  'fentanyl', 'fent', 'meth', 'heroin', 'cocaine', 'crack', 'weed', 'marijuana', 'drug',
  'xanax', 'percocet', 'oxy', 'molly', 'ecstasy', 'lsd', 'shrooms', 'acid', 'opium',
  'ketamine', 'mdma', 'amphetamine', 'cannabis', 'narcotic', 'dealer', 'addict'
];

export interface UsernameValidation {
  valid: boolean;
  error?: string;
}

/**
 * Normalizes username to catch leetspeak and repeated character variations
 * Examples: n1gga -> nigga, niggaaaa -> nigga, f3nt -> fent
 */
function normalizeUsername(username: string): string {
  return username
    .toLowerCase()
    .replace(/[1!|]/g, 'i')    // 1, !, | -> i
    .replace(/[0]/g, 'o')       // 0 -> o
    .replace(/[3]/g, 'e')       // 3 -> e
    .replace(/[4@]/g, 'a')      // 4, @ -> a
    .replace(/[5$]/g, 's')      // 5, $ -> s
    .replace(/[7]/g, 't')       // 7 -> t
    .replace(/[8]/g, 'b')       // 8 -> b
    .replace(/(.)\1{2,}/g, '$1'); // Remove repeated chars (aaa -> a)
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
  
  // Normalize to catch leetspeak and repeated characters
  const normalized = normalizeUsername(trimmed);
  
  // Check for blocked words (substring match on normalized version)
  for (const word of BLOCKED_WORDS) {
    if (normalized.includes(word)) {
      return { valid: false, error: 'Username contains inappropriate content' };
    }
  }
  
  // Check alphanumeric + underscore only
  if (!/^[a-z0-9_]+$/.test(trimmed)) {
    return { valid: false, error: 'Username can only contain letters, numbers, and underscores' };
  }
  
  return { valid: true };
}
