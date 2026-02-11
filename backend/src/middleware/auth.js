import { verifyAuthToken } from '../services/supabase.js';

/**
 * Authentication middleware
 * Verifies JWT token from Authorization header
 */
export async function authenticateUser(req, res, next) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid Authorization header',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token with Supabase
    const user = await verifyAuthToken(token);

    // Attach user to request object
    req.user = user;
    
    console.log(`✅ User authenticated: ${user.id}`);
    
    next();
  } catch (error) {
    console.error('❌ Authentication failed:', error);
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired authentication token',
    });
  }
}

/**
 * Optional authentication middleware
 * Allows request to proceed without auth, but attaches user if token is valid
 */
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const user = await verifyAuthToken(token);
      req.user = user;
    }
    
    next();
  } catch (error) {
    // Continue without auth
    next();
  }
}

export default {
  authenticateUser,
  optionalAuth,
};
