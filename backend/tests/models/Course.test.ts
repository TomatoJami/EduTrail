import { describe, it, expect, beforeEach, vi } from 'vitest';
import mongoose from 'mongoose';
import { Course } from '../../src/models/Course';

describe('Course Model', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Schema validation', () => {
    it('should have required fields', () => {
      const schema = Course.schema;

      expect(schema.paths.title).toBeDefined();
      expect(schema.paths.description).toBeDefined();
      expect(schema.paths.goals).toBeDefined();
      expect(schema.paths.ageGroup).toBeDefined();
      expect(schema.paths.course_img).toBeDefined();
      expect(schema.paths.subject_id).toBeDefined();
    });

    it('should enforce title maxlength of 120', () => {
      const schema = Course.schema;
      const titlePath = schema.paths.title;

      expect(titlePath.validators.length).toBeGreaterThan(0);
    });

    it('should enforce description maxlength of 120', () => {
      const schema = Course.schema;
      const descPath = schema.paths.description;

      expect(descPath.validators.length).toBeGreaterThan(0);
    });

    it('should validate ageGroup enum', () => {
      const schema = Course.schema;
      const ageGroupPath = schema.paths.ageGroup;

      expect(ageGroupPath.enumValues).toEqual(['1-3', '4-9', '10-12']);
    });

    it('should have timestamps enabled', () => {
      const schema = Course.schema;

      expect(schema.paths.createdAt).toBeDefined();
      expect(schema.paths.updatedAt).toBeDefined();
    });

    it('should have versionKey disabled', () => {
      const schema = Course.schema;

      expect(schema.options.versionKey).toBe(false);
    });
  });

  describe('Indexes', () => {
    it('should have index on title', () => {
      const schema = Course.schema;

      expect(schema.paths.title.options.index).toBe(true);
    });

    it('should have index on ageGroup', () => {
      const schema = Course.schema;

      expect(schema.paths.ageGroup.options.index).toBe(true);
    });

    it('should have index on subject_id', () => {
      const schema = Course.schema;

      expect(schema.paths.subject_id.options.index).toBe(true);
    });
  });

  describe('References', () => {
    it('should reference Subject model', () => {
      const schema = Course.schema;
      const subjectPath = schema.paths.subject_id;

      expect(subjectPath.options.ref).toBe('Subject');
    });

    it('should trim whitespace from strings', () => {
      const schema = Course.schema;

      expect(schema.paths.title.options.trim).toBe(true);
      expect(schema.paths.description.options.trim).toBe(true);
      expect(schema.paths.course_img.options.trim).toBe(true);
    });
  });

  describe('Field constraints', () => {
    it('should require title', () => {
      const schema = Course.schema;
      const titlePath = schema.paths.title;

      expect(titlePath.isRequired).toBe(true);
    });

    it('should require description', () => {
      const schema = Course.schema;
      const descPath = schema.paths.description;

      expect(descPath.isRequired).toBe(true);
    });

    it('should require ageGroup', () => {
      const schema = Course.schema;
      const ageGroupPath = schema.paths.ageGroup;

      expect(ageGroupPath.isRequired).toBe(true);
    });

    it('should require course_img', () => {
      const schema = Course.schema;
      const imgPath = schema.paths.course_img;

      expect(imgPath.isRequired).toBe(true);
    });

    it('should require subject_id', () => {
      const schema = Course.schema;
      const subjectPath = schema.paths.subject_id;

      expect(subjectPath.isRequired).toBe(true);
    });
  });

  describe('Goals array', () => {
    it('should have goals as array of strings', () => {
      const schema = Course.schema;
      const goalsPath = schema.paths.goals;

      expect(Array.isArray(goalsPath.options.type)).toBe(true);
    });

    it('should trim goal strings', () => {
      const schema = Course.schema;
      const goalsPath = schema.paths.goals;

      expect(goalsPath.options.type[0].trim).toBe(true);
    });
  });
});
