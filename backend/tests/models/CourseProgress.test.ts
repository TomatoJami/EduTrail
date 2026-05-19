import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CourseProgress } from '../../src/models/CourseProgress';

describe('CourseProgress Model', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('has the required course progress fields', () => {
    const schema = CourseProgress.schema;

    expect(schema.paths.user_id).toBeDefined();
    expect(schema.paths.course_id).toBeDefined();
    expect(schema.paths.status).toBeDefined();
    expect(schema.paths.is_bookmarked).toBeDefined();
  });

  it('requires user_id and course_id', () => {
    const schema = CourseProgress.schema;

    expect(schema.paths.user_id.isRequired).toBe(true);
    expect(schema.paths.course_id.isRequired).toBe(true);
  });

  it('stores course status only after the learner starts or completes the course', () => {
    const statusPath = CourseProgress.schema.paths.status;

    expect(statusPath.enumValues).toEqual(['in_progress', 'completed']);
    expect(statusPath.options.default).toBeNull();
    expect(statusPath.isRequired).toBeUndefined();
  });

  it('tracks bookmarks independently from course status', () => {
    const bookmarkPath = CourseProgress.schema.paths.is_bookmarked;

    expect(bookmarkPath.instance).toBe('Boolean');
    expect(bookmarkPath.options.default).toBe(false);
    expect(bookmarkPath.options.index).toBe(true);
  });

  it('has timestamps enabled and versionKey disabled', () => {
    const schema = CourseProgress.schema;

    expect(schema.paths.createdAt).toBeDefined();
    expect(schema.paths.updatedAt).toBeDefined();
    expect(schema.options.versionKey).toBe(false);
  });

  it('indexes user_id and course_id', () => {
    const schema = CourseProgress.schema;

    expect(schema.paths.user_id.options.index).toBe(true);
    expect(schema.paths.course_id.options.index).toBe(true);
  });

  it('has a unique compound index on user_id and course_id', () => {
    const indexes = CourseProgress.schema.indexes();

    const hasUniqueCompound = indexes.some(([fields, options]) =>
      fields.user_id === 1 && fields.course_id === 1 && options?.unique
    );

    expect(hasUniqueCompound).toBe(true);
  });

  it('references User and Course models', () => {
    const schema = CourseProgress.schema;

    expect(schema.paths.user_id.options.ref).toBe('User');
    expect(schema.paths.course_id.options.ref).toBe('Course');
  });

  it('uses ObjectId references', () => {
    const schema = CourseProgress.schema;

    expect(schema.paths.user_id.instance).toBe('ObjectId');
    expect(schema.paths.course_id.instance).toBe('ObjectId');
  });
});
