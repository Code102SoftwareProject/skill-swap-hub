/**
 * JWT Authentication Utilities Tests
 * Tests for JWT token validation and extraction utilities
 */

import { validateAndExtractUserId, getUserIdFromToken } from '@/utils/jwtAuth';
import jwt from 'jsonwebtoken';

// Mock jsonwebtoken
jest.mock('jsonwebtoken');
const mockJwt = jwt as jest.Mocked<typeof jwt>;

// Mock environment variables
const originalEnv = process.env;

describe('JWT Authentication Utilities', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-only';
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Environment Variables', () => {
    test('should require JWT_SECRET environment variable', () => {
      delete process.env.JWT_SECRET;

      expect(() => {
        jest.resetModules();
        require('@/utils/jwtAuth');
      }).toThrow('JWT_SECRET environment variable is required');

      // Restore for other tests
      process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-only';
    });
  });

  describe('validateAndExtractUserId', () => {
    const createMockRequest = (authHeader: string | null) => {
      const headers = new Headers();
      if (authHeader) {
        headers.set('authorization', authHeader);
      }
      return {
        headers: {
          get: (name: string) => headers.get(name)
        }
      } as any;
    };

    describe('Authorization Header Validation', () => {
      test('should return invalid when authorization header is missing', () => {
        const request = createMockRequest(null);
        
        const result = validateAndExtractUserId(request);
        
        expect(result).toEqual({
          isValid: false,
          userId: null,
          error: 'No authorization header found'
        });
      });

      test('should return invalid when authorization header does not start with Bearer', () => {
        const request = createMockRequest('Basic some-token');
        
        const result = validateAndExtractUserId(request);
        
        expect(result).toEqual({
          isValid: false,
          userId: null,
          error: 'Authorization header must start with Bearer'
        });
      });

      test('should return invalid when token is empty after Bearer', () => {
        const request = createMockRequest('Bearer ');
        
        const result = validateAndExtractUserId(request);
        
        expect(result).toEqual({
          isValid: false,
          userId: null,
          error: 'Token is empty, null, or undefined'
        });
      });

      test('should return invalid when token is null string', () => {
        const request = createMockRequest('Bearer null');
        
        const result = validateAndExtractUserId(request);
        
        expect(result).toEqual({
          isValid: false,
          userId: null,
          error: 'Token is empty, null, or undefined'
        });
      });

      test('should return invalid when token is undefined string', () => {
        const request = createMockRequest('Bearer undefined');
        
        const result = validateAndExtractUserId(request);
        
        expect(result).toEqual({
          isValid: false,
          userId: null,
          error: 'Token is empty, null, or undefined'
        });
      });
    });

    describe('JWT Structure Validation', () => {
      test('should return invalid when JWT has wrong number of parts', () => {
        const request = createMockRequest('Bearer invalid.token');
        
        const result = validateAndExtractUserId(request);
        
        expect(result).toEqual({
          isValid: false,
          userId: null,
          error: 'Invalid JWT structure: expected 3 parts, got 2'
        });
      });

      test('should return invalid when JWT has too many parts', () => {
        const request = createMockRequest('Bearer part1.part2.part3.part4');
        
        const result = validateAndExtractUserId(request);
        
        expect(result).toEqual({
          isValid: false,
          userId: null,
          error: 'Invalid JWT structure: expected 3 parts, got 4'
        });
      });

      test('should return invalid when JWT has only one part', () => {
        const request = createMockRequest('Bearer singlepart');
        
        const result = validateAndExtractUserId(request);
        
        expect(result).toEqual({
          isValid: false,
          userId: null,
          error: 'Invalid JWT structure: expected 3 parts, got 1'
        });
      });
    });

    describe('JWT Verification', () => {
      test('should successfully validate and extract userId from valid token', () => {
        const mockDecoded = { userId: 'user123', email: 'test@example.com' };
        mockJwt.verify.mockReturnValue(mockDecoded as any);
        
        const request = createMockRequest('Bearer valid.jwt.token');
        
        const result = validateAndExtractUserId(request);
        
        expect(result).toEqual({
          isValid: true,
          userId: 'user123'
        });
        
        expect(mockJwt.verify).toHaveBeenCalledWith(
          'valid.jwt.token',
          'test-jwt-secret-key-for-testing-purposes-only'
        );
      });

      test('should return invalid when decoded token has no userId', () => {
        const mockDecoded = { email: 'test@example.com' }; // Missing userId
        mockJwt.verify.mockReturnValue(mockDecoded as any);
        
        const request = createMockRequest('Bearer valid.jwt.token');
        
        const result = validateAndExtractUserId(request);
        
        expect(result).toEqual({
          isValid: false,
          userId: null,
          error: 'Token does not contain userId'
        });
      });

      test('should handle JWT verification errors', () => {
        // Create a proper mock error that matches jwt.JsonWebTokenError behavior
        const jwtError = Object.assign(new Error('invalid signature'), {
          name: 'JsonWebTokenError'
        });
        
        // Make it an instance of jwt.JsonWebTokenError for instanceof check
        Object.setPrototypeOf(jwtError, jwt.JsonWebTokenError.prototype);
        
        mockJwt.verify.mockImplementation(() => {
          throw jwtError;
        });
        
        const request = createMockRequest('Bearer invalid.jwt.token');
        
        const result = validateAndExtractUserId(request);
        
        expect(result).toEqual({
          isValid: false,
          userId: null,
          error: 'JWT Error: invalid signature'
        });
      });

      test('should handle token expiration errors', () => {
        // Create a proper mock error that matches jwt.TokenExpiredError behavior
        const expiredError = Object.assign(new Error('jwt expired'), {
          name: 'TokenExpiredError',
          expiredAt: new Date()
        });
        
        // Make it an instance of jwt.JsonWebTokenError for instanceof check
        Object.setPrototypeOf(expiredError, jwt.JsonWebTokenError.prototype);
        
        mockJwt.verify.mockImplementation(() => {
          throw expiredError;
        });
        
        const request = createMockRequest('Bearer expired.jwt.token');
        
        const result = validateAndExtractUserId(request);
        
        expect(result).toEqual({
          isValid: false,
          userId: null,
          error: 'JWT Error: jwt expired'
        });
      });

      test('should handle malformed JWT errors', () => {
        // Create a proper mock error that matches jwt.JsonWebTokenError behavior
        const malformedError = Object.assign(new Error('jwt malformed'), {
          name: 'JsonWebTokenError'
        });
        
        // Make it an instance of jwt.JsonWebTokenError for instanceof check
        Object.setPrototypeOf(malformedError, jwt.JsonWebTokenError.prototype);
        
        mockJwt.verify.mockImplementation(() => {
          throw malformedError;
        });
        
        const request = createMockRequest('Bearer malformed.jwt.token');
        
        const result = validateAndExtractUserId(request);
        
        expect(result).toEqual({
          isValid: false,
          userId: null,
          error: 'JWT Error: jwt malformed'
        });
      });

      test('should handle generic errors', () => {
        const genericError = new Error('Database connection failed');
        mockJwt.verify.mockImplementation(() => {
          throw genericError;
        });
        
        const request = createMockRequest('Bearer valid.jwt.token');
        
        const result = validateAndExtractUserId(request);
        
        expect(result).toEqual({
          isValid: false,
          userId: null,
          error: 'Database connection failed'
        });
      });

      test('should handle unknown errors', () => {
        mockJwt.verify.mockImplementation(() => {
          throw 'unknown error type';
        });
        
        const request = createMockRequest('Bearer valid.jwt.token');
        
        const result = validateAndExtractUserId(request);
        
        expect(result).toEqual({
          isValid: false,
          userId: null,
          error: 'Unknown error occurred'
        });
      });
    });

    describe('Edge Cases', () => {
      test('should handle normal Bearer token correctly', () => {
        const request = createMockRequest('Bearer valid.jwt.token');
        
        const mockDecoded = { userId: 'user123' };
        mockJwt.verify.mockReturnValue(mockDecoded as any);
        
        const result = validateAndExtractUserId(request);
        
        expect(result).toEqual({
          isValid: true,
          userId: 'user123'
        });
      });

      test('should handle Bearer with different casing', () => {
        const request = createMockRequest('bearer valid.jwt.token');
        
        const result = validateAndExtractUserId(request);
        
        expect(result).toEqual({
          isValid: false,
          userId: null,
          error: 'Authorization header must start with Bearer'
        });
      });

      test('should handle multiple spaces after Bearer (results in empty token)', () => {
        const request = createMockRequest('Bearer    valid.jwt.token');
        
        // With multiple spaces, split(' ')[1] will be an empty string
        const result = validateAndExtractUserId(request);
        
        expect(result).toEqual({
          isValid: false,
          userId: null,
          error: 'Token is empty, null, or undefined'
        });
      });
      
      test('should handle trailing spaces in header', () => {
        const request = createMockRequest('Bearer valid.jwt.token   ');
        
        const mockDecoded = { userId: 'user123' };
        mockJwt.verify.mockReturnValue(mockDecoded as any);
        
        const result = validateAndExtractUserId(request);
        
        expect(result).toEqual({
          isValid: true,
          userId: 'user123'
        });
      });
    });
  });

  describe('getUserIdFromToken (Backward Compatibility)', () => {
    const createMockRequest = (authHeader: string | null) => {
      const headers = new Headers();
      if (authHeader) {
        headers.set('authorization', authHeader);
      }
      return {
        headers: {
          get: (name: string) => headers.get(name)
        }
      } as any;
    };

    test('should return userId when token is valid', () => {
      const mockDecoded = { userId: 'user123', email: 'test@example.com' };
      mockJwt.verify.mockReturnValue(mockDecoded as any);
      
      const request = createMockRequest('Bearer valid.jwt.token');
      
      const result = getUserIdFromToken(request);
      
      expect(result).toBe('user123');
    });

    test('should return null when token is invalid', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const request = createMockRequest('Bearer invalid.token');
      
      const result = getUserIdFromToken(request);
      
      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Token validation failed:',
        'Invalid JWT structure: expected 3 parts, got 2'
      );
      
      consoleErrorSpy.mockRestore();
    });

    test('should return null when no authorization header', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const request = createMockRequest(null);
      
      const result = getUserIdFromToken(request);
      
      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Token validation failed:',
        'No authorization header found'
      );
      
      consoleErrorSpy.mockRestore();
    });

    test('should return null when JWT verification fails', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Create a proper mock error that matches jwt.JsonWebTokenError behavior
      const jwtError = Object.assign(new Error('invalid signature'), {
        name: 'JsonWebTokenError'
      });
      
      // Make it an instance of jwt.JsonWebTokenError for instanceof check
      Object.setPrototypeOf(jwtError, jwt.JsonWebTokenError.prototype);
      
      mockJwt.verify.mockImplementation(() => {
        throw jwtError;
      });
      
      const request = createMockRequest('Bearer invalid.jwt.token');
      
      const result = getUserIdFromToken(request);
      
      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Token validation failed:',
        'JWT Error: invalid signature'
      );
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Real-world Scenarios', () => {
    const createMockRequest = (authHeader: string | null) => {
      const headers = new Headers();
      if (authHeader) {
        headers.set('authorization', authHeader);
      }
      return {
        headers: {
          get: (name: string) => headers.get(name)
        }
      } as any;
    };

    test('should handle valid production-like token', () => {
      const mockDecoded = { 
        userId: '507f1f77bcf86cd799439011',
        email: 'user@skillswaphub.com',
        name: 'John Doe',
        iat: 1642678800,
        exp: 1642765200
      };
      mockJwt.verify.mockReturnValue(mockDecoded as any);
      
      const request = createMockRequest('Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJlbWFpbCI6InVzZXJAc2tpbGxzd2FwaHViLmNvbSIsIm5hbWUiOiJKb2huIERvZSIsImlhdCI6MTY0MjY3ODgwMCwiZXhwIjoxNjQyNzY1MjAwfQ.signature');
      
      const result = validateAndExtractUserId(request);
      
      expect(result).toEqual({
        isValid: true,
        userId: '507f1f77bcf86cd799439011'
      });
    });

    test('should handle concurrent validation requests', async () => {
      const mockDecoded1 = { userId: 'user123' };
      const mockDecoded2 = { userId: 'user456' };
      
      mockJwt.verify
        .mockReturnValueOnce(mockDecoded1 as any)
        .mockReturnValueOnce(mockDecoded2 as any);
      
      const request1 = createMockRequest('Bearer token1.jwt.here');
      const request2 = createMockRequest('Bearer token2.jwt.here');
      
      const [result1, result2] = await Promise.all([
        Promise.resolve(validateAndExtractUserId(request1)),
        Promise.resolve(validateAndExtractUserId(request2))
      ]);
      
      expect(result1.userId).toBe('user123');
      expect(result2.userId).toBe('user456');
      expect(result1.isValid).toBe(true);
      expect(result2.isValid).toBe(true);
    });
  });
});