import mongoose from 'mongoose';
import { UserChapter, IUserChapter } from '../models/UserChapter';

export interface UserChapterPayload {
  user_id: string;
  chapter_id: string;
  is_completed?: boolean;
}

export class UserChapterService {
  async getUserChapter(userId: string, chapterId: string): Promise<IUserChapter | null> {
    if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(chapterId)) {
      throw new Error('Invalid user id or chapter id');
    }

    return UserChapter.findOne({
      user_id: new mongoose.Types.ObjectId(userId),
      chapter_id: new mongoose.Types.ObjectId(chapterId),
    }).populate(['user_id', 'chapter_id']);
  }

  async getUserChapters(userId: string): Promise<IUserChapter[]> {
    if (!mongoose.isValidObjectId(userId)) {
      throw new Error('Invalid user id');
    }

    return UserChapter.find({
      user_id: new mongoose.Types.ObjectId(userId),
    }).populate(['user_id', 'chapter_id']);
  }

  async getUserChaptersByModule(userId: string, moduleId: string): Promise<IUserChapter[]> {
    if (!mongoose.isValidObjectId(userId)) {
      throw new Error('Invalid user id');
    }

    // This will be used to get all chapters in a module and their completion status
    // We need to get chapters by module_id first, then check their completion
    const Chapter = require('../models/Chapter').Chapter;
    
    const chapters = await Chapter.find({ module_id: new mongoose.Types.ObjectId(moduleId) });
    const chapterIds = chapters.map((ch: any) => ch._id);

    if (chapterIds.length === 0) {
      return [];
    }

    return UserChapter.find({
      user_id: new mongoose.Types.ObjectId(userId),
      chapter_id: { $in: chapterIds },
    }).populate(['user_id', 'chapter_id']);
  }

  async createOrUpdateUserChapter(payload: UserChapterPayload): Promise<IUserChapter> {
    if (!mongoose.isValidObjectId(payload.user_id) || !mongoose.isValidObjectId(payload.chapter_id)) {
      throw new Error('Invalid user id or chapter id');
    }

    const userId = new mongoose.Types.ObjectId(payload.user_id);
    const chapterId = new mongoose.Types.ObjectId(payload.chapter_id);

    let userChapter = await UserChapter.findOne({
      user_id: userId,
      chapter_id: chapterId,
    });

    if (userChapter) {
      // Update existing record
      if (payload.is_completed !== undefined) {
        userChapter.is_completed = payload.is_completed;
      }
      await userChapter.save();
    } else {
      // Create new record
      userChapter = new UserChapter({
        user_id: userId,
        chapter_id: chapterId,
        is_completed: payload.is_completed ?? false,
      });
      await userChapter.save();
    }

    return userChapter.populate(['user_id', 'chapter_id']);
  }

  async markChapterCompleted(userId: string, chapterId: string, completed: boolean): Promise<IUserChapter | null> {
    if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(chapterId)) {
      throw new Error('Invalid user id or chapter id');
    }

    return UserChapter.findOneAndUpdate(
      {
        user_id: new mongoose.Types.ObjectId(userId),
        chapter_id: new mongoose.Types.ObjectId(chapterId),
      },
      { is_completed: completed },
      { new: true }
    ).populate(['user_id', 'chapter_id']);
  }

  async deleteUserChapter(userId: string, chapterId: string): Promise<IUserChapter | null> {
    if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(chapterId)) {
      throw new Error('Invalid user id or chapter id');
    }

    return UserChapter.findOneAndDelete({
      user_id: new mongoose.Types.ObjectId(userId),
      chapter_id: new mongoose.Types.ObjectId(chapterId),
    });
  }
}

export const userChapterService = new UserChapterService();
