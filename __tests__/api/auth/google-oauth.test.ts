/**
 * Authentication API Tests - Google OAuth Route
 * Tests for /api/auth/google endpoint including OAuth2 flow and user linking
 */

import { POST } from '@/app/api/auth/google/route';
import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/userSchema';
import SuspendedUser from '@/lib/models/suspendedUserSchema';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

// Mock dependencies
jest.mock('@/lib/db');
jest.mock('@/lib/models/userSchema');
jest.mock('@/lib/models/suspendedUserSchema');
jest.mock('jsonwebtoken');
jest.mock('google-auth-library');

const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>;
const mockUser = User as jest.Mocked<typeof User>;
const mockSuspendedUser = SuspendedUser as jest.Mocked<typeof SuspendedUser>;
let jwtSignSpy: jest.SpyInstance;
const mockJwt = jwt as jest.Mocked<typeof jwt>;
const mockOAuth2Client = OAuth2Client as jest.MockedClass<typeof OAuth2Client>;

// Mock environment variables
const originalEnv = process.env;

describe('/api/auth/google', () => {
  const mockTicket = {
    getPayload: jest.fn()
  };

  const mockClientInstance = {
    verifyIdToken: jest.fn()
  };

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-only';
    process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockDbConnect.mockResolvedValue(undefined);
    mockOAuth2Client.mockImplementation(() => mockClientInstance as any);
    if (jwtSignSpy) jwtSignSpy.mockRestore();
  });
  // Helper to create a NextRequest from a standard Request
  function createNextRequest(input: Request): NextRequest {
    
    return input as unknown as NextRequest;
  }

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Environment Variables', () => {
    test('should require JWT_SECRET environment variable', () => {
      delete process.env.JWT_SECRET;

      expect(() => {
        jest.resetModules();
        require('@/app/api/auth/google/route');
      }).toThrow('JWT_SECRET is not defined');

      // Restore for other tests
      process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-only';
    });

    test('should require GOOGLE_CLIENT_ID environment variable', () => {
      delete process.env.GOOGLE_CLIENT_ID;

      expect(() => {
        jest.resetModules();
        require('@/app/api/auth/google/route');
      }).toThrow('GOOGLE_CLIENT_ID is not defined');

      // Restore for other tests
      process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
    });
  });

  describe('Input Validation', () => {
    test('should return 400 when credential is missing', async () => {

      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const response = await POST(createNextRequest(request));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Google credential is required');
    });

    test('should return 400 when credential is null', async () => {

      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: null })
      });
      const response = await POST(createNextRequest(request));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Google credential is required');
    });

    test('should return 400 when credential is empty string', async () => {

      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: '' })
      });
      const response = await POST(createNextRequest(request));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Google credential is required');
    });
  });

  describe('Google Token Validation', () => {
    test('should return 401 when Google token is invalid', async () => {
      mockTicket.getPayload.mockReturnValue(null);


      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: 'invalid.token.here' })
      });
      const response = await POST(createNextRequest(request));
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Invalid Google token');

      expect(mockClientInstance.verifyIdToken).toHaveBeenCalledWith({
        idToken: 'invalid.token.here',
        audience: 'test-google-client-id'
      });
    });

    test('should return 401 when Google token verification fails', async () => {
      mockClientInstance.verifyIdToken.mockRejectedValue(new Error('Token verification failed'));


      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: 'invalid.token.here' })
      });
      const response = await POST(createNextRequest(request));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Google authentication failed');
    });

    test('should return 400 when required user information is missing from Google', async () => {
      // Missing lastName
      const incompletePayload = {
        sub: 'google123',
        email: 'john@example.com',
        given_name: 'John',
        // family_name: 'Doe', // Missing
        picture: 'https://example.com/photo.jpg'
      };

      mockTicket.getPayload.mockReturnValue(incompletePayload);


      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: 'valid.token.here' })
      });
      const response = await POST(createNextRequest(request));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Required user information not available from Google');
    });
  });

  describe('User Suspension Checks', () => {
    const validGooglePayload = {
      sub: 'google123',
      email: 'john@example.com',
      given_name: 'John',
      family_name: 'Doe',
      picture: 'https://example.com/photo.jpg'
    };

    beforeEach(() => {
      mockTicket.getPayload.mockReturnValue(validGooglePayload);
    });

    test('should return 403 when user is suspended', async () => {
      const suspendedUserData = {
        email: 'john@example.com',
        suspensionReason: 'Terms of Service violation',
        suspendedAt: new Date(),
        suspensionNotes: 'Inappropriate behavior in forum'
      };

      mockSuspendedUser.findOne.mockResolvedValue(suspendedUserData);

      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: 'valid.token.here' })
      });

      const response = await POST(createNextRequest(request));
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.suspended).toBe(true);
      expect(data.message).toContain('suspended');
      expect(data.suspensionDetails).toEqual({
        reason: 'Terms of Service violation',
        suspendedAt: suspendedUserData.suspendedAt.toISOString(),
        notes: 'Inappropriate behavior in forum'
      });

      expect(mockSuspendedUser.findOne).toHaveBeenCalledWith({ email: 'john@example.com' });
    });
  });

  describe('User Authentication Flow', () => {
    const validGooglePayload = {
      sub: 'google123',
      email: 'john@example.com',
      given_name: 'John',
      family_name: 'Doe',
      picture: 'https://example.com/photo.jpg'
    };

    beforeEach(() => {
      mockTicket.getPayload.mockReturnValue(validGooglePayload);
      mockSuspendedUser.findOne.mockResolvedValue(null);
    });

    describe('Existing Google User', () => {
      test('should successfully login existing Google user', async () => {
        const existingGoogleUser = {
          _id: 'user123',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          googleId: 'google123',
          isGoogleUser: true,
          avatar: 'https://example.com/photo.jpg',
          profileCompleted: true,
          phone: '+1234567890',
          title: 'Software Developer'
        };

        const mockToken = 'jwt.token.here';

        mockUser.findOne
          .mockResolvedValueOnce(existingGoogleUser) // First call by googleId
          .mockResolvedValueOnce(null); // Second call by email (not needed)

        jwtSignSpy = jest.spyOn(jwt, 'sign').mockReturnValue(mockToken as any);

        const request = new Request('http://localhost', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential: 'valid.token.here' })
        });

        const response = await POST(createNextRequest(request));
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.message).toBe('Google authentication successful');
        expect(data.token).toBe(mockToken);
        expect(data.needsProfileCompletion).toBe(false);
        expect(data.user).toEqual({
          _id: 'user123',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          title: 'Software Developer',
          avatar: 'https://example.com/photo.jpg',
          isGoogleUser: true,
          profileCompleted: true
        });

        expect(mockUser.findOne).toHaveBeenCalledWith({ googleId: 'google123' });
      });
    });

    describe('Linking Google to Existing Email User', () => {
      test('should link Google account to existing email/password user', async () => {
        const existingEmailUser = {
          _id: 'user123',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          googleId: null,
          isGoogleUser: false,
          avatar: null,
          profileCompleted: false,
          phone: '+1234567890',
          title: 'Software Developer',
          save: jest.fn().mockResolvedValue(true)
        };

        const mockToken = 'jwt.token.here';

        mockUser.findOne
          .mockResolvedValueOnce(null) // First call by googleId
          .mockResolvedValueOnce(existingEmailUser); // Second call by email

        jwtSignSpy = jest.spyOn(jwt, 'sign').mockReturnValue(mockToken as any);

        const request = new Request('http://localhost', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential: 'valid.token.here' })
        });

        const response = await POST(createNextRequest(request));
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.needsProfileCompletion).toBe(false);

        // Should update existing user with Google info
        expect(existingEmailUser.googleId).toBe('google123');
        expect(existingEmailUser.isGoogleUser).toBe(true);
        expect(existingEmailUser.avatar).toBe('https://example.com/photo.jpg');
        expect(existingEmailUser.profileCompleted).toBe(true);
        expect(existingEmailUser.save).toHaveBeenCalled();
      });

      test('should preserve existing avatar when linking Google account', async () => {
        const existingEmailUser = {
          _id: 'user123',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          googleId: null,
          isGoogleUser: false,
          avatar: 'https://existing.com/avatar.jpg', // Existing avatar
          profileCompleted: false,
          save: jest.fn().mockResolvedValue(true)
        };

        mockUser.findOne
          .mockResolvedValueOnce(null) // First call by googleId
          .mockResolvedValueOnce(existingEmailUser); // Second call by email

        jwtSignSpy = jest.spyOn(jwt, 'sign').mockReturnValue('token' as any);

        const request = new Request('http://localhost', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential: 'valid.token.here' })
        });

        await POST(createNextRequest(request));

        // Should keep existing avatar, not overwrite with Google's
        expect(existingEmailUser.avatar).toBe('https://existing.com/avatar.jpg');
      });
    });

    describe('New Google User Creation', () => {
      test('should create new user for new Google account', async () => {
        const newGoogleUser = {
          _id: 'newuser123',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          googleId: 'google123',
          isGoogleUser: true,
          avatar: 'https://example.com/photo.jpg',
          profileCompleted: true,
          phone: '',
          title: '',
          save: jest.fn().mockResolvedValue(true)
        };

        const mockToken = 'jwt.token.here';

        mockUser.findOne
          .mockResolvedValueOnce(null) // First call by googleId
          .mockResolvedValueOnce(null); // Second call by email

        // @ts-expect-error: allow constructor mocking for test
        mockUser.mockImplementation(() => newGoogleUser as any);
        jwtSignSpy = jest.spyOn(jwt, 'sign').mockReturnValue(mockToken as any);

        const request = new Request('http://localhost', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential: 'valid.token.here' })
        });

        const response = await POST(createNextRequest(request));
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.needsProfileCompletion).toBe(false);

        expect(mockUser).toHaveBeenCalledWith({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          googleId: 'google123',
          isGoogleUser: true,
          avatar: 'https://example.com/photo.jpg',
          profileCompleted: true,
          phone: '',
          title: ''
        });

        expect(newGoogleUser.save).toHaveBeenCalled();
      });

      test('should handle Google user without profile picture', async () => {
        const googlePayloadWithoutPicture = {
          sub: 'google123',
          email: 'john@example.com',
          given_name: 'John',
          family_name: 'Doe',
          picture: undefined
        };

        mockTicket.getPayload.mockReturnValue(googlePayloadWithoutPicture);

        const newGoogleUser = {
          _id: 'newuser123',
          save: jest.fn().mockResolvedValue(true)
        };

        mockUser.findOne.mockResolvedValue(null);
        // @ts-expect-error: allow constructor mocking for test
        mockUser.mockImplementation(() => newGoogleUser as any);
        jwtSignSpy = jest.spyOn(jwt, 'sign').mockReturnValue('token' as any);

        const request = new Request('http://localhost', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential: 'valid.token.here' })
        });

        await POST(createNextRequest(request));

        expect(mockUser).toHaveBeenCalledWith({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          googleId: 'google123',
          isGoogleUser: true,
          avatar: undefined,
          profileCompleted: true,
          phone: '',
          title: ''
        });
      });
    });
  });

  describe('JWT Token Generation', () => {
    const validGooglePayload = {
      sub: 'google123',
      email: 'john@example.com',
      given_name: 'John',
      family_name: 'Doe',
      picture: 'https://example.com/photo.jpg'
    };

    beforeEach(() => {
      mockTicket.getPayload.mockReturnValue(validGooglePayload);
      mockSuspendedUser.findOne.mockResolvedValue(null);
    });

    test('should generate JWT token with correct payload and 24h expiry', async () => {
      const mockGoogleUser = {
        _id: 'user123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com'
      };

      const mockToken = 'jwt.token.here';

      mockUser.findOne.mockResolvedValue(mockGoogleUser);
      jwtSignSpy = jest.spyOn(jwt, 'sign').mockReturnValue(mockToken as any);

      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: 'valid.token.here' })
      });

      await POST(createNextRequest(request));

      expect(mockJwt.sign).toHaveBeenCalledWith(
        {
          userId: 'user123',
          email: 'john@example.com',
          name: 'John Doe'
        },
        'test-jwt-secret-key-for-testing-purposes-only',
        { expiresIn: '24h' }
      );
    });
  });

  describe('Profile Completion', () => {
    const validGooglePayload = {
      sub: 'google123',
      email: 'john@example.com',
      given_name: 'John',
      family_name: 'Doe',
      picture: 'https://example.com/photo.jpg'
    };

    beforeEach(() => {
      mockTicket.getPayload.mockReturnValue(validGooglePayload);
      mockSuspendedUser.findOne.mockResolvedValue(null);
    });

    test('should mark Google users as having completed profile', async () => {
      const incompleteMockUser = {
        _id: 'user123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        profileCompleted: false,
        save: jest.fn().mockResolvedValue(true)
      };

      mockUser.findOne.mockResolvedValue(incompleteMockUser);
      jwtSignSpy = jest.spyOn(jwt, 'sign').mockReturnValue('token' as any);

      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: 'valid.token.here' })
      });

      await POST(createNextRequest(request));

      expect(incompleteMockUser.profileCompleted).toBe(true);
      expect(incompleteMockUser.save).toHaveBeenCalled();
    });

    test('should always return needsProfileCompletion as false for Google users', async () => {
      const mockGoogleUser = {
        _id: 'user123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '',
        title: '',
        profileCompleted: true
      };

      mockUser.findOne.mockResolvedValue(mockGoogleUser);
      jwtSignSpy = jest.spyOn(jwt, 'sign').mockReturnValue('token' as any);

      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: 'valid.token.here' })
      });

      const response = await POST(createNextRequest(request));
      const data = await response.json();

      expect(data.needsProfileCompletion).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should handle database connection errors', async () => {
      mockDbConnect.mockRejectedValue(new Error('Database connection failed'));

      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: 'valid.token.here' })
      });

      const response = await POST(createNextRequest(request));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Google authentication failed');
    });

    test('should handle user save errors', async () => {
      const validGooglePayload = {
        sub: 'google123',
        email: 'john@example.com',
        given_name: 'John',
        family_name: 'Doe',
        picture: 'https://example.com/photo.jpg'
      };

      mockTicket.getPayload.mockReturnValue(validGooglePayload);
      mockSuspendedUser.findOne.mockResolvedValue(null);

      const newGoogleUser = {
        _id: 'newuser123',
        save: jest.fn().mockRejectedValue(new Error('Database save failed'))
      };

      mockUser.findOne.mockResolvedValue(null);
      // @ts-expect-error: allow constructor mocking for test
      mockUser.mockImplementation(() => newGoogleUser as any);

      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: 'valid.token.here' })
      });

      const response = await POST(createNextRequest(request));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Google authentication failed');
    });

    test('should handle malformed JSON', async () => {
      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      });

      const response = await POST(createNextRequest(request));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Google authentication failed');
    });
  });
});