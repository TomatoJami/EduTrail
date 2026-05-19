import { describe, it, expect, beforeEach, vi } from 'vitest';
import mongoose from 'mongoose';
import { User } from '../../src/models/User';

describe('User Model', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Schema validation', () => {
    it('should have required fields', () => {
      const schema = User.schema;

      expect(schema.paths.email).toBeDefined();
      expect(schema.paths.password).toBeDefined();
      expect(schema.paths.name).toBeDefined();
      expect(schema.paths.role).toBeDefined();
    });

    it('should require email', () => {
      const schema = User.schema;
      const emailPath = schema.paths.email;

      expect(emailPath.isRequired).toBe(true);
    });

    it('should require password', () => {
      const schema = User.schema;
      const passwordPath = schema.paths.password;

      expect(passwordPath.isRequired).toBe(true);
    });

    it('should require name', () => {
      const schema = User.schema;
      const namePath = schema.paths.name;

      expect(namePath.isRequired).toBe(true);
    });

    it('should have timestamps enabled', () => {
      const schema = User.schema;

      expect(schema.paths.createdAt).toBeDefined();
      expect(schema.paths.updatedAt).toBeDefined();
    });

    it('should have versionKey disabled', () => {
      const schema = User.schema;

      expect(schema.options.versionKey).toBe(false);
    });
  });

  describe('Email validation', () => {
    it('should enforce email format', () => {
      const schema = User.schema;
      const emailPath = schema.paths.email;

      expect(emailPath.validators.length).toBeGreaterThan(0);
    });

    it('should enforce unique email', () => {
      const schema = User.schema;
      const emailPath = schema.paths.email;

      expect(emailPath.options.unique).toBe(true);
    });

    it('should make email lowercase', () => {
      const schema = User.schema;
      const emailPath = schema.paths.email;

      expect(emailPath.options.lowercase).toBe(true);
    });

    it('should trim email whitespace', () => {
      const schema = User.schema;
      const emailPath = schema.paths.email;

      expect(emailPath.options.trim).toBe(true);
    });
  });

  describe('Password validation', () => {
    it('should enforce minimum password length', () => {
      const schema = User.schema;
      const passwordPath = schema.paths.password;

      expect(passwordPath.validators.length).toBeGreaterThan(0);
    });

    it('should have index on email', () => {
      const schema = User.schema;

      expect(schema.paths.email.options.index).toBe(true);
    });
  });

  describe('Role validation', () => {
    it('should only accept valid roles', () => {
      const schema = User.schema;
      const rolePath = schema.paths.role;

      expect(rolePath.enumValues).toEqual(['student', 'admin']);
    });

    it('should default to student role', () => {
      const schema = User.schema;
      const rolePath = schema.paths.role;

      expect(rolePath.options.default).toBe('student');
    });
  });

  describe('AgeGroup field', () => {
    it('should support valid age groups', () => {
      const schema = User.schema;
      const ageGroupPath = schema.paths.ageGroup;

      expect(ageGroupPath.enumValues).toEqual(['1-3', '4-9', '10-12']);
    });

    it('should allow null ageGroup', () => {
      const schema = User.schema;
      const ageGroupPath = schema.paths.ageGroup;

      expect(ageGroupPath.options.required).not.toBe(true);
    });
  });

  describe('Password reset fields', () => {
    it('should have resetPasswordToken field', () => {
      const schema = User.schema;

      expect(schema.paths.resetPasswordToken).toBeDefined();
    });

    it('should have resetPasswordExpires field', () => {
      const schema = User.schema;

      expect(schema.paths.resetPasswordExpires).toBeDefined();
    });
  });

  describe('Account lockout fields', () => {
    it('should have loginAttempts field', () => {
      const schema = User.schema;

      expect(schema.paths.loginAttempts).toBeDefined();
    });

    it('should have lockUntil field', () => {
      const schema = User.schema;

      expect(schema.paths.lockUntil).toBeDefined();
    });

    it('should default loginAttempts to 0', () => {
      const schema = User.schema;
      const attemptsPath = schema.paths.loginAttempts;

      expect(attemptsPath.options.default).toBe(0);
    });
  });

  describe('Preferred subjects', () => {
    it('should have preferredSubjects array', () => {
      const schema = User.schema;

      expect(schema.paths.preferredSubjects).toBeDefined();
    });

    it('should reference Subject model', () => {
      const schema = User.schema;
      const subjectsPath = schema.paths.preferredSubjects;

      expect(subjectsPath.options.ref).toBe('Subject');
    });

    it('should default to empty array', () => {
      const schema = User.schema;
      const subjectsPath = schema.paths.preferredSubjects;

      expect(subjectsPath.options.default).toEqual([]);
    });
  });

  describe('Onboarding status', () => {
    it('should have hasCompletedOnboarding field', () => {
      const schema = User.schema;

      expect(schema.paths.hasCompletedOnboarding).toBeDefined();
    });

    it('should default hasCompletedOnboarding to false', () => {
      const schema = User.schema;
      const onboardingPath = schema.paths.hasCompletedOnboarding;

      expect(onboardingPath.options.default).toBe(false);
    });
  });

  describe('Field types', () => {
    it('should have string email', () => {
      const schema = User.schema;
      const emailPath = schema.paths.email;

      expect(emailPath.instance).toBe('String');
    });

    it('should have string password', () => {
      const schema = User.schema;
      const passwordPath = schema.paths.password;

      expect(passwordPath.instance).toBe('String');
    });

    it('should have string name', () => {
      const schema = User.schema;
      const namePath = schema.paths.name;

      expect(namePath.instance).toBe('String');
    });

    it('should have string role', () => {
      const schema = User.schema;
      const rolePath = schema.paths.role;

      expect(rolePath.instance).toBe('String');
    });
  });
});
