/**
 * Authentication API Tests - Verify OTP Route
 * Tests for /api/verify-otp endpoint including OTP validation and reset token generation
 */

import { POST } from '@/app/api/verify-otp/route';
import dbConnect from '@/lib/db';
import User from '@/lib/models/userSchema';
import OtpVerification from '@/lib/models/otpVerificationSchema';
import jwt from 'jsonwebtoken';

// Mock dependencies
jest.mock('@/lib/db');
jest.mock('@/lib/models/userSchema');
jest.mock('@/lib/models/otpVerificationSchema');
jest.mock('jsonwebtoken');

const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>;
const mockUser = User as jest.Mocked<typeof User>;
const mockOtpVerification = OtpVerification as jest.Mocked<typeof OtpVerification>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;
// Helper for type-safe mocking of jwt.sign
const mockJwtSign = jwt.sign as unknown as jest.Mock;

// Polyfill global Request for Node.js/Jest if not present
if (typeof global.Request === 'undefined') {
  global.Request = require('node-fetch').Request;
}

// Mock environment variables
const originalEnv = { ...process.env };

describe('/api/verify-otp', () => {
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
        body: JSON.stringify({ otp: '123456' })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Email and OTP are required');
    });

    test('should return 400 when OTP is missing', async () => {
      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'john@example.com' })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Email and OTP are required');
    });

    test('should return 400 when both email and OTP are missing', async () => {
      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Email and OTP are required');
    });

    test('should return 400 when email is empty string', async () => {
      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: '', otp: '123456' })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Email and OTP are required');
    });

    test('should return 400 when OTP is empty string', async () => {
      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'john@example.com', otp: '' })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Email and OTP are required');
    });
  });

  describe('User Validation', () => {
    test('should return 401 when user does not exist', async () => {
      mockUser.findOne.mockResolvedValue(null);

      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          otp: '123456'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Invalid email or OTP');

      expect(mockUser.findOne).toHaveBeenCalledWith({ email: 'nonexistent@example.com' });
    });
  });

  describe('OTP Validation', () => {
    const userObj = {
      _id: 'user123',
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe'
    };

    beforeEach(() => {
      mockUser.findOne.mockResolvedValue(userObj);
    });

    test('should return 401 when OTP record does not exist', async () => {
      mockOtpVerification.findOne.mockResolvedValue(null);

      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'john@example.com',
          otp: '123456'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Invalid or expired OTP');

      expect(mockOtpVerification.findOne).toHaveBeenCalledWith({
        userId: 'user123',
        otp: '123456',
        used: false
      });
    });

    test('should return 401 when OTP is already used', async () => {
      const usedOtpRecord = {
        _id: 'otp123',
        userId: 'user123',
        otp: '123456',
        used: true,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes future
        save: jest.fn()
      };

      mockOtpVerification.findOne.mockResolvedValue(null); // Should not find unused OTP

      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'john@example.com',
          otp: '123456'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Invalid or expired OTP');

      // Should look for unused OTP
      expect(mockOtpVerification.findOne).toHaveBeenCalledWith({
        userId: 'user123',
        otp: '123456',
        used: false
      });
    });

    test('should return 401 when OTP is expired', async () => {
      const expiredOtpRecord = {
        _id: 'otp123',
        userId: 'user123',
        otp: '123456',
        used: false,
        expiresAt: new Date(Date.now() - 60 * 1000), // 1 minute ago (expired)
        save: jest.fn()
      };

      mockOtpVerification.findOne.mockResolvedValue(expiredOtpRecord);

      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'john@example.com',
          otp: '123456'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toBe('OTP has expired');
    });

    test('should successfully verify valid OTP and return reset token', async () => {
      const validOtpRecord = {
        _id: 'otp123',
        userId: 'user123',
        otp: '123456',
        used: false,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes future
        save: jest.fn().mockResolvedValue(true)
      };

      const mockResetToken = 'reset.token.here';

      mockOtpVerification.findOne.mockResolvedValue(validOtpRecord);
      mockJwtSign.mockReturnValue(mockResetToken);

      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'john@example.com',
          otp: '123456'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('OTP verified successfully');
      expect(data.resetToken).toBe(mockResetToken);

      // Should mark OTP as used
      expect(validOtpRecord.used).toBe(true);
      expect(validOtpRecord.save).toHaveBeenCalled();

      // Should generate reset token with correct payload
      expect(mockJwt.sign).toHaveBeenCalledWith(
        { userId: 'user123', email: 'john@example.com' },
        'test-jwt-secret-key-for-testing-purposes-only',
        { expiresIn: '15m' }
      );
    });

    test('should handle edge case where OTP expires exactly at verification time', async () => {
      const justExpiredOtpRecord = {
        _id: 'otp123',
        userId: 'user123',
        otp: '123456',
        used: false,
        expiresAt: new Date(Date.now() - 100), // Just expired (100ms ago)
        save: jest.fn()
      };

      mockOtpVerification.findOne.mockResolvedValue(justExpiredOtpRecord);

      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'john@example.com',
          otp: '123456'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toBe('OTP has expired');
    });

    test('should handle OTP record save failure', async () => {
      const validOtpRecord = {
        _id: 'otp123',
        userId: 'user123',
        otp: '123456',
        used: false,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        save: jest.fn().mockRejectedValue(new Error('Database save failed'))
      };

      mockOtpVerification.findOne.mockResolvedValue(validOtpRecord);

      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'john@example.com',
          otp: '123456'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('An error occurred while verifying OTP');
    });
  });

  describe('Reset Token Generation', () => {
    test('should generate reset token with 15 minute expiry', async () => {
      const userObj = {
        _id: 'user123',
        email: 'john@example.com'
      };

      const validOtpRecord = {
        _id: 'otp123',
        userId: 'user123',
        otp: '123456',
        used: false,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        save: jest.fn().mockResolvedValue(true)
      };

      mockUser.findOne.mockResolvedValue(userObj);
      mockOtpVerification.findOne.mockResolvedValue(validOtpRecord);
      mockJwtSign.mockReturnValue('reset.token.here');

      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'john@example.com',
          otp: '123456'
        })
      });

      await POST(request);

      expect(mockJwt.sign).toHaveBeenCalledWith(
        { userId: 'user123', email: 'john@example.com' },
        'test-jwt-secret-key-for-testing-purposes-only',
        { expiresIn: '15m' }
      );
    });

    test('should include correct user information in reset token', async () => {
      const userObj = {
        _id: 'user456',
        email: 'jane@example.com'
      };

      const validOtpRecord = {
        _id: 'otp456',
        userId: 'user456',
        otp: '654321',
        used: false,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        save: jest.fn().mockResolvedValue(true)
      };

      mockUser.findOne.mockResolvedValue(userObj);
      mockOtpVerification.findOne.mockResolvedValue(validOtpRecord);
      mockJwtSign.mockReturnValue('different.reset.token');

      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'jane@example.com',
          otp: '654321'
        })
      });

      await POST(request);

      expect(mockJwt.sign).toHaveBeenCalledWith(
        { userId: 'user456', email: 'jane@example.com' },
        'test-jwt-secret-key-for-testing-purposes-only',
        { expiresIn: '15m' }
      );
    });
  });

  describe('Database Operations', () => {
    test('should handle database connection errors', async () => {
      mockDbConnect.mockRejectedValue(new Error('Database connection failed'));

      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'john@example.com',
          otp: '123456'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('An error occurred while verifying OTP');
    });

    test('should handle user lookup errors', async () => {
      mockUser.findOne.mockRejectedValue(new Error('User query failed'));

      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'john@example.com',
          otp: '123456'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('An error occurred while verifying OTP');
    });
  });

  describe('Security Features', () => {
    test('should provide generic error message for security', async () => {
      const userObj = {
        _id: 'user123',
        email: 'john@example.com'
      };

      mockUser.findOne.mockResolvedValue(userObj);
      mockOtpVerification.findOne.mockResolvedValue(null);

      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'john@example.com',
          otp: '999999'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      // Should not reveal specific reason (wrong OTP, already used, etc.)
      expect(data.message).toBe('Invalid or expired OTP');
      expect(data.message).not.toContain('does not exist');
      expect(data.message).not.toContain('already used');
      expect(data.message).not.toContain('wrong');
    });

    test('should handle malformed JSON gracefully', async () => {
      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('An error occurred while verifying OTP');
    });
  });
});