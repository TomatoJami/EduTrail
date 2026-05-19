import { beforeEach, describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';
import { ChapterService, ChapterPayload } from '../../src/services/chapterService';
import { Chapter } from '../../src/models/Chapter';
import * as storageCleanupService from '../../src/services/storageCleanupService';

vi.mock('../../src/models/Chapter');
vi.mock('../../src/services/storageCleanupService');

describe('ChapterService', () => {
  let chapterService: ChapterService;

  beforeEach(() => {
    vi.clearAllMocks();
    chapterService = new ChapterService();
  });

  it('returns all chapters with populated module data sorted by order', async () => {
    const mockChapters = [{ _id: 'ch1', title: 'Chapter 1', order: 1 }];

    vi.mocked(Chapter.find).mockReturnValue({
      populate: vi.fn().mockReturnValue({
        sort: vi.fn().mockResolvedValue(mockChapters),
      }),
    } as any);

    const chapters = await chapterService.getAllChapters();

    expect(chapters).toEqual(mockChapters);
    expect(Chapter.find).toHaveBeenCalledWith();
  });

  it('returns chapters for a module', async () => {
    const moduleId = new mongoose.Types.ObjectId().toString();
    const mockChapters = [{ _id: 'ch1', title: 'Chapter 1', order: 1 }];

    vi.mocked(Chapter.find).mockReturnValue({
      populate: vi.fn().mockReturnValue({
        sort: vi.fn().mockResolvedValue(mockChapters),
      }),
    } as any);

    const chapters = await chapterService.getChaptersByModuleId(moduleId);

    expect(chapters).toEqual(mockChapters);
    expect(Chapter.find).toHaveBeenCalledWith({ module_id: moduleId });
  });

  it('throws for invalid module id', async () => {
    await expect(chapterService.getChaptersByModuleId('invalid-id')).rejects.toThrow(
      'Invalid module id'
    );
  });

  it('creates a chapter with auto-assigned order', async () => {
    const moduleId = new mongoose.Types.ObjectId().toString();
    const payload: ChapterPayload = {
      title: 'New Chapter',
      content: 'Content',
      module_id: moduleId,
    };
    const mockChapter = {
      save: vi.fn().mockResolvedValue(true),
      populate: vi.fn().mockResolvedValue({ ...payload, order: 1 }),
    };

    vi.mocked(Chapter.findOne).mockReturnValue({
      sort: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      }),
    } as any);
    vi.mocked(Chapter).mockImplementation(function () {
      return mockChapter as any;
    });

    await chapterService.createChapter(payload);

    expect(mockChapter.save).toHaveBeenCalled();
  });

  it('updates a chapter and cleans removed images', async () => {
    const chapterId = new mongoose.Types.ObjectId().toString();
    const previousChapter = { _id: chapterId, content: 'old image' };
    const updatedChapter = { _id: chapterId, content: 'new image' };

    vi.mocked(Chapter.findById).mockResolvedValue(previousChapter as any);
    vi.mocked(Chapter.findByIdAndUpdate).mockReturnValue({
      populate: vi.fn().mockResolvedValue(updatedChapter),
    } as any);

    const result = await chapterService.updateChapter(chapterId, { content: 'new image' });

    expect(result).toEqual(updatedChapter);
    expect(storageCleanupService.deleteRemovedSupabaseImages).toHaveBeenCalledWith(
      'old image',
      'new image'
    );
  });

  it('deletes a chapter, reorders later chapters, and cleans images', async () => {
    const chapterId = new mongoose.Types.ObjectId().toString();
    const moduleId = new mongoose.Types.ObjectId();
    const chapterToDelete = {
      _id: chapterId,
      order: 1,
      module_id: moduleId,
      content: 'Content with images',
    };

    vi.mocked(Chapter.findById).mockResolvedValue(chapterToDelete as any);
    vi.mocked(Chapter.findByIdAndDelete).mockReturnValue({
      populate: vi.fn().mockResolvedValue(chapterToDelete),
    } as any);
    vi.mocked(Chapter.updateMany).mockResolvedValue({ modifiedCount: 1 } as any);

    const result = await chapterService.deleteChapter(chapterId);

    expect(result).toEqual(chapterToDelete);
    expect(Chapter.updateMany).toHaveBeenCalled();
    expect(storageCleanupService.deleteSupabaseImages).toHaveBeenCalledWith('Content with images');
  });

  it('returns null when deleting a missing chapter', async () => {
    const chapterId = new mongoose.Types.ObjectId().toString();
    vi.mocked(Chapter.findById).mockResolvedValue(null);

    const result = await chapterService.deleteChapter(chapterId);

    expect(result).toBeNull();
  });

  it('returns a chapter by id', async () => {
    const chapterId = new mongoose.Types.ObjectId().toString();
    const mockChapter = { _id: chapterId, title: 'Chapter', content: 'Content' };

    vi.mocked(Chapter.findById).mockReturnValue({
      populate: vi.fn().mockResolvedValue(mockChapter),
    } as any);

    const chapter = await chapterService.getChapterById(chapterId);

    expect(chapter).toEqual(mockChapter);
  });
});
