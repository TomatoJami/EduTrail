import { describe, it, expect, beforeEach, vi } from 'vitest';
import mongoose from 'mongoose';
import { Feedback } from '../../src/models/Feedback';

describe('Feedback Model', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Schema validation', () => {
    it('should have required fields', () => {
      const schema = Feedback.schema;

      expect(schema.paths.feedbackType).toBeDefined();
      expect(schema.paths.data).toBeDefined();
      expect(schema.paths.user_id).toBeDefined();
    });

    it('should require data', () => {
      const schema = Feedback.schema;
      const dataPath = schema.paths.data;

      expect(dataPath.isRequired).toBe(true);
    });

    it('should require user_id', () => {
      const schema = Feedback.schema;
      const userPath = schema.paths.user_id;

      expect(userPath.isRequired).toBe(true);
    });

    it('should have timestamps enabled', () => {
      const schema = Feedback.schema;

      expect(schema.paths.createdAt).toBeDefined();
      expect(schema.paths.updatedAt).toBeDefined();
    });

    it('should have versionKey disabled', () => {
      const schema = Feedback.schema;

      expect(schema.options.versionKey).toBe(false);
    });
  });

  describe('FeedbackType validation', () => {
    it('should only accept valid feedback types', () => {
      const schema = Feedback.schema;
      const typePath = schema.paths.feedbackType;

      expect(typePath.enumValues).toEqual(['Error', 'Wish']);
    });

    it('should not accept invalid feedback types', () => {
      const schema = Feedback.schema;
      const typePath = schema.paths.feedbackType;

      expect(typePath.enumValues).not.toContain('Bug');
      expect(typePath.enumValues).not.toContain('Feature');
    });
  });

  describe('Indexes', () => {
    it('should have index on feedbackType', () => {
      const schema = Feedback.schema;

      expect(schema.paths.feedbackType.options.index).toBe(true);
    });

    it('should have index on user_id', () => {
      const schema = Feedback.schema;

      expect(schema.paths.user_id.options.index).toBe(true);
    });
  });

  describe('References', () => {
    it('should reference User model', () => {
      const schema = Feedback.schema;
      const userPath = schema.paths.user_id;

      expect(userPath.options.ref).toBe('User');
    });
  });

  describe('Field formatting', () => {
    it('should trim feedback data whitespace', () => {
      const schema = Feedback.schema;
      const dataPath = schema.paths.data;

      expect(dataPath.options.trim).toBe(true);
    });
  });

  describe('Field types', () => {
    it('should have string feedbackType', () => {
      const schema = Feedback.schema;
      const typePath = schema.paths.feedbackType;

      expect(typePath.instance).toBe('String');
    });

    it('should have string data', () => {
      const schema = Feedback.schema;
      const dataPath = schema.paths.data;

      expect(dataPath.instance).toBe('String');
    });

    it('should have ObjectId user_id', () => {
      const schema = Feedback.schema;
      const userPath = schema.paths.user_id;

      expect(userPath.instance).toBe('ObjectId');
    });
  });

  describe('Feedback types', () => {
    it('should distinguish between Error and Wish feedback', () => {
      const schema = Feedback.schema;
      const typePath = schema.paths.feedbackType;

      const types = typePath.enumValues;
      expect(types.length).toBe(2);
      expect(types).toContain('Error');
      expect(types).toContain('Wish');
    });
  });
});
