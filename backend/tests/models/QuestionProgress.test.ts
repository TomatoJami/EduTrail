import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QuestionProgress } from '../../src/models/QuestionProgress';

type IndexTuple = [Record<string, unknown>, Record<string, unknown>];

describe('QuestionProgress Model', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('has the required question progress fields', () => {
    const schema = QuestionProgress.schema;

    expect(schema.paths.user_id).toBeDefined();
    expect(schema.paths.question_id).toBeDefined();
    expect(schema.paths.is_completed).toBeDefined();
  });

  it('requires user_id and question_id', () => {
    const schema = QuestionProgress.schema;

    expect(schema.paths.user_id.isRequired).toBe(true);
    expect(schema.paths.question_id.isRequired).toBe(true);
  });

  it('tracks completion as a boolean defaulting to false', () => {
    const completedPath = QuestionProgress.schema.paths.is_completed;

    expect(completedPath.instance).toBe('Boolean');
    expect(completedPath.options.default).toBe(false);
  });

  it('has timestamps enabled and versionKey disabled', () => {
    const schema = QuestionProgress.schema;

    expect(schema.paths.createdAt).toBeDefined();
    expect(schema.paths.updatedAt).toBeDefined();
    expect(schema.options.versionKey).toBe(false);
  });

  it('indexes user_id, question_id, and is_completed', () => {
    const schema = QuestionProgress.schema;

    expect(schema.paths.user_id.options.index).toBe(true);
    expect(schema.paths.question_id.options.index).toBe(true);
    expect(schema.paths.is_completed.options.index).toBe(true);
  });

  it('has a unique compound index on user_id and question_id', () => {
    const indexes = QuestionProgress.schema.indexes();

    const hasUniqueCompound = indexes.some(([fields, options]: IndexTuple) =>
      fields.user_id === 1 && fields.question_id === 1 && options?.unique
    );

    expect(hasUniqueCompound).toBe(true);
  });

  it('references User and Question models', () => {
    const schema = QuestionProgress.schema;

    expect(schema.paths.user_id.options.ref).toBe('User');
    expect(schema.paths.question_id.options.ref).toBe('Question');
  });

  it('uses ObjectId references', () => {
    const schema = QuestionProgress.schema;

    expect(schema.paths.user_id.instance).toBe('ObjectId');
    expect(schema.paths.question_id.instance).toBe('ObjectId');
  });
});
