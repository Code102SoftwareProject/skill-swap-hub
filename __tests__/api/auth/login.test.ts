/**
 * Authentication API Tests - Login Route
 * Tests for /api/login endpoint including JWT token generation and validation
 */

import { POST } from '@/app/api/login/route';
import dbConnect from '@/lib/db';
import User from '@/lib/models/userSchema';
import SuspendedUser from '@/lib/models/suspendedUserSchema';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Polyfill global Request for Node.js/Jest if not present
if (typeof global.Request === 'undefined') {
  
  global.Request = require('node-fetch').Request;
}

// Mock dependencies
jest.mock('@/lib/db');
jest.mock('@/lib/models/userSchema');
jest.mock('@/lib/models/suspendedUserSchema');
jest.mock('jsonwebtoken');
jest.mock('bcryptjs');

const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>;
const mockUser = User as jest.Mocked<typeof User>;
const mockSuspendedUser = SuspendedUser as jest.Mocked<typeof SuspendedUser>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;
// Helper for type-safe mocking of jwt.sign
const mockJwtSign = jwt.sign as unknown as jest.Mock;


// Mock environment variables
const originalEnv = { ...process.env };

describe('/api/login', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-only';
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockDbConnect.mockResolvedValue(undefined);
    // Reset env for each test to avoid pollution
    process.env = { ...originalEnv };
    process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-only';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Input Validation', () => {
    test('should return 400 when email is missing', async () => {
      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'password123' })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Email and password are required');
    });

    test('should return 400 when password is missing', async () => {
      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Email and password are required');
    });

    test('should return 400 when both email and password are missing', async () => {
      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Email and password are required');
    });
  });

  describe('User Suspension Checks', () => {
    test('should return 403 when user is suspended', async () => {
      const suspendedUserData = {
        email: 'suspended@example.com',
        suspensionReason: 'Terms of Service violation',
        suspendedAt: new Date(),
        suspensionNotes: 'Inappropriate behavior in forum'
      };

      mockSuspendedUser.findOne.mockResolvedValue(suspendedUserData);

      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'suspended@example.com',
          password: 'password123'
        })
      });

      const response = await POST(request);
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

      expect(mockSuspendedUser.findOne).toHaveBeenCalledWith({ email: 'suspended@example.com' });
    });
  });

  describe('Authentication Flow', () => {
    test('should return 401 when user does not exist', async () => {
      mockSuspendedUser.findOne.mockResolvedValue(null);
      mockUser.findOne.mockResolvedValue(null);

      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Invalid email or password');

      expect(mockUser.findOne).toHaveBeenCalledWith({ email: 'nonexistent@example.com' });
    });

    test('should return 401 when password is incorrect', async () => {
      const mockUserData = {
        _id: 'user123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        comparePassword: jest.fn().mockResolvedValue(false)
      };

      mockSuspendedUser.findOne.mockResolvedValue(null);
      mockUser.findOne.mockResolvedValue(mockUserData);

      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'john@example.com',
          password: 'wrongpassword'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Invalid email or password');

      expect(mockUserData.comparePassword).toHaveBeenCalledWith('wrongpassword');
    });

    test('should successfully login with correct credentials (no remember me)', async () => {
      const mockUserData = {
        _id: 'user123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        comparePassword: jest.fn().mockResolvedValue(true)
      };

      const mockToken = 'jwt.token.here';

      mockSuspendedUser.findOne.mockResolvedValue(null);
      mockUser.findOne.mockResolvedValue(mockUserData);
      mockJwtSign.mockReturnValue(mockToken);

      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'john@example.com',
          password: 'correctpassword',
          rememberMe: false
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Login successful');
      expect(data.token).toBe(mockToken);
      expect(data.user).toEqual(expect.objectContaining({
        _id: 'user123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com'
      }));

      expect(mockUserData.comparePassword).toHaveBeenCalledWith('correctpassword');
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

    test('should successfully login with remember me option (extended expiry)', async () => {
      const mockUserData = {
        _id: 'user123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        comparePassword: jest.fn().mockResolvedValue(true)
      };

      const mockToken = 'jwt.token.here';

      mockSuspendedUser.findOne.mockResolvedValue(null);
      mockUser.findOne.mockResolvedValue(mockUserData);
      mockJwtSign.mockReturnValue(mockToken);

      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'john@example.com',
          password: 'correctpassword',
          rememberMe: true
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.token).toBe(mockToken);

      expect(mockJwt.sign).toHaveBeenCalledWith(
        {
          userId: 'user123',
          email: 'john@example.com',
          name: 'John Doe'
        },
        'test-jwt-secret-key-for-testing-purposes-only',
        { expiresIn: '30d' }
      );
    });
  });

  describe('Database Connection', () => {
    test('should handle database connection errors', async () => {
      mockDbConnect.mockRejectedValue(new Error('Database connection failed'));

      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('An error occurred during login');
    });
  });

  describe('Security Features', () => {
    test('should not expose sensitive information in error messages', async () => {
      mockSuspendedUser.findOne.mockResolvedValue(null);
      mockUser.findOne.mockResolvedValue(null);

      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      // Should not indicate whether email exists or not
      expect(data.message).toBe('Invalid email or password');
      expect(data.message).not.toContain('User not found');
      expect(data.message).not.toContain('email does not exist');
    });

    test('should require JWT_SECRET environment variable', () => {
      delete process.env.JWT_SECRET;

      expect(() => {
        jest.resetModules();
        require('@/app/api/login/route');
      }).toThrow('JWT_SECRET is not defined');

      // Restore for other tests
      process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-only';
    });
  });

  describe('Error Handling', () => {
    test('should handle unexpected errors gracefully', async () => {
      mockSuspendedUser.findOne.mockResolvedValue(null);
      mockUser.findOne.mockRejectedValue(new Error('Unexpected database error'));

      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('An error occurred during login');
    });
  });
});