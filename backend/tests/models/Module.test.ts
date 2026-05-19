import { describe, it, expect, beforeEach, vi } from 'vitest';
import mongoose from 'mongoose';
import { Module } from '../../src/models/Module';

describe('Module Model', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Schema validation', () => {
    it('should have required fields', () => {
      const schema = Module.schema;

      expect(schema.paths.title).toBeDefined();
      expect(schema.paths.course_id).toBeDefined();
      expect(schema.paths.order).toBeDefined();
    });

    it('should require title', () => {
      const schema = Module.schema;
      const titlePath = schema.paths.title;

      expect(titlePath.isRequired).toBe(true);
    });

    it('should require course_id', () => {
      const schema = Module.schema;
      const coursePath = schema.paths.course_id;

      expect(coursePath.isRequired).toBe(true);
    });

    it('should require order', () => {
      const schema = Module.schema;
      const orderPath = schema.paths.order;

      expect(orderPath.isRequired).toBe(true);
    });

    it('should have timestamps enabled', () => {
      const schema = Module.schema;

      expect(schema.paths.createdAt).toBeDefined();
      expect(schema.paths.updatedAt).toBeDefined();
    });

    it('should have versionKey disabled', () => {
      const schema = Module.schema;

      expect(schema.options.versionKey).toBe(false);
    });
  });

  describe('Indexes', () => {
    it('should have index on title', () => {
      const schema = Module.schema;

      expect(schema.paths.title.options.index).toBe(true);
    });

    it('should have index on course_id', () => {
      const schema = Module.schema;

      expect(schema.paths.course_id.options.index).toBe(true);
    });

    it('should have index on order', () => {
      const schema = Module.schema;

      expect(schema.paths.order.options.index).toBe(true);
    });
  });

  describe('References', () => {
    it('should reference Course model', () => {
      const schema = Module.schema;
      const coursePath = schema.paths.course_id;

      expect(coursePath.options.ref).toBe('Course');
    });
  });

  describe('String formatting', () => {
    it('should trim title whitespace', () => {
      const schema = Module.schema;
      const titlePath = schema.paths.title;

      expect(titlePath.options.trim).toBe(true);
    });
  });

  describe('Field types', () => {
    it('should have string title', () => {
      const schema = Module.schema;
      const titlePath = schema.paths.title;

      expect(titlePath.instance).toBe('String');
    });

    it('should have number order', () => {
      const schema = Module.schema;
      const orderPath = schema.paths.order;

      expect(orderPath.instance).toBe('Number');
    });

    it('should have ObjectId course_id', () => {
      const schema = Module.schema;
      const coursePath = schema.paths.course_id;

      expect(coursePath.instance).toBe('ObjectId');
    });
  });

  describe('Order field', () => {
    it('should store order as a number', () => {
      const schema = Module.schema;
      const orderPath = schema.paths.order;

      expect(orderPath.instance).toBe('Number');
    });

    it('should allow zero and positive order values', () => {
      const schema = Module.schema;
      const orderPath = schema.paths.order;

      // Order should accept numeric values
      expect(orderPath.options.type).toBe(Number);
    });
  });
});
