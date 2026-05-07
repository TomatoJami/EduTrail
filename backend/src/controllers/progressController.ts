import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { CourseProgress } from '../models/CourseProgress';
import { ChapterProgress } from '../models/ChapterProgress';
import { QuestionProgress } from '../models/QuestionProgress';
import { ApiResponse } from '../types';

export class ProgressController {

  async getCoursesByUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers['x-user-id'] as string;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'User ID is required',
        } as ApiResponse);
        return;
      }

      const courses = await CourseProgress.find({ user_id: userId })
        .populate('course_id')
        .sort({ updatedAt: -1 });

      res.status(200).json({
        success: true,
        message: 'User courses fetched successfully',
        data: courses,
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user courses',
        error: error instanceof Error ? error.message : String(error),
      } as ApiResponse);
    }
  }

  async getCourseProgress(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const userId = req.headers['x-user-id'] as string;

      if (!userId || !courseId) {
        res.status(400).json({
          success: false,
          message: 'User ID and Course ID are required',
        } as ApiResponse);
        return;
      }

      const courseProgress = await CourseProgress.findOne({
        user_id: userId,
        course_id: courseId,
      }).populate('course_id');

      if (!courseProgress) {
        res.status(404).json({
          success: false,
          message: 'Course progress not found',
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Course progress fetched successfully',
        data: courseProgress,
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch course progress',
        error: error instanceof Error ? error.message : String(error),
      } as ApiResponse);
    }
  }

  async bookmarkCourse(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const userId = req.headers['x-user-id'] as string;

      if (!userId || !courseId) {
        res.status(400).json({
          success: false,
          message: 'User ID and Course ID are required',
        } as ApiResponse);
        return;
      }

      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid Course ID',
        } as ApiResponse);
        return;
      }

      // Check if course already exists
      let courseProgress = await CourseProgress.findOne({
        user_id: userId,
        course_id: courseId,
      });

      if (courseProgress) {
        // Toggle bookmark flag
        courseProgress.is_bookmarked = !courseProgress.is_bookmarked;
        await courseProgress.save();
      } else {
        // Create new bookmark record (status is null, only bookmark)
        courseProgress = await CourseProgress.create({
          user_id: userId,
          course_id: courseId,
          is_bookmarked: true,
        });
      }

      await courseProgress.populate('course_id');

      res.status(201).json({
        success: true,
        message: courseProgress.is_bookmarked ? 'Course added to bookmarks' : 'Course removed from bookmarks',
        data: courseProgress,
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to bookmark course',
        error: error instanceof Error ? error.message : String(error),
      } as ApiResponse);
    }
  }

  async startCourse(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const userId = req.headers['x-user-id'] as string;

      if (!userId || !courseId) {
        res.status(400).json({
          success: false,
          message: 'User ID and Course ID are required',
        } as ApiResponse);
        return;
      }

      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid Course ID',
        } as ApiResponse);
        return;
      }

      // Check if course already exists
      let courseProgress = await CourseProgress.findOne({
        user_id: userId,
        course_id: courseId,
      });

      if (courseProgress) {
        // Update existing record to in_progress
        courseProgress.status = 'in_progress';
        await courseProgress.save();
      } else {
        // Create new record with in_progress status
        courseProgress = await CourseProgress.create({
          user_id: userId,
          course_id: courseId,
          status: 'in_progress',
        });
      }

      await courseProgress.populate('course_id');

      res.status(201).json({
        success: true,
        message: 'Course started successfully',
        data: courseProgress,
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to start course',
        error: error instanceof Error ? error.message : String(error),
      } as ApiResponse);
    }
  }

  async updateCourseStatus(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const { status } = req.body;
      const userId = req.headers['x-user-id'] as string;

      if (!userId || !courseId) {
        res.status(400).json({
          success: false,
          message: 'User ID and Course ID are required',
        } as ApiResponse);
        return;
      }

      if (!['in_progress', 'completed'].includes(status)) {
        res.status(400).json({
          success: false,
          message: 'Invalid status. Must be: in_progress or completed',
        } as ApiResponse);
        return;
      }

      const courseProgress = await CourseProgress.findOne({
        user_id: userId,
        course_id: courseId,
      });

      if (!courseProgress) {
        res.status(404).json({
          success: false,
          message: 'Course progress not found. Start course first.',
        } as ApiResponse);
        return;
      }

      courseProgress.status = status;
      await courseProgress.save();
      await courseProgress.populate('course_id');

      res.status(200).json({
        success: true,
        message: 'Course status updated successfully',
        data: courseProgress,
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update course status',
        error: error instanceof Error ? error.message : String(error),
      } as ApiResponse);
    }
  }

  async updateChapterProgress(req: Request, res: Response): Promise<void> {
    try {
      const { chapterId } = req.params;
      const { is_completed } = req.body;
      const userId = req.headers['x-user-id'] as string;

      if (!userId || !chapterId) {
        res.status(400).json({
          success: false,
          message: 'User ID and Chapter ID are required',
        } as ApiResponse);
        return;
      }

      if (typeof is_completed !== 'boolean') {
        res.status(400).json({
          success: false,
          message: 'is_completed must be a boolean',
        } as ApiResponse);
        return;
      }

      const chapterProgress = await ChapterProgress.findOneAndUpdate(
        { user_id: userId, chapter_id: chapterId },
        { is_completed },
        { new: true, upsert: true }
      ).populate('chapter_id');

      res.status(200).json({
        success: true,
        message: 'Chapter progress updated successfully',
        data: chapterProgress,
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update chapter progress',
        error: error instanceof Error ? error.message : String(error),
      } as ApiResponse);
    }
  }

  async getChapterProgress(req: Request, res: Response): Promise<void> {
    try {
      const { chapterId } = req.params;
      const userId = req.headers['x-user-id'] as string;

      if (!userId || !chapterId) {
        res.status(400).json({
          success: false,
          message: 'User ID and Chapter ID are required',
        } as ApiResponse);
        return;
      }

      const chapterProgress = await ChapterProgress.findOne({
        user_id: userId,
        chapter_id: chapterId,
      }).populate('chapter_id');

      if (!chapterProgress) {
        res.status(404).json({
          success: false,
          message: 'Chapter progress not found',
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Chapter progress fetched successfully',
        data: chapterProgress,
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch chapter progress',
        error: error instanceof Error ? error.message : String(error),
      } as ApiResponse);
    }
  }

  async updateQuestionStatus(req: Request, res: Response): Promise<void> {
    try {
      const { questionId } = req.params;
      const { status } = req.body;
      const userId = req.headers['x-user-id'] as string;

      if (!userId || !questionId) {
        res.status(400).json({
          success: false,
          message: 'User ID and Question ID are required',
        } as ApiResponse);
        return;
      }

      if (!['not_attempted', 'correct', 'incorrect'].includes(status)) {
        res.status(400).json({
          success: false,
          message: 'Invalid status. Must be: not_attempted, correct, or incorrect',
        } as ApiResponse);
        return;
      }

      const questionProgress = await QuestionProgress.findOneAndUpdate(
        { user_id: userId, question_id: questionId },
        { status },
        { new: true, upsert: true }
      ).populate('question_id');

      res.status(200).json({
        success: true,
        message: 'Question status updated successfully',
        data: questionProgress,
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update question status',
        error: error instanceof Error ? error.message : String(error),
      } as ApiResponse);
    }
  }

  async getQuestionProgress(req: Request, res: Response): Promise<void> {
    try {
      const { questionId } = req.params;
      const userId = req.headers['x-user-id'] as string;

      if (!userId || !questionId) {
        res.status(400).json({
          success: false,
          message: 'User ID and Question ID are required',
        } as ApiResponse);
        return;
      }

      const questionProgress = await QuestionProgress.findOne({
        user_id: userId,
        question_id: questionId,
      }).populate('question_id');

      if (!questionProgress) {
        res.status(404).json({
          success: false,
          message: 'Question progress not found',
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Question progress fetched successfully',
        data: questionProgress,
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch question progress',
        error: error instanceof Error ? error.message : String(error),
      } as ApiResponse);
    }
  }

  async getModuleQuestionStatuses(req: Request, res: Response): Promise<void> {
    try {
      const { moduleId } = req.params;
      const userId = req.headers['x-user-id'] as string;

      if (!userId || !moduleId) {
        res.status(400).json({
          success: false,
          message: 'User ID and Module ID are required',
        } as ApiResponse);
        return;
      }

      const questionProgresses = await QuestionProgress.find({
        user_id: userId,
      })
        .populate({
          path: 'question_id',
          match: { module_id: moduleId },
        })
        .exec();

      const filteredProgresses = questionProgresses.filter(
        (qp) => qp.question_id !== null
      );

      res.status(200).json({
        success: true,
        message: 'Module question statuses fetched successfully',
        data: filteredProgresses,
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch module question statuses',
        error: error instanceof Error ? error.message : String(error),
      } as ApiResponse);
    }
  }
}

export const progressController = new ProgressController();
