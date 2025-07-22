/**
 * Authentication API Tests - Register Route
 * Tests for /api/register endpoint including user creation and validation
 */

import { POST } from '@/app/api/register/route';
import dbConnect from '@/lib/db';
import User from '@/lib/models/userSchema';
import SuspendedUser from '@/lib/models/suspendedUserSchema';
import jwt from 'jsonwebtoken';

// Mock dependencies
jest.mock('@/lib/db');
jest.mock('@/lib/models/userSchema');
jest.mock('@/lib/models/suspendedUserSchema');
jest.mock('jsonwebtoken');

const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>;
const mockUser = User as jest.Mocked<typeof User>;
const mockSuspendedUser = SuspendedUser as jest.Mocked<typeof SuspendedUser>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;
// Helper for type-safe mocking of jwt.sign
const mockJwtSign = jwt.sign as unknown as jest.Mock;

// Polyfill global Request for Node.js/Jest if not present
if (typeof global.Request === 'undefined') {
  global.Request = require('node-fetch').Request;
}

// Mock environment variables
const originalEnv = { ...process.env };

describe('/api/register', () => {
  const validUserData = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    title: 'Software Developer',
    password: 'securePassword123!'
  };

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
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'title', 'password'];

    requiredFields.forEach(field => {
      test(`should return 400 when ${field} is missing`, async () => {
        const incompleteData = { ...validUserData };
        delete incompleteData[field as keyof typeof incompleteData];

        const request = new Request('http://localhost', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(incompleteData)
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.message).toBe(`${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
      });
    });

    test('should return 400 when all fields are missing', async () => {
      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('FirstName is required');
    });
  });

  describe('Suspension Checks', () => {
    test('should return 403 when user email is suspended', async () => {
      const suspendedUserData = {
        email: 'suspended@example.com',
        phone: '+1234567890',
        suspensionReason: 'Terms violation',
        suspendedAt: new Date(),
        suspensionNotes: 'Inappropriate behavior'
      };

      mockSuspendedUser.findOne.mockResolvedValue(suspendedUserData);

      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validUserData,
          email: 'suspended@example.com'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.suspended).toBe(true);
      expect(data.message).toContain('suspended');
      expect(data.suspensionDetails).toEqual({
        reason: 'Terms violation',
        suspendedAt: suspendedUserData.suspendedAt.toISOString(),
        notes: 'Inappropriate behavior'
      });

      expect(mockSuspendedUser.findOne).toHaveBeenCalledWith({
        $or: [{ email: 'suspended@example.com' }, { phone: '+1234567890' }]
      });
    });

    test('should return 403 when user phone is suspended', async () => {
      const suspendedUserData = {
        email: 'different@example.com',
        phone: '+1234567890',
        suspensionReason: 'Spam activities',
        suspendedAt: new Date(),
        suspensionNotes: 'Multiple spam reports'
      };

      mockSuspendedUser.findOne.mockResolvedValue(suspendedUserData);

      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validUserData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.suspended).toBe(true);
      expect(data.message).toContain('suspended');
    });
  });

  describe('User Creation', () => {
    beforeEach(() => {
      mockSuspendedUser.findOne.mockResolvedValue(null);
    });

    test('should return 409 when user already exists', async () => {
      const existingUser = {
        _id: 'existing123',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe'
      };

      mockUser.findOne.mockResolvedValue(existingUser);

      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validUserData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Email already in use');

      expect(mockUser.findOne).toHaveBeenCalledWith({ email: 'john@example.com' });
    });

    test('should successfully create new user and return JWT token', async () => {
      const mockNewUser = {
        _id: 'newuser123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        title: 'Software Developer',
        save: jest.fn().mockResolvedValue(true)
      };

      const mockToken = 'jwt.token.here';

      mockUser.findOne.mockResolvedValue(null);
      (mockUser as unknown as jest.Mock).mockImplementation(() => mockNewUser as any);
      mockJwtSign.mockReturnValue(mockToken);

      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validUserData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Registration successful');
      expect(data.token).toBe(mockToken);
      expect(data.user).toEqual(expect.objectContaining({
        _id: 'newuser123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        title: 'Software Developer'
      }));

      expect(mockUser).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        title: 'Software Developer',
        password: 'securePassword123!'
      });

      expect(mockNewUser.save).toHaveBeenCalled();

      expect(mockJwt.sign).toHaveBeenCalledWith(
        {
          userId: 'newuser123',
          email: 'john@example.com',
          name: 'John Doe'
        },
        'test-jwt-secret-key-for-testing-purposes-only',
        { expiresIn: '24h' }
      );
    });

    test('should handle user save errors', async () => {
      const mockNewUser = {
        _id: 'newuser123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        save: jest.fn().mockRejectedValue(new Error('Database save error'))
      };

      mockUser.findOne.mockResolvedValue(null);
      (mockUser as unknown as jest.Mock).mockImplementation(() => mockNewUser as any);

      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validUserData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('An error occurred during registration');
    });
  });

  describe('Database Connection', () => {
    test('should handle database connection errors', async () => {
      mockDbConnect.mockRejectedValue(new Error('Database connection failed'));

      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validUserData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('An error occurred during registration');
    });
  });

  describe('Security Features', () => {
    test('should require JWT_SECRET environment variable', () => {
      delete process.env.JWT_SECRET;

      expect(() => {
        jest.resetModules();
        require('@/app/api/register/route');
      }).toThrow('JWT_SECRET is not defined');

      // Restore for other tests
      process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-only';
    });

    test('should prevent duplicate email registrations', async () => {
      const existingUser = { _id: 'existing123', email: 'john@example.com' };

      mockSuspendedUser.findOne.mockResolvedValue(null);
      mockUser.findOne.mockResolvedValue(existingUser);

      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validUserData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Email already in use');
    });
  });

  describe('Edge Cases', () => {
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
      expect(data.message).toBe('An error occurred during registration');
    });

    test('should handle suspension check with no notes', async () => {
      const suspendedUserData = {
        email: 'suspended@example.com',
        phone: '+1234567890',
        suspensionReason: 'Terms violation',
        suspendedAt: new Date(),
        suspensionNotes: null
      };

      mockSuspendedUser.findOne.mockResolvedValue(suspendedUserData);

      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validUserData,
          email: 'suspended@example.com'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.suspensionDetails.notes).toBe('No additional notes provided.');
    });
  });

  describe('Data Integrity', () => {
    test('should create user with correct field mapping', async () => {
      const mockNewUser = {
        _id: 'newuser123',
        save: jest.fn().mockResolvedValue(true)
      };

      mockSuspendedUser.findOne.mockResolvedValue(null);
      mockUser.findOne.mockResolvedValue(null);
      (mockUser as unknown as jest.Mock).mockImplementation(() => mockNewUser as any);
      mockJwtSign.mockReturnValue('token');

      const customUserData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@company.com',
        phone: '+9876543210',
        title: 'Product Manager',
        password: 'superSecurePass456!'
      };

      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customUserData)
      });

      await POST(request);

      expect(mockUser).toHaveBeenCalledWith({
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@company.com',
        phone: '+9876543210',
        title: 'Product Manager',
        password: 'superSecurePass456!'
      });
    });
  });
});