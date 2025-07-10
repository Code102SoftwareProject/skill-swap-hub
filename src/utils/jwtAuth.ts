import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

// Ensure JWT_SECRET is available
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

export interface TokenValidationResult {
  isValid: boolean;
  userId: string | null;
  error?: string;
}

export function validateAndExtractUserId(req: NextRequest): TokenValidationResult {
  try {
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader) {
      return { isValid: false, userId: null, error: 'No authorization header found' };
    }

    if (!authHeader.startsWith('Bearer ')) {
      return { 
        isValid: false, 
        userId: null, 
        error: 'Authorization header must start with Bearer' 
      };
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token || token === 'null' || token === 'undefined') {
      return { 
        isValid: false, 
        userId: null, 
        error: 'Token is empty, null, or undefined' 
      };
    }

    // Validate JWT structure
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      return { 
        isValid: false, 
        userId: null, 
        error: `Invalid JWT structure: expected 3 parts, got ${tokenParts.length}` 
      };
    }
    
    // Verify and decode the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };
    
    if (!decoded.userId) {
      return { 
        isValid: false, 
        userId: null, 
        error: 'Token does not contain userId' 
      };
    }
    
    return { isValid: true, userId: decoded.userId };
    
  } catch (error) {
    let errorMessage = 'Unknown error occurred';
    
    if (error instanceof jwt.JsonWebTokenError) {
      errorMessage = `JWT Error: ${error.message}`;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return { 
      isValid: false, 
      userId: null, 
      error: errorMessage 
    };
  }
}

// Backward compatibility function
export function getUserIdFromToken(req: NextRequest): string | null {
  const result = validateAndExtractUserId(req);
  
  if (!result.isValid) {
    console.error('Token validation failed:', result.error);
  }
  
  return result.userId;
}
