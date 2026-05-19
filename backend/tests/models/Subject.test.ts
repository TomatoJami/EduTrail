import { describe, it, expect, beforeEach, vi } from 'vitest';
import mongoose from 'mongoose';
import { Subject } from '../../src/models/Subject';

describe('Subject Model', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Schema validation', () => {
    it('should have required fields', () => {
      const schema = Subject.schema;

      expect(schema.paths.subject_name).toBeDefined();
      expect(schema.paths.subject_img).toBeDefined();
    });

    it('should require subject_name', () => {
      const schema = Subject.schema;
      const namePath = schema.paths.subject_name;

      expect(namePath.isRequired).toBe(true);
    });

    it('should require subject_img', () => {
      const schema = Subject.schema;
      const imgPath = schema.paths.subject_img;

      expect(imgPath.isRequired).toBe(true);
    });

    it('should enforce unique subject_name', () => {
      const schema = Subject.schema;
      const namePath = schema.paths.subject_name;

      expect(namePath.options.unique).toBe(true);
    });

    it('should have timestamps enabled', () => {
      const schema = Subject.schema;

      expect(schema.paths.createdAt).toBeDefined();
      expect(schema.paths.updatedAt).toBeDefined();
    });

    it('should have versionKey disabled', () => {
      const schema = Subject.schema;

      expect(schema.options.versionKey).toBe(false);
    });
  });

  describe('Indexes', () => {
    it('should have index on subject_name', () => {
      const schema = Subject.schema;

      expect(schema.paths.subject_name.options.index).toBe(true);
    });

    it('should have unique index on subject_name', () => {
      const schema = Subject.schema;
      const namePath = schema.paths.subject_name;

      expect(namePath.options.unique).toBe(true);
    });
  });

  describe('String formatting', () => {
    it('should trim subject_name whitespace', () => {
      const schema = Subject.schema;
      const namePath = schema.paths.subject_name;

      expect(namePath.options.trim).toBe(true);
    });

    it('should trim subject_img whitespace', () => {
      const schema = Subject.schema;
      const imgPath = schema.paths.subject_img;

      expect(imgPath.options.trim).toBe(true);
    });
  });

  describe('Field types', () => {
    it('should have string subject_name', () => {
      const schema = Subject.schema;
      const namePath = schema.paths.subject_name;

      expect(namePath.instance).toBe('String');
    });

    it('should have string subject_img', () => {
      const schema = Subject.schema;
      const imgPath = schema.paths.subject_img;

      expect(imgPath.instance).toBe('String');
    });
  });

  describe('Uniqueness constraint', () => {
    it('should prevent duplicate subject names', () => {
      const schema = Subject.schema;
      const namePath = schema.paths.subject_name;

      expect(namePath.options.unique).toBe(true);
    });
  });
});
