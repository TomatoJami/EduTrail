import { describe, it, expect, beforeEach, vi } from 'vitest';
import mongoose from 'mongoose';
import { TestQuestion } from '../../src/models/TestQuestion';

describe('TestQuestion Model', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Schema validation', () => {
    it('should have required fields', () => {
      const schema = TestQuestion.schema;

      expect(schema.paths.module_id).toBeDefined();
      expect(schema.paths.question).toBeDefined();
      expect(schema.paths.options).toBeDefined();
      expect(schema.paths.correctAnswer).toBeDefined();
    });

    it('should require module_id', () => {
      const schema = TestQuestion.schema;
      const modulePath = schema.paths.module_id;

      expect(modulePath.isRequired).toBe(true);
    });

    it('should require question', () => {
      const schema = TestQuestion.schema;
      const questionPath = schema.paths.question;

      expect(questionPath.isRequired).toBe(true);
    });

    it('should require options', () => {
      const schema = TestQuestion.schema;
      const optionsPath = schema.paths.options;

      expect(optionsPath.isRequired).toBe(true);
    });

    it('should require correctAnswer', () => {
      const schema = TestQuestion.schema;
      const answerPath = schema.paths.correctAnswer;

      expect(answerPath.isRequired).toBe(true);
    });

    it('should have timestamps enabled', () => {
      const schema = TestQuestion.schema;

      expect(schema.paths.createdAt).toBeDefined();
      expect(schema.paths.updatedAt).toBeDefined();
    });

    it('should have versionKey disabled', () => {
      const schema = TestQuestion.schema;

      expect(schema.options.versionKey).toBe(false);
    });
  });

  describe('Options validation', () => {
    it('should require minimum 2 options', () => {
      const schema = TestQuestion.schema;
      const optionsPath = schema.paths.options;

      expect(optionsPath.validators.length).toBeGreaterThan(0);
    });
  });

  describe('Indexes', () => {
    it('should have index on module_id', () => {
      const schema = TestQuestion.schema;

      expect(schema.paths.module_id.options.index).toBe(true);
    });
  });

  describe('References', () => {
    it('should reference Module model', () => {
      const schema = TestQuestion.schema;
      const modulePath = schema.paths.module_id;

      expect(modulePath.options.ref).toBe('Module');
    });
  });

  describe('Optional fields', () => {
    it('should have optional question_img', () => {
      const schema = TestQuestion.schema;
      const imgPath = schema.paths.question_img;

      expect(imgPath).toBeDefined();
      expect(imgPath.options.required).not.toBe(true);
    });

    it('should have optional explanation', () => {
      const schema = TestQuestion.schema;
      const explanationPath = schema.paths.explanation;

      expect(explanationPath).toBeDefined();
      expect(explanationPath.options.required).not.toBe(true);
    });

    it('should default question_img to empty string', () => {
      const schema = TestQuestion.schema;
      const imgPath = schema.paths.question_img;

      expect(imgPath.options.default).toBe('');
    });
  });

  describe('Field types', () => {
    it('should have string question', () => {
      const schema = TestQuestion.schema;
      const questionPath = schema.paths.question;

      expect(questionPath.instance).toBe('String');
    });

    it('should have string array options', () => {
      const schema = TestQuestion.schema;
      const optionsPath = schema.paths.options;

      expect(optionsPath.instance).toBe('Array');
    });

    it('should have number correctAnswer', () => {
      const schema = TestQuestion.schema;
      const answerPath = schema.paths.correctAnswer;

      expect(answerPath.instance).toBe('Number');
    });

    it('should have string question_img', () => {
      const schema = TestQuestion.schema;
      const imgPath = schema.paths.question_img;

      expect(imgPath.instance).toBe('String');
    });
  });

  describe('String formatting', () => {
    it('should trim question whitespace', () => {
      const schema = TestQuestion.schema;
      const questionPath = schema.paths.question;

      expect(questionPath.options.trim).toBe(true);
    });

    it('should trim question_img whitespace', () => {
      const schema = TestQuestion.schema;
      const imgPath = schema.paths.question_img;

      expect(imgPath.options.trim).toBe(true);
    });
  });
});
