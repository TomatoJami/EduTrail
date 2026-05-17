import { Request } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProgressController } from '../../src/controllers/progressController';
import { CourseProgress } from '../../src/models/CourseProgress';
import { Module } from '../../src/models/Module';
import { Chapter } from '../../src/models/Chapter';
import { Question } from '../../src/models/Question';
import { ChapterProgress } from '../../src/models/ChapterProgress';
import { QuestionProgress } from '../../src/models/QuestionProgress';
import { createMockResponse } from '../testUtils';

describe('ProgressController', () => {
  const controller = new ProgressController();
  const userId = '507f1f77bcf86cd799439011';
  const courseId = '507f1f77bcf86cd799439012';
  const chapterId = '507f1f77bcf86cd799439013';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('requires a boolean when updating chapter progress', async () => {
    const res = createMockResponse();

    await controller.updateChapterProgress({
      params: { chapterId },
      userId,
      body: { is_completed: 'yes' },
    } as unknown as Request, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'is_completed must be boolean',
    });
  });

  it('creates chapter progress records with authenticated user id', async () => {
    const progress = { _id: 'progress-1', is_completed: true };
    vi.spyOn(ChapterProgress, 'findOneAndUpdate').mockResolvedValue(progress as any);
    const res = createMockResponse();

    await controller.updateChapterProgress({
      params: { chapterId },
      userId,
      body: { is_completed: true },
    } as unknown as Request, res);

    expect(ChapterProgress.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({}),
      expect.objectContaining({ is_completed: true }),
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Chapter progress updated successfully',
      data: progress,
    });
  });

  it('blocks completing a course until every module item is complete', async () => {
    const save = vi.fn();
    vi.spyOn(CourseProgress, 'findOne').mockResolvedValue({ status: 'in_progress', save } as any);
    vi.spyOn(Module, 'find').mockReturnValue({
      select: vi.fn().mockResolvedValue([{ _id: 'module-1' }]),
    } as any);
    vi.spyOn(Chapter, 'find').mockReturnValue({
      select: vi.fn().mockResolvedValue([{ _id: 'chapter-1' }]),
    } as any);
    vi.spyOn(Question, 'find').mockReturnValue({
      select: vi.fn().mockResolvedValue([{ _id: 'question-1' }]),
    } as any);
    vi.spyOn(ChapterProgress, 'countDocuments').mockResolvedValue(0);
    vi.spyOn(QuestionProgress, 'countDocuments').mockResolvedValue(1);
    const res = createMockResponse();

    await controller.updateCourseStatus({
      params: { courseId },
      userId,
      body: { status: 'completed' },
    } as unknown as Request, res);

    expect(save).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Complete all modules first.',
    });
  });
});
