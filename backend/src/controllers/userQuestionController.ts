import { Request, Response } from 'express';
import { userQuestionService, UserQuestionPayload } from '../services/userQuestionService';
import { ApiResponse } from '../types';

export class UserQuestionController {
  async getUserQuestion(req: Request, res: Response): Promise<void> {
    try {
      const { userId, questionId } = req.params;
      const userQuestion = await userQuestionService.getUserQuestion(userId, questionId);

      if (!userQuestion) {
        res.status(404).json({
          success: false,
          message: 'User question not found',
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'User question fetched successfully',
        data: userQuestion,
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user question',
        error: error instanceof Error ? error.message : String(error),
      } as ApiResponse);
    }
  }

  async getUserQuestions(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const userQuestions = await userQuestionService.getUserQuestions(userId);

      res.status(200).json({
        success: true,
        message: 'User questions fetched successfully',
        data: userQuestions,
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user questions',
        error: error instanceof Error ? error.message : String(error),
      } as ApiResponse);
    }
  }

  async getUserQuestionsByModule(req: Request, res: Response): Promise<void> {
    try {
      const { userId, moduleId } = req.params;
      const userQuestions = await userQuestionService.getUserQuestionsByModule(userId, moduleId);

      res.status(200).json({
        success: true,
        message: 'User questions by module fetched successfully',
        data: userQuestions,
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user questions by module',
        error: error instanceof Error ? error.message : String(error),
      } as ApiResponse);
    }
  }

  async createOrUpdateUserQuestion(req: Request, res: Response): Promise<void> {
    try {
      const payload = req.body as UserQuestionPayload;
      const userQuestion = await userQuestionService.createOrUpdateUserQuestion(payload);

      res.status(200).json({
        success: true,
        message: 'User question created or updated successfully',
        data: userQuestion,
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create or update user question',
        error: error instanceof Error ? error.message : String(error),
      } as ApiResponse);
    }
  }

  async markQuestionCompleted(req: Request, res: Response): Promise<void> {
    try {
      const { userId, questionId } = req.params;
      const { completed } = req.body;

      if (typeof completed !== 'boolean') {
        res.status(400).json({
          success: false,
          message: 'completed must be a boolean',
        } as ApiResponse);
        return;
      }

      const userQuestion = await userQuestionService.markQuestionCompleted(userId, questionId, completed);

      if (!userQuestion) {
        res.status(404).json({
          success: false,
          message: 'User question not found',
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Question marked as ' + (completed ? 'completed' : 'incomplete'),
        data: userQuestion,
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to mark question completed',
        error: error instanceof Error ? error.message : String(error),
      } as ApiResponse);
    }
  }

  async deleteUserQuestion(req: Request, res: Response): Promise<void> {
    try {
      const { userId, questionId } = req.params;
      const userQuestion = await userQuestionService.deleteUserQuestion(userId, questionId);

      if (!userQuestion) {
        res.status(404).json({
          success: false,
          message: 'User question not found',
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'User question deleted successfully',
        data: userQuestion,
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete user question',
        error: error instanceof Error ? error.message : String(error),
      } as ApiResponse);
    }
  }
}

export const userQuestionController = new UserQuestionController();
