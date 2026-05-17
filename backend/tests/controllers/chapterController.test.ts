import { Request } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChapterController } from '../../src/controllers/chapterController';
import { chapterService } from '../../src/services/chapterService';
import { createMockResponse } from '../testUtils';

vi.mock('../../src/services/chapterService', () => ({
  chapterService: {
    getAllChapters: vi.fn(),
    getChaptersByModuleId: vi.fn(),
    getChapterById: vi.fn(),
    createChapter: vi.fn(),
    updateChapter: vi.fn(),
    deleteChapter: vi.fn(),
  },
}));

describe('ChapterController', () => {
  const controller = new ChapterController();
  const userId = '507f1f77bcf86cd799439011';
  const otherUserId = '507f191e810c19729de860ea';
  const moduleId = '507f1f77bcf86cd799439012';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects invalid module ids when creating chapters', async () => {
    const res = createMockResponse();

    await controller.createChapter({
      body: {
        title: 'Chapter',
        content: 'Content',
        module_id: 'bad-id',
      },
    } as Request, res);

    expect(chapterService.createChapter).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid module_id',
    });
  });

  it('trims and creates valid chapters', async () => {
    const chapter = { _id: 'chapter-1' };
    vi.mocked(chapterService.createChapter).mockResolvedValue(chapter as any);
    const res = createMockResponse();

    await controller.createChapter({
      body: {
        title: '  Chapter  ',
        content: '  Content  ',
        order: 1,
        module_id: moduleId,
      },
    } as Request, res);

    expect(chapterService.createChapter).toHaveBeenCalledWith({
      title: 'Chapter',
      content: 'Content',
      order: 1,
      module_id: moduleId,
    });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('prevents students from reading another user chapter progress', async () => {
    const res = createMockResponse();

    await controller.getUserChaptersProgress({
      params: { userId, moduleId },
      userId: otherUserId,
      userRole: 'student',
    } as unknown as Request, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Forbidden: cannot access another user progress',
    });
  });
});
