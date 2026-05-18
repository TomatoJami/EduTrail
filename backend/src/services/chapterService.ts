import mongoose from 'mongoose';
import { Chapter, IChapter } from '../models/Chapter';
import { deleteRemovedSupabaseImages, deleteSupabaseImages } from './storageCleanupService';

export interface ChapterPayload {
  title: string;
  content: string;
  order?: number;
  module_id: string;
}

export class ChapterService {
  async getAllChapters(): Promise<IChapter[]> {
    return Chapter.find().populate('module_id').sort({ order: 1 });
  }

  async getChaptersByModuleId(moduleId: string): Promise<IChapter[]> {
    if (!mongoose.isValidObjectId(moduleId)) {
      throw new Error('Invalid module id');
    }
    return Chapter.find({ module_id: moduleId }).populate('module_id').sort({ order: 1 });
  }

  async createChapter(payload: ChapterPayload): Promise<IChapter> {
    const moduleId = new mongoose.Types.ObjectId(payload.module_id);
    
    let order = payload.order;
    if (order === undefined) {
      const maxOrderChapter = await Chapter.findOne({ module_id: moduleId })
        .sort({ order: -1 })
        .lean();
      
      order = (maxOrderChapter?.order || 0) + 1;
    }

    const chapter = new Chapter({
      ...payload,
      order,
      module_id: moduleId,
    });

    await chapter.save();
    return chapter.populate('module_id');
  }

  async updateChapter(id: string, payload: Partial<ChapterPayload>): Promise<IChapter | null> {
    if (!mongoose.isValidObjectId(id)) {
      throw new Error('Invalid chapter id');
    }

    const nextPayload: Record<string, unknown> = { ...payload };

    if (payload.module_id) {
      if (!mongoose.isValidObjectId(payload.module_id)) {
        throw new Error('Invalid module id');
      }
      nextPayload.module_id = new mongoose.Types.ObjectId(payload.module_id);
    }

    const previousChapter = await Chapter.findById(id);
    if (!previousChapter) {
      return null;
    }

    const updatedChapter = await Chapter.findByIdAndUpdate(id, nextPayload, {
      new: true,
      runValidators: true,
    }).populate('module_id');

    if (payload.content !== undefined) {
      await deleteRemovedSupabaseImages(previousChapter.content, payload.content);
    }

    return updatedChapter;
  }

  async deleteChapter(id: string): Promise<IChapter | null> {
    if (!mongoose.isValidObjectId(id)) {
      throw new Error('Invalid chapter id');
    }

    const chapterToDelete = await Chapter.findById(id);
    if (!chapterToDelete) {
      return null;
    }

    const deletedChapter = await Chapter.findByIdAndDelete(id).populate('module_id');

    if (deletedChapter) {
      await Chapter.updateMany(
        {
          module_id: deletedChapter.module_id,
          order: { $gt: deletedChapter.order },
        },
        { $inc: { order: -1 } }
      );
      await deleteSupabaseImages(deletedChapter.content);
    }

    return deletedChapter;
  }

  async getChapterById(id: string): Promise<IChapter | null> {
    if (!mongoose.isValidObjectId(id)) {
      throw new Error('Invalid chapter id');
    }

    return Chapter.findById(id).populate('module_id');
  }
}

export const chapterService = new ChapterService();
