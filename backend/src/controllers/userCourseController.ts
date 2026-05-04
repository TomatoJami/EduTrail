import { Request, Response } from 'express';
import { userCourseService, UserCoursePayload } from '../services/userCourseService';
import { ApiResponse } from '../types';

export class UserCourseController {
  async getUserCourse(req: Request, res: Response): Promise<void> {
    try {
      const { userId, courseId } = req.params;
      const userCourse = await userCourseService.getUserCourse(userId, courseId);

      if (!userCourse) {
        res.status(404).json({
          success: false,
          message: 'User course not found',
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'User course fetched successfully',
        data: userCourse,
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user course',
        error: error instanceof Error ? error.message : String(error),
      } as ApiResponse);
    }
  }

  async getUserCourses(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const userCourses = await userCourseService.getUserCourses(userId);

      res.status(200).json({
        success: true,
        message: 'User courses fetched successfully',
        data: userCourses,
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user courses',
        error: error instanceof Error ? error.message : String(error),
      } as ApiResponse);
    }
  }

  async createOrUpdateUserCourse(req: Request, res: Response): Promise<void> {
    try {
      const payload = req.body as UserCoursePayload;
      const userCourse = await userCourseService.createOrUpdateUserCourse(payload);

      res.status(200).json({
        success: true,
        message: 'User course created or updated successfully',
        data: userCourse,
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create or update user course',
        error: error instanceof Error ? error.message : String(error),
      } as ApiResponse);
    }
  }

  async markCourseCompleted(req: Request, res: Response): Promise<void> {
    try {
      const { userId, courseId } = req.params;
      const { completed } = req.body;

      if (typeof completed !== 'boolean') {
        res.status(400).json({
          success: false,
          message: 'completed must be a boolean',
        } as ApiResponse);
        return;
      }

      const userCourse = await userCourseService.markCourseCompleted(userId, courseId, completed);

      if (!userCourse) {
        res.status(404).json({
          success: false,
          message: 'User course not found',
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Course marked as ' + (completed ? 'completed' : 'incomplete'),
        data: userCourse,
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to mark course completed',
        error: error instanceof Error ? error.message : String(error),
      } as ApiResponse);
    }
  }

  async saveCourse(req: Request, res: Response): Promise<void> {
    try {
      const { userId, courseId } = req.params;
      const { saved } = req.body;

      if (typeof saved !== 'boolean') {
        res.status(400).json({
          success: false,
          message: 'saved must be a boolean',
        } as ApiResponse);
        return;
      }

      const userCourse = await userCourseService.saveCourse(userId, courseId, saved);

      if (!userCourse) {
        res.status(404).json({
          success: false,
          message: 'User course not found',
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Course ' + (saved ? 'saved' : 'unsaved'),
        data: userCourse,
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to save course',
        error: error instanceof Error ? error.message : String(error),
      } as ApiResponse);
    }
  }

  async deleteUserCourse(req: Request, res: Response): Promise<void> {
    try {
      const { userId, courseId } = req.params;
      const userCourse = await userCourseService.deleteUserCourse(userId, courseId);

      if (!userCourse) {
        res.status(404).json({
          success: false,
          message: 'User course not found',
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'User course deleted successfully',
        data: userCourse,
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete user course',
        error: error instanceof Error ? error.message : String(error),
      } as ApiResponse);
    }
  }
}

export const userCourseController = new UserCourseController();
