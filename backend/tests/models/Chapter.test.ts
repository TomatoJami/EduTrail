import { describe, it, expect, beforeEach, vi } from 'vitest';
import mongoose from 'mongoose';
import { Chapter } from '../../src/models/Chapter';

describe('Chapter Model', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Schema validation', () => {
    it('should have required fields', () => {
      const schema = Chapter.schema;

      expect(schema.paths.title).toBeDefined();
      expect(schema.paths.content).toBeDefined();
      expect(schema.paths.module_id).toBeDefined();
      expect(schema.paths.order).toBeDefined();
    });

    it('should require title', () => {
      const schema = Chapter.schema;
      const titlePath = schema.paths.title;

      expect(titlePath.isRequired).toBe(true);
    });

    it('should require content', () => {
      const schema = Chapter.schema;
      const contentPath = schema.paths.content;

      expect(contentPath.isRequired).toBe(true);
    });

    it('should require module_id', () => {
      const schema = Chapter.schema;
      const modulePath = schema.paths.module_id;

      expect(modulePath.isRequired).toBe(true);
    });

    it('should require order', () => {
      const schema = Chapter.schema;
      const orderPath = schema.paths.order;

      expect(orderPath.isRequired).toBe(true);
    });

    it('should have timestamps enabled', () => {
      const schema = Chapter.schema;

      expect(schema.paths.createdAt).toBeDefined();
      expect(schema.paths.updatedAt).toBeDefined();
    });

    it('should have versionKey disabled', () => {
      const schema = Chapter.schema;

      expect(schema.options.versionKey).toBe(false);
    });
  });

  describe('Indexes', () => {
    it('should have index on title', () => {
      const schema = Chapter.schema;

      expect(schema.paths.title.options.index).toBe(true);
    });

    it('should have index on content', () => {
      const schema = Chapter.schema;

      expect(schema.paths.content.options.index).toBe(true);
    });

    it('should have index on module_id', () => {
      const schema = Chapter.schema;

      expect(schema.paths.module_id.options.index).toBe(true);
    });

    it('should have index on order', () => {
      const schema = Chapter.schema;

      expect(schema.paths.order.options.index).toBe(true);
    });
  });

  describe('References', () => {
    it('should reference Module model', () => {
      const schema = Chapter.schema;
      const modulePath = schema.paths.module_id;

      expect(modulePath.options.ref).toBe('Module');
    });
  });

  describe('String formatting', () => {
    it('should trim title whitespace', () => {
      const schema = Chapter.schema;
      const titlePath = schema.paths.title;

      expect(titlePath.options.trim).toBe(true);
    });

    it('should trim content whitespace', () => {
      const schema = Chapter.schema;
      const contentPath = schema.paths.content;

      expect(contentPath.options.trim).toBe(true);
    });
  });

  describe('Field types', () => {
    it('should have string title', () => {
      const schema = Chapter.schema;
      const titlePath = schema.paths.title;

      expect(titlePath.instance).toBe('String');
    });

    it('should have string content', () => {
      const schema = Chapter.schema;
      const contentPath = schema.paths.content;

      expect(contentPath.instance).toBe('String');
    });

    it('should have number order', () => {
      const schema = Chapter.schema;
      const orderPath = schema.paths.order;

      expect(orderPath.instance).toBe('Number');
    });

    it('should have ObjectId module_id', () => {
      const schema = Chapter.schema;
      const modulePath = schema.paths.module_id;

      expect(modulePath.instance).toBe('ObjectId');
    });
  });
});
