import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChapterProgress } from '../../src/models/ChapterProgress';

type IndexTuple = [Record<string, unknown>, Record<string, unknown>];

describe('ChapterProgress Model', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('has the required chapter progress fields', () => {
    const schema = ChapterProgress.schema;

    expect(schema.paths.user_id).toBeDefined();
    expect(schema.paths.chapter_id).toBeDefined();
    expect(schema.paths.is_completed).toBeDefined();
  });

  it('requires user_id and chapter_id', () => {
    const schema = ChapterProgress.schema;

    expect(schema.paths.user_id.isRequired).toBe(true);
    expect(schema.paths.chapter_id.isRequired).toBe(true);
  });

  it('tracks completion as a boolean defaulting to false', () => {
    const completedPath = ChapterProgress.schema.paths.is_completed;

    expect(completedPath.instance).toBe('Boolean');
    expect(completedPath.options.default).toBe(false);
  });

  it('has timestamps enabled', () => {
    const schema = ChapterProgress.schema;

    expect(schema.paths.createdAt).toBeDefined();
    expect(schema.paths.updatedAt).toBeDefined();
  });

  it('indexes user_id and chapter_id', () => {
    const schema = ChapterProgress.schema;

    expect(schema.paths.user_id.options.index).toBe(true);
    expect(schema.paths.chapter_id.options.index).toBe(true);
  });

  it('has a unique compound index on user_id and chapter_id', () => {
    const indexes = ChapterProgress.schema.indexes();

    const hasUniqueCompound = indexes.some(([fields, options]: IndexTuple) =>
      fields.user_id === 1 && fields.chapter_id === 1 && options?.unique
    );

    expect(hasUniqueCompound).toBe(true);
  });

  it('references User and Chapter models', () => {
    const schema = ChapterProgress.schema;

    expect(schema.paths.user_id.options.ref).toBe('User');
    expect(schema.paths.chapter_id.options.ref).toBe('Chapter');
  });

  it('uses ObjectId references', () => {
    const schema = ChapterProgress.schema;

    expect(schema.paths.user_id.instance).toBe('ObjectId');
    expect(schema.paths.chapter_id.instance).toBe('ObjectId');
  });
});
