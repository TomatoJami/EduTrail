import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { CourseProgress } from '../models/CourseProgress';
import { ChapterProgress } from '../models/ChapterProgress';
import { QuestionProgress } from '../models/QuestionProgress';
import { Module } from '../models/Module';
import { Chapter } from '../models/Chapter';
import { Question } from '../models/Question';
import { ApiResponse } from '../types';

function getAuthenticatedUserId(req: Request) {
  return (req as Request & { userId?: string }).userId || (req.headers['x-user-id'] as string);
}

export class ProgressController {

  async getCoursesByUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = getAuthenticatedUserId(req);

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
      const userId = getAuthenticatedUserId(req);

      if (!userId || !courseId) {
        res.status(400).json({
          success: false,
          message: "User ID and Course ID are required",
        });
        return;
      }

      let courseObjectId: mongoose.Types.ObjectId;
      let userObjectId: mongoose.Types.ObjectId;
      try {
        courseObjectId = new mongoose.Types.ObjectId(courseId);
        userObjectId = new mongoose.Types.ObjectId(userId);
      } catch (e) {
        res.status(400).json({
          success: false,
          message: "Invalid ID format",
        });
        return;
      }

      const courseProgress = await CourseProgress.findOne({
        user_id: userObjectId,
        course_id: courseObjectId,
      }).populate("course_id");

      // Get all modules for this course
      const modules = await Module.find({ course_id: courseObjectId });

      const moduleIds = modules.map((m: any) => new mongoose.Types.ObjectId(String(m._id)));

      // Get all chapters for these modules
      const courseChapters = await Chapter.find({ module_id: { $in: moduleIds } });

      const chapterIds = courseChapters.map((ch: any) => new mongoose.Types.ObjectId(String(ch._id)));

      // Get chapter progress only for chapters in this course
      const chapters = await ChapterProgress.find({
        user_id: userObjectId,
        chapter_id: { $in: chapterIds },
      });

      // Get question progress only for questions in this course
      const questions = await QuestionProgress.find({
        user_id: userId,
      });

      const chaptersMap: Record<string, boolean> = {};

      for (const ch of chapters) {
        chaptersMap[String(ch.chapter_id)] = Boolean(ch.is_completed);
      }

      const questionsMap: Record<string, boolean> = {};

      for (const q of questions) {
        const questionId =
          q.question_id instanceof mongoose.Types.ObjectId
            ? q.question_id.toString()
            : String(q.question_id);

        questionsMap[questionId] = Boolean(q.is_completed);
      }

      // Build response with both progress data and courseProgress metadata
      const responseData = {
        success: true,
        message: "Course progress fetched successfully",
        data: {
          // Include courseProgress metadata (status, is_bookmarked, etc)
          ...(courseProgress ? courseProgress.toObject() : {}),
          // Override/add chapters and questions from current calculation
          chapters: chaptersMap,
          questions: questionsMap,
        },
      };

      res.status(200).json(responseData);

    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch course progress",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async bookmarkCourse(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const userId = getAuthenticatedUserId(req);

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
      const userId = getAuthenticatedUserId(req);

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
      const userId = getAuthenticatedUserId(req);

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

      if (status === 'completed') {
        const courseModules = await Module.find({ course_id: courseId }).select('_id');
        const moduleIds = courseModules.map((module) => module._id);
        const courseChapters = await Chapter.find({ module_id: { $in: moduleIds } }).select('_id');
        const courseQuestions = await Question.find({ module_id: { $in: moduleIds } }).select('_id');

        const chapterIds = courseChapters.map((chapter) => chapter._id);
        const questionIds = courseQuestions.map((question) => question._id);

        const completedChapters = await ChapterProgress.countDocuments({
          user_id: userId,
          chapter_id: { $in: chapterIds },
          is_completed: true,
        });

        const completedQuestions = await QuestionProgress.countDocuments({
          user_id: userId,
          question_id: { $in: questionIds },
          is_completed: true,
        });

        if (
          completedChapters !== chapterIds.length ||
          completedQuestions !== questionIds.length
        ) {
          res.status(400).json({
            success: false,
            message: 'Complete all modules first.',
          } as ApiResponse);
          return;
        }
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
      const userId = getAuthenticatedUserId(req);

      if (!userId || !chapterId) {
        res.status(400).json({
          success: false,
          message: 'User ID and Chapter ID are required',
        });
        return;
      }

      if (typeof is_completed !== 'boolean') {
        res.status(400).json({
          success: false,
          message: 'is_completed must be boolean',
        });
        return;
      }

      const chapterObjectId = new mongoose.Types.ObjectId(chapterId);
      const userObjectId = new mongoose.Types.ObjectId(userId);

      const chapterProgress = await ChapterProgress.findOneAndUpdate(
        {
          user_id: userObjectId,
          chapter_id: chapterObjectId,
        },
        {
          user_id: userObjectId,
          chapter_id: chapterObjectId,
          is_completed,
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        }
      );

      res.status(200).json({
        success: true,
        message: 'Chapter progress updated successfully',
        data: chapterProgress,
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update chapter progress',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async getChapterProgress(req: Request, res: Response): Promise<void> {
    try {
      const { chapterId } = req.params;
      const userId = getAuthenticatedUserId(req);

      if (!userId || !chapterId) {
        res.status(400).json({
          success: false,
          message: 'User ID and Chapter ID are required',
        } as ApiResponse);
        return;
      }

      const chapterProgress = await ChapterProgress.findOne({
        user_id: userId,
        chapter_id: new mongoose.Types.ObjectId(chapterId),
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
      const { is_completed } = req.body;
      const userId = getAuthenticatedUserId(req);

      if (!userId || !questionId) {
        res.status(400).json({
          success: false,
          message: 'User ID and Question ID are required',
        } as ApiResponse);
        return;
      }

      if (typeof is_completed !== 'boolean') {
        res.status(400).json({
          success: false,
          message: 'is_completed must be boolean',
        } as ApiResponse);
        return;
      }

      const userObjectId = new mongoose.Types.ObjectId(userId);
      const questionObjectId = new mongoose.Types.ObjectId(questionId);

      const questionProgress = await QuestionProgress.findOneAndUpdate(
        { user_id: userObjectId, question_id: questionObjectId },
        { 
          user_id: userObjectId, 
          question_id: questionObjectId, 
          is_completed 
        },
        { new: true, upsert: true }
      ).populate('question_id');

      res.status(200).json({
        success: true,
        message: 'Question progress updated successfully',
        data: questionProgress,
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update question progress',
        error: error instanceof Error ? error.message : String(error),
      } as ApiResponse);
    }
  }

  async getQuestionProgress(req: Request, res: Response): Promise<void> {
    try {
      const { questionId } = req.params;
      const userId = getAuthenticatedUserId(req);

      if (!userId || !questionId) {
        res.status(400).json({
          success: false,
          message: 'User ID and Question ID are required',
        } as ApiResponse);
        return;
      }

      const userObjectId = new mongoose.Types.ObjectId(userId);
      const questionObjectId = new mongoose.Types.ObjectId(questionId);

      const questionProgress = await QuestionProgress.findOne({
        user_id: userObjectId,
        question_id: questionObjectId,
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
      const userId = getAuthenticatedUserId(req);

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
