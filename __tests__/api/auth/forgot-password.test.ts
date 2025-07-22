/**
 * Authentication API Tests - Forgot Password Route
 * Tests for /api/forgot-password endpoint including OTP generation and email sending
 */

import { POST } from '@/app/api/forgot-password/route';
import dbConnect from '@/lib/db';
import User from '@/lib/models/userSchema';
import OtpVerification from '@/lib/models/otpVerificationSchema';
import sgMail from '@sendgrid/mail';

// Mock dependencies
jest.mock('@/lib/db');
jest.mock('@/lib/models/userSchema');
jest.mock('@/lib/models/otpVerificationSchema');
jest.mock('@sendgrid/mail');

const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>;
const mockUser = User as jest.Mocked<typeof User>;
const mockOtpVerification = OtpVerification as jest.Mocked<typeof OtpVerification>;
const mockSgMail = sgMail as jest.Mocked<typeof sgMail>;

// Mock environment variables
const originalEnv = process.env;

describe('/api/forgot-password', () => {
  beforeAll(() => {
    process.env.SENDGRID_API_KEY = 'test-sendgrid-api-key';
    process.env.SENDGRID_FROM_EMAIL = 'noreply@skillswaphub.com';
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockDbConnect.mockResolvedValue(undefined);
    
    // Mock static methods
    mockOtpVerification.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 1 });
    mockOtpVerification.create = jest.fn().mockResolvedValue({
      _id: 'otp123',
      userId: 'user123',
      otp: '123456',
      expiresAt: new Date(),
      used: false
    });
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Environment Variables', () => {
    test('should require SENDGRID_API_KEY environment variable', () => {
      delete process.env.SENDGRID_API_KEY;

      expect(() => {
        jest.resetModules();
        require('@/app/api/forgot-password/route');
      }).toThrow('SENDGRID_API_KEY is not defined');

      // Restore for other tests
      process.env.SENDGRID_API_KEY = 'test-sendgrid-api-key';
    });
  });

  describe('Input Validation', () => {
    test('should return 400 when email is missing', async () => {
      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Email is required');
    });

    test('should return 400 when email is null', async () => {
      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: null })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Email is required');
    });

    test('should return 400 when email is empty string', async () => {
      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: '' })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Email is required');
    });
  });

  describe('Security - Email Enumeration Prevention', () => {
    test('should return success even when user does not exist (prevents email enumeration)', async () => {
      mockUser.findOne.mockResolvedValue(null);

      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'nonexistent@example.com' })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('If your email is registered, you will receive a reset code shortly');

      expect(mockUser.findOne).toHaveBeenCalledWith({ email: 'nonexistent@example.com' });
      
      // Should not attempt to send email or create OTP for non-existent user
      expect(mockOtpVerification.deleteMany).not.toHaveBeenCalled();
      expect(mockOtpVerification.create).not.toHaveBeenCalled();
      expect(mockSgMail.send).not.toHaveBeenCalled();
    });
  });

  describe('OTP Generation and Email Sending', () => {
    const mockUserData = {
      _id: 'user123',
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe'
    };

    beforeEach(() => {
      mockSgMail.send.mockResolvedValue([{}, {}] as any);
    });

    test('should successfully generate OTP and send email for existing user', async () => {
      mockUser.findOne.mockResolvedValue(mockUserData);

      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'john@example.com' })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('If your email is registered, you will receive a reset code shortly');

      // Should find the user
      expect(mockUser.findOne).toHaveBeenCalledWith({ email: 'john@example.com' });

      // Should delete existing OTP records
      expect(mockOtpVerification.deleteMany).toHaveBeenCalledWith({ userId: 'user123' });

      // Should create new OTP record
      expect(mockOtpVerification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user123',
          email: 'john@example.com',
          otp: expect.stringMatching(/^\d{6}$/), // 6-digit OTP
          expiresAt: expect.any(Date),
          used: false
        })
      );

      // Should send email
      expect(mockSgMail.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'john@example.com',
          from: 'noreply@skillswaphub.com',
          subject: 'SkillSwap Hub Password Reset',
          text: expect.stringContaining('Your password reset code is:'),
          html: expect.stringContaining('Password Reset')
        })
      );
    });

    test('should generate 6-digit OTP', async () => {
      mockUser.findOne.mockResolvedValue(mockUserData);

      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'john@example.com' })
      });

      await POST(request);

      const createCall = mockOtpVerification.create.mock.calls[0][0];
      expect(createCall.otp).toMatch(/^\d{6}$/);
      expect(parseInt(createCall.otp)).toBeGreaterThanOrEqual(100000);
      expect(parseInt(createCall.otp)).toBeLessThanOrEqual(999999);
    });

    test('should set OTP expiry to 5 minutes from now', async () => {
      const beforeRequest = Date.now();
      mockUser.findOne.mockResolvedValue(mockUserData);

      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'john@example.com' })
      });

      await POST(request);

      const afterRequest = Date.now();
      const createCall = mockOtpVerification.create.mock.calls[0][0];
      const expiryTime = new Date(createCall.expiresAt).getTime();

      // Should be approximately 5 minutes (300,000 ms) from request time
      const expectedMinExpiry = beforeRequest + 5 * 60 * 1000;
      const expectedMaxExpiry = afterRequest + 5 * 60 * 1000;

      expect(expiryTime).toBeGreaterThanOrEqual(expectedMinExpiry);
      expect(expiryTime).toBeLessThanOrEqual(expectedMaxExpiry);
    });

    test('should include OTP in email content', async () => {
      mockUser.findOne.mockResolvedValue(mockUserData);

      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'john@example.com' })
      });

      await POST(request);

      const createCall = mockOtpVerification.create.mock.calls[0][0];
      const generatedOTP = createCall.otp;

      const emailCall = mockSgMail.send.mock.calls[0][0];
      const emailData = Array.isArray(emailCall) ? emailCall[0] : emailCall;
      
      expect(emailData.text).toContain(generatedOTP);
      expect(emailData.html).toContain(generatedOTP);
    });

    test('should clean up existing OTP records before creating new one', async () => {
      mockUser.findOne.mockResolvedValue(mockUserData);

      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'john@example.com' })
      });

      await POST(request);

      // Should delete existing records first
      expect(mockOtpVerification.deleteMany).toHaveBeenCalledWith({ userId: 'user123' });
      
      // Then create new record
      expect(mockOtpVerification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user123',
          email: 'john@example.com',
          otp: expect.stringMatching(/^\d{6}$/),
          expiresAt: expect.any(Date),
          used: false
        })
      );
    });
  });

  describe('Email Configuration', () => {
    const mockUserData = {
      _id: 'user123',
      email: 'john@example.com'
    };

    test('should use default from email when SENDGRID_FROM_EMAIL is not set', async () => {
      delete process.env.SENDGRID_FROM_EMAIL;
      mockUser.findOne.mockResolvedValue(mockUserData);
      mockSgMail.send.mockResolvedValue([{}, {}] as any);

      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'john@example.com' })
      });

      await POST(request);

      const emailCall = mockSgMail.send.mock.calls[0][0];
      const fromValue = Array.isArray(emailCall) ? emailCall[0].from : emailCall.from;
      expect(fromValue).toBe('noreply@skillswaphub.com');

      // Restore for other tests
      process.env.SENDGRID_FROM_EMAIL = 'noreply@skillswaphub.com';
    });

    test('should use configured from email', async () => {
      process.env.SENDGRID_FROM_EMAIL = 'custom@example.com';
      mockUser.findOne.mockResolvedValue(mockUserData);
      mockSgMail.send.mockResolvedValue([{}, {}] as any);

      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'john@example.com' })
      });

      await POST(request);

      const emailCall = mockSgMail.send.mock.calls[0][0];
      const fromValue = Array.isArray(emailCall) ? emailCall[0].from : emailCall.from;
      expect(fromValue).toBe('custom@example.com');
    });
  });

  describe('Error Handling', () => {
    test('should handle database connection errors', async () => {
      mockDbConnect.mockRejectedValue(new Error('Database connection failed'));

      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'john@example.com' })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('An error occurred while processing your request');
    });

    test('should handle email sending errors', async () => {
      const mockUserData = {
        _id: 'user123',
        email: 'john@example.com'
      };

      mockUser.findOne.mockResolvedValue(mockUserData);
      mockSgMail.send.mockRejectedValue(new Error('Email service unavailable'));

      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'john@example.com' })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('An error occurred while processing your request');
    });

    test('should handle OTP creation errors', async () => {
      const mockUserData = {
        _id: 'user123',
        email: 'john@example.com'
      };

      mockUser.findOne.mockResolvedValue(mockUserData);
      mockOtpVerification.create.mockRejectedValue(new Error('Database write error'));

      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'john@example.com' })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('An error occurred while processing your request');
    });

    test('should handle malformed JSON', async () => {
      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('An error occurred while processing your request');
    });
  });
});