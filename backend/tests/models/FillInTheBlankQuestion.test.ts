import { describe, it, expect, beforeEach, vi } from 'vitest';
import mongoose from 'mongoose';
import { FillInTheBlankQuestion } from '../../src/models/FillInTheBlankQuestion';

describe('FillInTheBlankQuestion Model', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Schema validation', () => {
    it('should have required fields', () => {
      const schema = FillInTheBlankQuestion.schema;

      expect(schema.paths.module_id).toBeDefined();
      expect(schema.paths.questionText).toBeDefined();
      expect(schema.paths.blanks).toBeDefined();
    });

    it('should require module_id', () => {
      const schema = FillInTheBlankQuestion.schema;
      const modulePath = schema.paths.module_id;

      expect(modulePath.isRequired).toBe(true);
    });

    it('should require questionText', () => {
      const schema = FillInTheBlankQuestion.schema;
      const questionPath = schema.paths.questionText;

      expect(questionPath.isRequired).toBe(true);
    });

    it('should require blanks', () => {
      const schema = FillInTheBlankQuestion.schema;
      const blanksPath = schema.paths.blanks;

      expect(blanksPath.isRequired).toBe(true);
    });

    it('should have timestamps enabled', () => {
      const schema = FillInTheBlankQuestion.schema;

      expect(schema.paths.createdAt).toBeDefined();
      expect(schema.paths.updatedAt).toBeDefined();
    });

    it('should have versionKey disabled', () => {
      const schema = FillInTheBlankQuestion.schema;

      expect(schema.options.versionKey).toBe(false);
    });
  });

  describe('Blanks structure', () => {
    it('should support multiple blanks', () => {
      const schema = FillInTheBlankQuestion.schema;
      const blanksPath = schema.paths.blanks;

      expect(blanksPath.instance).toBe('Array');
    });

    it('should have blankId in blanks', () => {
      const schema = FillInTheBlankQuestion.schema;
      const blanksPath = schema.paths.blanks;

      // Check that blanks is an array of objects with required structure
      expect(blanksPath.schema.paths.blankId).toBeDefined();
    });

    it('should have correctAnswers in blanks', () => {
      const schema = FillInTheBlankQuestion.schema;
      const blanksPath = schema.paths.blanks;

      expect(blanksPath.schema.paths.correctAnswers).toBeDefined();
    });
  });

  describe('Indexes', () => {
    it('should have index on module_id', () => {
      const schema = FillInTheBlankQuestion.schema;

      expect(schema.paths.module_id.options.index).toBe(true);
    });
  });

  describe('References', () => {
    it('should reference Module model', () => {
      const schema = FillInTheBlankQuestion.schema;
      const modulePath = schema.paths.module_id;

      expect(modulePath.options.ref).toBe('Module');
    });
  });

  describe('Optional fields', () => {
    it('should have optional question_img', () => {
      const schema = FillInTheBlankQuestion.schema;
      const imgPath = schema.paths.question_img;

      expect(imgPath).toBeDefined();
      expect(imgPath.options.required).not.toBe(true);
    });

    it('should have optional explanation', () => {
      const schema = FillInTheBlankQuestion.schema;
      const explanationPath = schema.paths.explanation;

      expect(explanationPath).toBeDefined();
      expect(explanationPath.options.required).not.toBe(true);
    });

    it('should default question_img to empty string', () => {
      const schema = FillInTheBlankQuestion.schema;
      const imgPath = schema.paths.question_img;

      expect(imgPath.options.default).toBe('');
    });
  });

  describe('Field types', () => {
    it('should have string questionText', () => {
      const schema = FillInTheBlankQuestion.schema;
      const questionPath = schema.paths.questionText;

      expect(questionPath.instance).toBe('String');
    });

    it('should have array blanks', () => {
      const schema = FillInTheBlankQuestion.schema;
      const blanksPath = schema.paths.blanks;

      expect(blanksPath.instance).toBe('Array');
    });

    it('should have string question_img', () => {
      const schema = FillInTheBlankQuestion.schema;
      const imgPath = schema.paths.question_img;

      expect(imgPath.instance).toBe('String');
    });
  });

  describe('String formatting', () => {
    it('should trim questionText whitespace', () => {
      const schema = FillInTheBlankQuestion.schema;
      const questionPath = schema.paths.questionText;

      expect(questionPath.options.trim).toBe(true);
    });

    it('should trim question_img whitespace', () => {
      const schema = FillInTheBlankQuestion.schema;
      const imgPath = schema.paths.question_img;

      expect(imgPath.options.trim).toBe(true);
    });
  });
});
