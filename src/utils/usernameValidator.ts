import Filter from 'bad-words';

const filter = new Filter();

// You can add custom words here if needed
// filter.addWords('customword1', 'customword2');

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
  
  // Check for profanity and inappropriate content
  if (filter.isProfane(trimmed)) {
    return { valid: false, error: 'Username contains inappropriate content' };
  }
  
  // Check alphanumeric + underscore only
  if (!/^[a-z0-9_]+$/.test(trimmed)) {
    return { valid: false, error: 'Username can only contain letters, numbers, and underscores' };
  }
  
  return { valid: true };
}
