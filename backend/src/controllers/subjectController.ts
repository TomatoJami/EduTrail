import { Request, Response } from 'express';
import { subjectService, SubjectPayload } from '../services/subjectService';
import { ApiResponse } from '../types';

export class SubjectController {
  async getAllSubjects(req: Request, res: Response): Promise<void> {
    try {
      console.log('Fetching all subjects...');
      const subjects = await subjectService.getAllSubjects();
      console.log(`Found ${subjects.length} subjects:`, subjects);

      res.status(200).json({
        success: true,
        message: 'Subjects fetched successfully',
        data: subjects,
      } as ApiResponse);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch subjects',
        error: error instanceof Error ? error.message : String(error),
      } as ApiResponse);
    }
  }

  async createSubject(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body as {
        subject_name?: string;
        subject_img?: string;
      };

      if (!body.subject_name || !body.subject_img) {
        res.status(400).json({
          success: false,
          message: 'subject_name and subject_img are required',
        } as ApiResponse);
        return;
      }

      const payload: SubjectPayload = {
        subject_name: body.subject_name.trim(),
        subject_img: body.subject_img.trim(),
      };

      const subject = await subjectService.createSubject(payload);
      res.status(201).json({
        success: true,
        message: 'Subject created successfully',
        data: subject,
      } as ApiResponse);
    } catch (error) {
      const err = error as { code?: number };
      if (err.code === 11000) {
        res.status(409).json({
          success: false,
          message: 'Subject with this name already exists',
        } as ApiResponse);
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create subject',
        error: error instanceof Error ? error.message : String(error),
      } as ApiResponse);
    }
  }

  async updateSubject(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const body = req.body as {
        subject_name?: string;
        subject_img?: string;
      };

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Subject id is required',
        } as ApiResponse);
        return;
      }

      const payload: Partial<SubjectPayload> = {
        subject_name: body.subject_name?.trim(),
        subject_img: body.subject_img?.trim(),
      };

      const subject = await subjectService.updateSubject(id, payload);
      if (!subject) {
        res.status(404).json({
          success: false,
          message: 'Subject not found',
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Subject updated successfully',
        data: subject,
      } as ApiResponse);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const status = message.includes('Invalid subject id') ? 400 : 500;

      res.status(status).json({
        success: false,
        message: 'Failed to update subject',
        error: message,
      } as ApiResponse);
    }
  }

  async deleteSubject(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Subject id is required',
        } as ApiResponse);
        return;
      }

      const subject = await subjectService.deleteSubject(id);
      if (!subject) {
        res.status(404).json({
          success: false,
          message: 'Subject not found',
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Subject deleted successfully',
        data: subject,
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete subject',
        error: error instanceof Error ? error.message : String(error),
      } as ApiResponse);
    }
  }

  async getSubject(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const subject = await subjectService.getSubjectById(id);
      if (!subject) {
        res.status(404).json({
          success: false,
          message: 'Subject not found',
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Subject fetched successfully',
        data: subject,
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch subject',
        error: error instanceof Error ? error.message : String(error),
      } as ApiResponse);
    }
  }
}

export const subjectController = new SubjectController();
