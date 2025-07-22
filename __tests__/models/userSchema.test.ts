/**
 * User Schema Tests
 * Tests for User model including password hashing and comparison
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User, { IUser } from '@/lib/models/userSchema';

// Mock bcryptjs
jest.mock('bcryptjs');
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

// Mock mongoose connection
jest.mock('mongoose', () => ({
  ...jest.requireActual('mongoose'),
  models: {},
  model: jest.fn()
}));

describe('User Schema', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Password Hashing', () => {
    let mockUser: any;
    let mockNext: jest.Mock;

    beforeEach(() => {
      mockNext = jest.fn();
      mockUser = {
        password: 'plainTextPassword',
        isModified: jest.fn(),
        isNew: false
      };

      // Mock bcrypt functions
      mockBcrypt.genSalt.mockResolvedValue('salt123' as any);
      mockBcrypt.hash.mockResolvedValue('hashedPassword123');
    });

    test('should hash password when password is modified', async () => {
      mockUser.isModified.mockReturnValue(true);

      const userSchema = require('@/lib/models/userSchema').default.schema;
      const preHook = userSchema.pre.mock.calls.find((call: any[]) => call[0] === 'save');
      const hashFunction = preHook[1];

      await hashFunction.call(mockUser, mockNext);

      expect(mockBcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(mockBcrypt.hash).toHaveBeenCalledWith('plainTextPassword', 'salt123');
      expect(mockUser.password).toBe('hashedPassword123');
      expect(mockNext).toHaveBeenCalledWith();
    });

    test('should hash password when user is new', async () => {
      mockUser.isNew = true;
      mockUser.isModified.mockReturnValue(false);

      const userSchema = require('@/lib/models/userSchema').default.schema;
      const preHook = userSchema.pre.mock.calls.find((call: any[]) => call[0] === 'save');
      const hashFunction = preHook[1];

      await hashFunction.call(mockUser, mockNext);

      expect(mockBcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(mockBcrypt.hash).toHaveBeenCalledWith('plainTextPassword', 'salt123');
      expect(mockUser.password).toBe('hashedPassword123');
      expect(mockNext).toHaveBeenCalledWith();
    });

    test('should not hash password when password is not modified and user is not new', async () => {
      mockUser.isModified.mockReturnValue(false);
      mockUser.isNew = false;

      const userSchema = require('@/lib/models/userSchema').default.schema;
      const preHook = userSchema.pre.mock.calls.find((call: any[]) => call[0] === 'save');
      const hashFunction = preHook[1];

      await hashFunction.call(mockUser, mockNext);

      expect(mockBcrypt.genSalt).not.toHaveBeenCalled();
      expect(mockBcrypt.hash).not.toHaveBeenCalled();
      expect(mockUser.password).toBe('plainTextPassword'); // Unchanged
      expect(mockNext).toHaveBeenCalledWith();
    });

    test('should not hash password when password is null', async () => {
      mockUser.password = null;
      mockUser.isModified.mockReturnValue(true);

      const userSchema = require('@/lib/models/userSchema').default.schema;
      const preHook = userSchema.pre.mock.calls.find((call: any[]) => call[0] === 'save');
      const hashFunction = preHook[1];

      await hashFunction.call(mockUser, mockNext);

      expect(mockBcrypt.genSalt).not.toHaveBeenCalled();
      expect(mockBcrypt.hash).not.toHaveBeenCalled();
      expect(mockUser.password).toBeNull();
      expect(mockNext).toHaveBeenCalledWith();
    });

    test('should not hash password when password is undefined', async () => {
      mockUser.password = undefined;
      mockUser.isModified.mockReturnValue(true);

      const userSchema = require('@/lib/models/userSchema').default.schema;
      const preHook = userSchema.pre.mock.calls.find((call: any[]) => call[0] === 'save');
      const hashFunction = preHook[1];

      await hashFunction.call(mockUser, mockNext);

      expect(mockBcrypt.genSalt).not.toHaveBeenCalled();
      expect(mockBcrypt.hash).not.toHaveBeenCalled();
      expect(mockUser.password).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith();
    });

    test('should handle bcrypt errors during hashing', async () => {
      mockUser.isModified.mockReturnValue(true);
      const hashError = new Error('Bcrypt hash failed');
      mockBcrypt.hash.mockRejectedValue(hashError);

      const userSchema = require('@/lib/models/userSchema').default.schema;
      const preHook = userSchema.pre.mock.calls.find((call: any[]) => call[0] === 'save');
      const hashFunction = preHook[1];

      await hashFunction.call(mockUser, mockNext);

      expect(mockNext).toHaveBeenCalledWith(hashError);
    });

    test('should handle salt generation errors', async () => {
      mockUser.isModified.mockReturnValue(true);
      const saltError = new Error('Salt generation failed');
      mockBcrypt.genSalt.mockRejectedValue(saltError);

      const userSchema = require('@/lib/models/userSchema').default.schema;
      const preHook = userSchema.pre.mock.calls.find((call: any[]) => call[0] === 'save');
      const hashFunction = preHook[1];

      await hashFunction.call(mockUser, mockNext);

      expect(mockNext).toHaveBeenCalledWith(saltError);
    });
  });

  describe('Password Comparison', () => {
    let mockUser: any;
    let consoleLogSpy: jest.SpyInstance;
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      mockUser = {
        password: 'hashedPassword123',
        isGoogleUser: false
      };
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    test('should return true when passwords match', async () => {
      mockBcrypt.compare.mockResolvedValue(true);

      const userSchema = require('@/lib/models/userSchema').default.schema;
      const comparePasswordMethod = userSchema.methods.comparePassword;

      const result = await comparePasswordMethod.call(mockUser, 'plainTextPassword');

      expect(result).toBe(true);
      expect(mockBcrypt.compare).toHaveBeenCalledWith('plainTextPassword', 'hashedPassword123');
      expect(consoleLogSpy).toHaveBeenCalledWith('Password match result:', true);
    });

    test('should return false when passwords do not match', async () => {
      mockBcrypt.compare.mockResolvedValue(false);

      const userSchema = require('@/lib/models/userSchema').default.schema;
      const comparePasswordMethod = userSchema.methods.comparePassword;

      const result = await comparePasswordMethod.call(mockUser, 'wrongPassword');

      expect(result).toBe(false);
      expect(mockBcrypt.compare).toHaveBeenCalledWith('wrongPassword', 'hashedPassword123');
      expect(consoleLogSpy).toHaveBeenCalledWith('Password match result:', false);
    });

    test('should return false when user has no password set', async () => {
      mockUser.password = null;

      const userSchema = require('@/lib/models/userSchema').default.schema;
      const comparePasswordMethod = userSchema.methods.comparePassword;

      const result = await comparePasswordMethod.call(mockUser, 'anyPassword');

      expect(result).toBe(false);
      expect(mockBcrypt.compare).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith('No password set for this user');
    });

    test('should return false when user password is undefined', async () => {
      mockUser.password = undefined;

      const userSchema = require('@/lib/models/userSchema').default.schema;
      const comparePasswordMethod = userSchema.methods.comparePassword;

      const result = await comparePasswordMethod.call(mockUser, 'anyPassword');

      expect(result).toBe(false);
      expect(mockBcrypt.compare).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith('No password set for this user');
    });

    test('should return false when user password is empty string', async () => {
      mockUser.password = '';

      const userSchema = require('@/lib/models/userSchema').default.schema;
      const comparePasswordMethod = userSchema.methods.comparePassword;

      const result = await comparePasswordMethod.call(mockUser, 'anyPassword');

      expect(result).toBe(false);
      expect(mockBcrypt.compare).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith('No password set for this user');
    });

    test('should log user type during comparison', async () => {
      mockUser.isGoogleUser = true;
      mockBcrypt.compare.mockResolvedValue(true);

      const userSchema = require('@/lib/models/userSchema').default.schema;
      const comparePasswordMethod = userSchema.methods.comparePassword;

      await comparePasswordMethod.call(mockUser, 'password');

      expect(consoleLogSpy).toHaveBeenCalledWith('User type:', 'Google user');
    });

    test('should log regular user type during comparison', async () => {
      mockUser.isGoogleUser = false;
      mockBcrypt.compare.mockResolvedValue(true);

      const userSchema = require('@/lib/models/userSchema').default.schema;
      const comparePasswordMethod = userSchema.methods.comparePassword;

      await comparePasswordMethod.call(mockUser, 'password');

      expect(consoleLogSpy).toHaveBeenCalledWith('User type:', 'Regular user');
    });

    test('should log password and hash lengths', async () => {
      mockUser.password = 'hashedPassword123'; // 16 characters
      mockBcrypt.compare.mockResolvedValue(true);

      const userSchema = require('@/lib/models/userSchema').default.schema;
      const comparePasswordMethod = userSchema.methods.comparePassword;

      await comparePasswordMethod.call(mockUser, 'testPassword'); // 12 characters

      expect(consoleLogSpy).toHaveBeenCalledWith('Candidate password length:', 12);
      expect(consoleLogSpy).toHaveBeenCalledWith('Stored password hash length:', 16);
    });

    test('should handle bcrypt comparison errors', async () => {
      const compareError = new Error('Bcrypt comparison failed');
      mockBcrypt.compare.mockRejectedValue(compareError);

      const userSchema = require('@/lib/models/userSchema').default.schema;
      const comparePasswordMethod = userSchema.methods.comparePassword;

      const result = await comparePasswordMethod.call(mockUser, 'password');

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error comparing passwords:', compareError);
    });

    test('should work with various password lengths and characters', async () => {
      const testCases = [
        'short',
        'averageLengthPassword123',
        'VeryLongPasswordWithSpecialCharacters!@#$%^&*()_+{}:"<>?[];\'.,/`~',
        '1234567890',
        'πάσσωορδ', // Unicode characters
        'password with spaces',
        ''
      ];

      mockBcrypt.compare.mockResolvedValue(true);

      const userSchema = require('@/lib/models/userSchema').default.schema;
      const comparePasswordMethod = userSchema.methods.comparePassword;

      for (const password of testCases) {
        const result = await comparePasswordMethod.call(mockUser, password);
        
        if (password === '') {
          // Empty passwords should be compared normally
          expect(result).toBe(true);
          expect(mockBcrypt.compare).toHaveBeenCalledWith('', 'hashedPassword123');
        } else {
          expect(result).toBe(true);
          expect(mockBcrypt.compare).toHaveBeenCalledWith(password, 'hashedPassword123');
        }
      }
    });
  });

  describe('User Schema Methods', () => {
    test('should remove password from JSON output', () => {
      const mockUser = {
        _id: 'user123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'hashedPassword',
        phone: '+1234567890',
        toObject: jest.fn().mockReturnValue({
          _id: 'user123',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          password: 'hashedPassword',
          phone: '+1234567890'
        })
      };

      const userSchema = require('@/lib/models/userSchema').default.schema;
      const toJSONMethod = userSchema.methods.toJSON;

      const result = toJSONMethod.call(mockUser);

      expect(result).toEqual({
        _id: 'user123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+1234567890'
      });
      expect(result.password).toBeUndefined();
    });

    test('should handle toJSON when password is already undefined', () => {
      const mockUser = {
        _id: 'user123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        toObject: jest.fn().mockReturnValue({
          _id: 'user123',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+1234567890'
        })
      };

      const userSchema = require('@/lib/models/userSchema').default.schema;
      const toJSONMethod = userSchema.methods.toJSON;

      const result = toJSONMethod.call(mockUser);

      expect(result).toEqual({
        _id: 'user123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+1234567890'
      });
      expect(result.password).toBeUndefined();
    });
  });

  describe('Schema Validation', () => {
    test('should have required fields defined', () => {
      const userSchema = require('@/lib/models/userSchema').default.schema;
      const schemaDefinition = userSchema.obj;

      // Required fields
      expect(schemaDefinition.firstName.required).toBe(true);
      expect(schemaDefinition.lastName.required).toBe(true);
      expect(schemaDefinition.email.required).toBe(true);
      expect(schemaDefinition.email.unique).toBe(true);

      // Optional fields
      expect(schemaDefinition.password.required).toBe(false);
      expect(schemaDefinition.phone.required).toBe(false);
      expect(schemaDefinition.title.required).toBe(false);
    });

    test('should have correct default values', () => {
      const userSchema = require('@/lib/models/userSchema').default.schema;
      const schemaDefinition = userSchema.obj;

      expect(schemaDefinition.isGoogleUser.default).toBe(false);
      expect(schemaDefinition.profileCompleted.default).toBe(false);
      expect(schemaDefinition.isBlocked.default).toBe(false);
      expect(schemaDefinition.isDeleted.default).toBe(false);
      expect(schemaDefinition.suspension.isSuspended.default).toBe(false);
    });

    test('should have unique and sparse index on googleId', () => {
      const userSchema = require('@/lib/models/userSchema').default.schema;
      const schemaDefinition = userSchema.obj;

      expect(schemaDefinition.googleId.unique).toBe(true);
      expect(schemaDefinition.googleId.sparse).toBe(true);
    });

    test('should have timestamps enabled', () => {
      const userSchema = require('@/lib/models/userSchema').default.schema;
      
      expect(userSchema.options.timestamps).toBe(true);
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    test('should handle null values in comparePassword gracefully', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const mockUser = {
        password: null,
        isGoogleUser: false
      };

      const userSchema = require('@/lib/models/userSchema').default.schema;
      const comparePasswordMethod = userSchema.methods.comparePassword;

      const result = await comparePasswordMethod.call(mockUser, null);

      expect(result).toBe(false);
      expect(consoleLogSpy).toHaveBeenCalledWith('No password set for this user');
      
      consoleLogSpy.mockRestore();
    });

    test('should handle undefined candidate password', async () => {
      mockBcrypt.compare.mockResolvedValue(false);

      const mockUser = {
        password: 'hashedPassword',
        isGoogleUser: false
      };

      const userSchema = require('@/lib/models/userSchema').default.schema;
      const comparePasswordMethod = userSchema.methods.comparePassword;

      const result = await comparePasswordMethod.call(mockUser, undefined);

      expect(result).toBe(false);
      expect(mockBcrypt.compare).toHaveBeenCalledWith(undefined, 'hashedPassword');
    });

    test('should handle Google user with password set', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      mockBcrypt.compare.mockResolvedValue(true);

      const mockUser = {
        password: 'hashedPassword',
        isGoogleUser: true
      };

      const userSchema = require('@/lib/models/userSchema').default.schema;
      const comparePasswordMethod = userSchema.methods.comparePassword;

      const result = await comparePasswordMethod.call(mockUser, 'correctPassword');

      expect(result).toBe(true);
      expect(consoleLogSpy).toHaveBeenCalledWith('User type:', 'Google user');
      
      consoleLogSpy.mockRestore();
    });
  });
});