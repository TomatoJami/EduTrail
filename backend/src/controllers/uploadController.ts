import { Request, Response } from 'express';
import { supabaseService } from '../services/supabaseService';
import { ApiResponse } from '../types';

export class UploadController {
  async uploadImage(req: Request, res: Response): Promise<void> {
    try {
      // Проверка наличия файла
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No file provided',
        } as ApiResponse);
        return;
      }

      // Проверка типа файла
      const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedMimes.includes(req.file.mimetype)) {
        res.status(400).json({
          success: false,
          message: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed',
        } as ApiResponse);
        return;
      }

      // Проверка размера (макс 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (req.file.size > maxSize) {
        res.status(400).json({
          success: false,
          message: 'File size exceeds 5MB limit',
        } as ApiResponse);
        return;
      }

      // Определить папку из query параметра
      const folder = (req.query.folder as string) || 'subjects';
      if (!['subjects', 'courses'].includes(folder)) {
        res.status(400).json({
          success: false,
          message: 'Invalid folder. Must be "subjects" or "courses"',
        } as ApiResponse);
        return;
      }

      // Загрузить картинку в Supabase
      const imageUrl = await supabaseService.uploadImage(
        req.file.buffer,
        req.file.originalname,
        folder as 'subjects' | 'courses'
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
      console.error('Upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload image',
        error: error instanceof Error ? error.message : String(error),
      } as ApiResponse);
    }
  }
}

export const uploadController = new UploadController();
