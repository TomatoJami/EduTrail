import { Request, Response } from 'express';
import { supabaseService } from '../services/supabaseService';
import { ApiResponse } from '../types';

// Handles image upload requests before delegating storage writes to Supabase.
export class UploadController {
  async uploadImage(req: Request, res: Response): Promise<void> {
    // Validates the multipart file and uploads it into the requested Supabase folder.
    try {
      // Ensure a file was sent before validating image metadata.
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No file provided',
        } as ApiResponse);
        return;
      }

      // Only image MIME types supported by the course editor are accepted.
      const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedMimes.includes(req.file.mimetype)) {
        res.status(400).json({
          success: false,
          message: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed',
        } as ApiResponse);
        return;
      }

      // Keep uploads small enough to process in memory safely.
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (req.file.size > maxSize) {
        res.status(400).json({
          success: false,
          message: 'File size exceeds 5MB limit',
        } as ApiResponse);
        return;
      }

      // Restrict uploads to known storage folders.
      const folder = (req.query.folder as string) || 'subjects';
      if (!['subjects', 'courses', 'questions', 'chapters'].includes(folder)) {
        res.status(400).json({
          success: false,
          message: 'Invalid folder. Must be "subjects", "courses", "questions", or "chapters"',
        } as ApiResponse);
        return;
      }

      // Normalize and store the image through Supabase Storage.
      const imageUrl = await supabaseService.uploadImage(
        req.file.buffer,
        req.file.originalname,
        folder as 'subjects' | 'courses' | 'questions' | 'chapters'
      );

      res.status(200).json({
        success: true,
        message: 'Image uploaded successfully',
        data: {
          imageUrl,
          fileName: req.file.originalname,
          size: req.file.size,
        },
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to upload image',
        error: error instanceof Error ? error.message : String(error),
      } as ApiResponse);
    }
  }
}

export const uploadController = new UploadController();
