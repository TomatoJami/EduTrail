import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { chapterService, ChapterPayload } from '../services/chapterService';
import { Chapter } from '../models/Chapter';
import { ChapterProgress } from '../models/ChapterProgress';
import { ApiResponse } from '../types';

// Handles HTTP validation/response shaping for chapter content and progress requests.
export class ChapterController {
    async getAllChapters(req: Request, res: Response): Promise<void> {
        // Returns all chapters or the chapters for a requested module_id query.
        try {
            const { module_id } = req.query;
            
            let chapters;
            if (module_id && typeof module_id === 'string') {
                chapters = await chapterService.getChaptersByModuleId(module_id);
            } else {
                chapters = await chapterService.getAllChapters();
            }
            
            res.status(200).json({
                success: true,
                message: 'Chapters fetched successfully',
                data: chapters,
            } as ApiResponse);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch chapters',
                error: error instanceof Error ? error.message : String(error),
            } as ApiResponse);
        }
    }

    async getChapterById(req: Request, res: Response): Promise<void> {
        // Fetches one chapter for lesson pages and admin editing.
        try {
            const { id } = req.params;
            const chapter = await chapterService.getChapterById(id);
            if (!chapter) {
                res.status(404).json({
                    success: false,
                    message: 'Chapter not found',
                } as ApiResponse);
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Chapter fetched successfully',
                data: chapter,
            } as ApiResponse);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch chapter',
                error: error instanceof Error ? error.message : String(error),
            } as ApiResponse);
        }
    }

    async createChapter(req: Request, res: Response): Promise<void> {
        // Validates chapter input before creating content under a module.
        try {
            const body = req.body as {
                title?: string;
                content?: string;
                order?: number;
                module_id?: string;
            };
    
            if (!body.title || !body.content || !body.module_id) {
                res.status(400).json({
                    success: false,
                    message: 'title, content, and module_id are required',
                } as ApiResponse);
                return;
            }
    
            if (!mongoose.isValidObjectId(body.module_id)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid module_id',
                } as ApiResponse);
            return;
            }
    
            const payload: ChapterPayload = {
                title: body.title.trim(),
                content: body.content.trim(),
                order: body.order,
                module_id: body.module_id.trim()
            };
    
            const chapter = await chapterService.createChapter(payload);
                res.status(201).json({
                    success: true,
                    message: 'Chapter created successfully',
                    data: chapter,
                } as ApiResponse);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to create chapter',
                error: error instanceof Error ? error.message : String(error),
            } as ApiResponse);
        }
    }

    async updateChapter(req: Request, res: Response): Promise<void> {
        // Updates chapter content and lets the service clean removed images.
        try {
            const { id } = req.params;
            const body = req.body as {
                title?: string;
                content?: string;
                order?: number;
                module_id?: string;
            };
    
            if (!id) {
                res.status(400).json({
                success: false,
                message: 'chapter id is required',
                } as ApiResponse);
                return;
            }
        
            const payload: Partial<ChapterPayload> = {
                title: body.title?.trim(),
                content: body.content?.trim(),
                order: body.order,
                module_id: body.module_id?.trim(),
            };
        
            const chapter = await chapterService.updateChapter(id, payload);
            if (!chapter) {
                res.status(404).json({
                    success: false,
                    message: 'Chapter not found',
                } as ApiResponse);
                return;
            }
        
            res.status(200).json({
                success: true,
                message: 'Chapter updated successfully',
                data: chapter,
            } as ApiResponse);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to update chapter',
                error: error instanceof Error ? error.message : String(error),
            } as ApiResponse);
        }
    }

    async deleteChapter(req: Request, res: Response): Promise<void> {
        // Deletes a chapter and triggers related storage cleanup.
        try {
            const { id } = req.params;
        
            if (!id) {
                res.status(400).json({
                success: false,
                message: 'Chapter id is required',
                } as ApiResponse);
                return;
            }
    
            const chapter = await chapterService.deleteChapter(id);
            if (!chapter) {
                res.status(404).json({
                success: false,
                message: 'Chapter not found',
                } as ApiResponse);
                return;
            }
    
            res.status(200).json({
                success: true,
                message: 'Chapter deleted successfully',
                data: chapter,
            } as ApiResponse);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to delete chapter',
                error: error instanceof Error ? error.message : String(error),
            } as ApiResponse);
        }
    }

    async getUserChaptersProgress(req: Request, res: Response): Promise<void> {
        // Returns chapter completion records for one user/module pair.
        try {
            const { userId, moduleId } = req.params;
            const authReq = req as Request & { userId?: string; userRole?: 'student' | 'admin' };

            if (!userId || !moduleId) {
                res.status(400).json({
                    success: false,
                    message: 'userId and moduleId are required',
                } as ApiResponse);
                return;
            }

            // Prevent users from reading another student's chapter progress by changing the URL.
            if (authReq.userRole !== 'admin' && authReq.userId !== userId) {
                res.status(403).json({
                    success: false,
                    message: 'Forbidden: cannot access another user progress',
                } as ApiResponse);
                return;
            }

            if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(moduleId)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid userId or moduleId',
                } as ApiResponse);
                return;
            }

            // Convert to ObjectId
            const userObjectId = new mongoose.Types.ObjectId(userId);
            const moduleObjectId = new mongoose.Types.ObjectId(moduleId);

            // Get all chapters for this module
            const chapters = await Chapter.find({ module_id: moduleObjectId });

            const chapterIds = chapters.map(ch => ch._id);

            // Get progress for all these chapters
            const progress = await ChapterProgress.find({
                user_id: userObjectId,
                chapter_id: { $in: chapterIds },
            });

            // Convert ObjectIds to strings for JSON response
            const progressWithStringIds = progress.map(p => ({
              _id: p._id.toString(),
              user_id: p.user_id.toString(),
              chapter_id: p.chapter_id.toString(),
              is_completed: p.is_completed,
            }));

            res.status(200).json({
                success: true,
                message: 'User chapters progress fetched successfully',
                data: progressWithStringIds,
            } as ApiResponse);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch user chapters progress',
                error: error instanceof Error ? error.message : String(error),
            } as ApiResponse);
        }
    }
}

export const chapterController = new ChapterController();
