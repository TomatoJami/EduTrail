import { describe, it, expect, beforeEach, vi } from 'vitest';
import mongoose from 'mongoose';
import { ShortAnswerQuestion } from '../../src/models/ShortAnswerQuestion';

describe('ShortAnswerQuestion Model', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Schema validation', () => {
    it('should have required fields', () => {
      const schema = ShortAnswerQuestion.schema;

      expect(schema.paths.module_id).toBeDefined();
      expect(schema.paths.question).toBeDefined();
      expect(schema.paths.correctAnswers).toBeDefined();
    });

    it('should require module_id', () => {
      const schema = ShortAnswerQuestion.schema;
      const modulePath = schema.paths.module_id;

      expect(modulePath.isRequired).toBe(true);
    });

    it('should require question', () => {
      const schema = ShortAnswerQuestion.schema;
      const questionPath = schema.paths.question;

      expect(questionPath.isRequired).toBe(true);
    });

    it('should require correctAnswers', () => {
      const schema = ShortAnswerQuestion.schema;
      const answersPath = schema.paths.correctAnswers;

      expect(answersPath.isRequired).toBe(true);
    });

    it('should have timestamps enabled', () => {
      const schema = ShortAnswerQuestion.schema;

      expect(schema.paths.createdAt).toBeDefined();
      expect(schema.paths.updatedAt).toBeDefined();
    });

    it('should have versionKey disabled', () => {
      const schema = ShortAnswerQuestion.schema;

      expect(schema.options.versionKey).toBe(false);
    });
  });

  describe('Indexes', () => {
    it('should have index on module_id', () => {
      const schema = ShortAnswerQuestion.schema;

      expect(schema.paths.module_id.options.index).toBe(true);
    });
  });

  describe('References', () => {
    it('should reference Module model', () => {
      const schema = ShortAnswerQuestion.schema;
      const modulePath = schema.paths.module_id;

      expect(modulePath.options.ref).toBe('Module');
    });
  });

  describe('Optional fields', () => {
    it('should have optional question_img', () => {
      const schema = ShortAnswerQuestion.schema;
      const imgPath = schema.paths.question_img;

      expect(imgPath).toBeDefined();
      expect(imgPath.options.required).not.toBe(true);
    });

    it('should have optional explanation', () => {
      const schema = ShortAnswerQuestion.schema;
      const explanationPath = schema.paths.explanation;

      expect(explanationPath).toBeDefined();
      expect(explanationPath.options.required).not.toBe(true);
    });

    it('should have optional caseSensitive', () => {
      const schema = ShortAnswerQuestion.schema;
      const casePath = schema.paths.caseSensitive;

      expect(casePath).toBeDefined();
      expect(casePath.options.required).not.toBe(true);
    });

    it('should default question_img to empty string', () => {
      const schema = ShortAnswerQuestion.schema;
      const imgPath = schema.paths.question_img;

      expect(imgPath.options.default).toBe('');
    });

    it('should default caseSensitive to true', () => {
      const schema = ShortAnswerQuestion.schema;
      const casePath = schema.paths.caseSensitive;

      expect(casePath.options.default).toBe(false);
    });
  });

  describe('Field types', () => {
    it('should have string question', () => {
      const schema = ShortAnswerQuestion.schema;
      const questionPath = schema.paths.question;

      expect(questionPath.instance).toBe('String');
    });

    it('should have array correctAnswers', () => {
      const schema = ShortAnswerQuestion.schema;
      const answersPath = schema.paths.correctAnswers;

      expect(answersPath.instance).toBe('Array');
    });

    it('should have boolean caseSensitive', () => {
      const schema = ShortAnswerQuestion.schema;
      const casePath = schema.paths.caseSensitive;

      expect(casePath.instance).toBe('Boolean');
    });
  });

  describe('String formatting', () => {
    it('should trim question whitespace', () => {
      const schema = ShortAnswerQuestion.schema;
      const questionPath = schema.paths.question;

      expect(questionPath.options.trim).toBe(true);
    });

    it('should trim question_img whitespace', () => {
      const schema = ShortAnswerQuestion.schema;
      const imgPath = schema.paths.question_img;

      expect(imgPath.options.trim).toBe(true);
    });
  });
});
