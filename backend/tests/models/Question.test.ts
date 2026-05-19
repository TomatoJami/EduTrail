import { describe, it, expect, beforeEach, vi } from 'vitest';
import mongoose from 'mongoose';
import { Question } from '../../src/models/Question';

describe('Question Model', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Schema validation', () => {
    it('should have required fields', () => {
      const schema = Question.schema;

      expect(schema.paths.module_id).toBeDefined();
      expect(schema.paths.type).toBeDefined();
      expect(schema.paths.typeId).toBeDefined();
    });

    it('should require module_id', () => {
      const schema = Question.schema;
      const modulePath = schema.paths.module_id;

      expect(modulePath.isRequired).toBe(true);
    });

    it('should require type', () => {
      const schema = Question.schema;
      const typePath = schema.paths.type;

      expect(typePath.isRequired).toBe(true);
    });

    it('should require typeId', () => {
      const schema = Question.schema;
      const typeIdPath = schema.paths.typeId;

      expect(typeIdPath.isRequired).toBe(true);
    });

    it('should have timestamps enabled', () => {
      const schema = Question.schema;

      expect(schema.paths.createdAt).toBeDefined();
      expect(schema.paths.updatedAt).toBeDefined();
    });

    it('should have versionKey disabled', () => {
      const schema = Question.schema;

      expect(schema.options.versionKey).toBe(false);
    });
  });

  describe('Type enum validation', () => {
    it('should only accept valid question types', () => {
      const schema = Question.schema;
      const typePath = schema.paths.type;

      expect(typePath.enumValues).toEqual(['test', 'short-answer', 'fill-blank']);
    });

    it('should reject invalid question types', () => {
      const schema = Question.schema;
      const typePath = schema.paths.type;

      expect(typePath.enumValues).not.toContain('invalid-type');
    });
  });

  describe('Indexes', () => {
    it('should have index on module_id', () => {
      const schema = Question.schema;

      expect(schema.paths.module_id.options.index).toBe(true);
    });
  });

  describe('References', () => {
    it('should reference Module model', () => {
      const schema = Question.schema;
      const modulePath = schema.paths.module_id;

      expect(modulePath.options.ref).toBe('Module');
    });

    it('should use polymorphic reference for typeId', () => {
      const schema = Question.schema;
      const typeIdPath = schema.paths.typeId;

      expect(typeIdPath.options.refPath).toBe('type');
    });
  });

  describe('Field types', () => {
    it('should have string type', () => {
      const schema = Question.schema;
      const typePath = schema.paths.type;

      expect(typePath.instance).toBe('String');
    });

    it('should have ObjectId module_id', () => {
      const schema = Question.schema;
      const modulePath = schema.paths.module_id;

      expect(modulePath.instance).toBe('ObjectId');
    });

    it('should have ObjectId typeId', () => {
      const schema = Question.schema;
      const typeIdPath = schema.paths.typeId;

      expect(typeIdPath.instance).toBe('ObjectId');
    });
  });
});
