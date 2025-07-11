// Test script to check JWT token format and authentication
import jwt from 'jsonwebtoken';

// Test function to validate token format
export function validateJWTFormat(token: string): { isValid: boolean; error?: string } {
  try {
    // Check if token is empty or null-like
    if (!token || token === 'null' || token === 'undefined') {
      return { isValid: false, error: 'Token is empty or null-like' };
    }

    // Check JWT structure (header.payload.signature)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { isValid: false, error: `Invalid JWT structure: expected 3 parts, got ${parts.length}` };
    }

    // Try to decode the header
    try {
      const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
      console.log('JWT Header:', header);
    } catch (e) {
      return { isValid: false, error: 'Invalid JWT header' };
    }

    // Try to decode the payload
    try {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      console.log('JWT Payload:', payload);
    } catch (e) {
      return { isValid: false, error: 'Invalid JWT payload' };
    }

    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: `JWT validation error: ${error}` };
  }
}

// Test function for debugging
export function debugToken(token: string, secret: string) {
  console.log('=== JWT Token Debug ===');
  console.log('Token length:', token?.length);
  console.log('Token value:', token);
  console.log('Token type:', typeof token);
  
  const validation = validateJWTFormat(token);
  console.log('Validation result:', validation);
  
  if (validation.isValid) {
    try {
      const decoded = jwt.verify(token, secret);
      console.log('Decoded successfully:', decoded);
      return decoded;
    } catch (error) {
      console.log('JWT verification failed:', error);
      return null;
    }
  }
  
  return null;
}
