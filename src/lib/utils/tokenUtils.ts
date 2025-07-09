import jwt from 'jsonwebtoken';

export interface DecodedToken {
  userId: string;
  email: string;
  name: string;
  iat: number;
  exp: number;
}

export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwt.decode(token) as DecodedToken;
    if (!decoded || !decoded.exp) return true;
    
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch {
    return true;
  }
};

export const getTokenExpiryTime = (token: string): Date | null => {
  try {
    const decoded = jwt.decode(token) as DecodedToken;
    if (!decoded || !decoded.exp) return null;
    
    return new Date(decoded.exp * 1000);
  } catch {
    return null;
  }
};

export const getTimeUntilExpiry = (token: string): number => {
  try {
    const decoded = jwt.decode(token) as DecodedToken;
    if (!decoded || !decoded.exp) return 0;
    
    const currentTime = Math.floor(Date.now() / 1000);
    return Math.max(0, decoded.exp - currentTime);
  } catch {
    return 0;
  }
};

export const shouldRefreshToken = (token: string): boolean => {
  const timeUntilExpiry = getTimeUntilExpiry(token);
  // Refresh if less than 5 minutes remaining
  return timeUntilExpiry > 0 && timeUntilExpiry < 300;
};