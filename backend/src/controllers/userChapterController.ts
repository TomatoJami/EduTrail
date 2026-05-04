import { Request, Response } from 'express';
import { userChapterService, UserChapterPayload } from '../services/userChapterService';
import { ApiResponse } from '../types';

export class UserChapterController {
  async getUserChapter(req: Request, res: Response): Promise<void> {
    try {
      const { userId, chapterId } = req.params;
      const userChapter = await userChapterService.getUserChapter(userId, chapterId);

      if (!userChapter) {
        res.status(404).json({
          success: false,
          message: 'User chapter not found',
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'User chapter fetched successfully',
        data: userChapter,
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user chapter',
        error: error instanceof Error ? error.message : String(error),
      } as ApiResponse);
    }
  }

  async getUserChapters(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const userChapters = await userChapterService.getUserChapters(userId);

      res.status(200).json({
        success: true,
        message: 'User chapters fetched successfully',
        data: userChapters,
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user chapters',
        error: error instanceof Error ? error.message : String(error),
      } as ApiResponse);
    }
  }

  async getUserChaptersByModule(req: Request, res: Response): Promise<void> {
    try {
      const { userId, moduleId } = req.params;
      const userChapters = await userChapterService.getUserChaptersByModule(userId, moduleId);

      res.status(200).json({
        success: true,
        message: 'User chapters by module fetched successfully',
        data: userChapters,
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user chapters by module',
        error: error instanceof Error ? error.message : String(error),
      } as ApiResponse);
    }
  }

  async createOrUpdateUserChapter(req: Request, res: Response): Promise<void> {
    try {
      const payload = req.body as UserChapterPayload;
      const userChapter = await userChapterService.createOrUpdateUserChapter(payload);

      res.status(200).json({
        success: true,
        message: 'User chapter created or updated successfully',
        data: userChapter,
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create or update user chapter',
        error: error instanceof Error ? error.message : String(error),
      } as ApiResponse);
    }
  }

  async markChapterCompleted(req: Request, res: Response): Promise<void> {
    try {
      const { userId, chapterId } = req.params;
      const { completed } = req.body;

      if (typeof completed !== 'boolean') {
        res.status(400).json({
          success: false,
          message: 'completed must be a boolean',
        } as ApiResponse);
        return;
      }

      const userChapter = await userChapterService.markChapterCompleted(userId, chapterId, completed);

      if (!userChapter) {
        res.status(404).json({
          success: false,
          message: 'User chapter not found',
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Chapter marked as ' + (completed ? 'completed' : 'incomplete'),
        data: userChapter,
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to mark chapter completed',
        error: error instanceof Error ? error.message : String(error),
      } as ApiResponse);
    }
  }

  async deleteUserChapter(req: Request, res: Response): Promise<void> {
    try {
      const { userId, chapterId } = req.params;
      const userChapter = await userChapterService.deleteUserChapter(userId, chapterId);

      if (!userChapter) {
        res.status(404).json({
          success: false,
          message: 'User chapter not found',
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'User chapter deleted successfully',
        data: userChapter,
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete user chapter',
        error: error instanceof Error ? error.message : String(error),
      } as ApiResponse);
    }
  }
}

export const userChapterController = new UserChapterController();
