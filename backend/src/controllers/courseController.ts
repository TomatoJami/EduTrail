import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { courseService, CoursePayload } from '../services/courseService';
import { ApiResponse, CourseAgeGroup } from '../types';
import { COURSE_TEXT_LIMIT } from '../models/Course';

const allowedAgeGroups = ['1-3', '4-9', '10-12'] as const;

function normalizeGoals(goals?: unknown): string[] {
  if (!Array.isArray(goals)) {
    return [];
  }

  return goals
    .filter((goal): goal is string => typeof goal === 'string')
    .map((goal) => goal.trim())
    .filter(Boolean);
}

function findTextLimitError(fields: Record<string, string | undefined>, goals: string[]): string | null {
  for (const [label, value] of Object.entries(fields)) {
    if (value && value.length > COURSE_TEXT_LIMIT) {
      return `${label} cannot exceed ${COURSE_TEXT_LIMIT} characters`;
    }
  }

  if (goals.some((goal) => goal.length > COURSE_TEXT_LIMIT)) {
    return `Each goal cannot exceed ${COURSE_TEXT_LIMIT} characters`;
  }

  return null;
}

export class CourseController {
  async getAllCourses(req: Request, res: Response): Promise<void> {
    try {
      const courses = await courseService.getAllCourses();

      res.status(200).json({
        success: true,
        message: 'Courses fetched successfully',
        data: courses,
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch courses',
        error: error instanceof Error ? error.message : String(error),
      } as ApiResponse);
    }
  }

  async getCourseById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const course = await courseService.getCourseById(id);
      if (!course) {
        res.status(404).json({
          success: false,
          message: 'Course not found',
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Course fetched successfully',
        data: course,
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch course',
        error: error instanceof Error ? error.message : String(error),
      } as ApiResponse);
    }
  }

  async createCourse(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body as {
        title?: string;
        description?: string;
        goals?: string[];
        ageGroup?: CourseAgeGroup;
        course_img?: string;
        subject_id?: string;
      };

      if (!body.title || !body.description || !body.course_img || !body.subject_id || !body.ageGroup) {
        res.status(400).json({
          success: false,
          message: 'title, description, ageGroup, course_img and subject_id are required',
        } as ApiResponse);
        return;
      }

      if (!allowedAgeGroups.includes(body.ageGroup)) {
        res.status(400).json({
          success: false,
          message: 'Invalid ageGroup value',
        } as ApiResponse);
        return;
      }

      if (!mongoose.isValidObjectId(body.subject_id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid subject_id',
        } as ApiResponse);
        return;
      }

      const title = body.title.trim();
      const description = body.description.trim();
      const goals = normalizeGoals(body.goals);
      const textLimitError = findTextLimitError({ title, description }, goals);

      if (textLimitError) {
        res.status(400).json({
          success: false,
          message: textLimitError,
        } as ApiResponse);
        return;
      }

      const payload: CoursePayload = {
        title,
        description,
        goals,
        ageGroup: body.ageGroup,
        course_img: body.course_img.trim(),
        subject_id: body.subject_id.trim(),
      };

      const course = await courseService.createCourse(payload);
      res.status(201).json({
        success: true,
        message: 'Course created successfully',
        data: course,
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create course',
        error: error instanceof Error ? error.message : String(error),
      } as ApiResponse);
    }
  }

  async updateCourse(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const body = req.body as {
        title?: string;
        description?: string;
        goals?: string[];
        ageGroup?: CourseAgeGroup;
        course_img?: string;
        subject_id?: string;
      };

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Course id is required',
        } as ApiResponse);
        return;
      }

      if (body.ageGroup && !allowedAgeGroups.includes(body.ageGroup)) {
        res.status(400).json({
          success: false,
          message: 'Invalid ageGroup value',
        } as ApiResponse);
        return;
      }

      if (body.subject_id && !mongoose.isValidObjectId(body.subject_id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid subject_id',
        } as ApiResponse);
        return;
      }

      const title = body.title?.trim();
      const description = body.description?.trim();
      const goals = body.goals === undefined ? undefined : normalizeGoals(body.goals);
      const textLimitError = findTextLimitError({ title, description }, goals || []);

      if (textLimitError) {
        res.status(400).json({
          success: false,
          message: textLimitError,
        } as ApiResponse);
        return;
      }

      const payload: Partial<CoursePayload> = {
        title,
        description,
        goals,
        ageGroup: body.ageGroup,
        course_img: body.course_img?.trim(),
        subject_id: body.subject_id?.trim(),
      };

      const course = await courseService.updateCourse(id, payload);
      if (!course) {
        res.status(404).json({
          success: false,
          message: 'Course not found',
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Course updated successfully',
        data: course,
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update course',
        error: error instanceof Error ? error.message : String(error),
      } as ApiResponse);
    }
  }

  async deleteCourse(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Course id is required',
        } as ApiResponse);
        return;
      }

      const course = await courseService.deleteCourse(id);
      if (!course) {
        res.status(404).json({
          success: false,
          message: 'Course not found',
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Course deleted successfully',
        data: course,
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete course',
        error: error instanceof Error ? error.message : String(error),
      } as ApiResponse);
    }
  }
}

export const courseController = new CourseController();
