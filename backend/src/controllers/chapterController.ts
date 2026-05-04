import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { chapterService, ChapterPayload } from '../services/chapterService';
import { ApiResponse } from '../types';

export class ChapterController {
    async getAllChapters(req: Request, res: Response): Promise<void> {
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
            console.error('Error fetching chapter:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch chapter',
                error: error instanceof Error ? error.message : String(error),
            } as ApiResponse);
        }
    }

    async createChapter(req: Request, res: Response): Promise<void> {
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
}

export const chapterController = new ChapterController();