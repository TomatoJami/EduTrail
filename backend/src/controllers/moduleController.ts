import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { moduleService, ModulePayload } from '../services/moduleService';
import { ApiResponse } from '../types';

// Handles HTTP validation/response shaping for course module requests.
export class ModuleController {
    async getAllModules(req: Request, res: Response): Promise<void> {
        // Returns all modules or only modules for the requested course_id query.
        try {
            const { course_id } = req.query;
            
            let modules;
            if (course_id && typeof course_id === 'string') {
                modules = await moduleService.getModulesByCourseId(course_id);
            } else {
                modules = await moduleService.getAllModules();
            }
            
            res.status(200).json({
                success: true,
                message: 'Modules fetched successfully',
                data: modules,
            } as ApiResponse);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch modules',
                error: error instanceof Error ? error.message : String(error),
            } as ApiResponse);
        }
    }

    async getModuleById(req: Request, res: Response): Promise<void> {
        // Fetches one module by id for detail views and admin editing.
        try {
            const { id } = req.params;
            const module = await moduleService.getModuleById(id);
            if (!module) {
                res.status(404).json({
                    success: false,
                    message: 'Module not found',
                } as ApiResponse);
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Module fetched successfully',
                data: module,
            } as ApiResponse);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch module',
                error: error instanceof Error ? error.message : String(error),
            } as ApiResponse);
        }
    }

    async createModule(req: Request, res: Response): Promise<void> {
        // Validates module input and creates it under a course.
        try {
            const body = req.body as {
                title?: string;
                order?: number;
                course_id?: string;
            };
    
            if (!body.title || !body.course_id) {
                res.status(400).json({
                    success: false,
                    message: 'title and course_id are required',
                } as ApiResponse);
                return;
            }
    
            if (!mongoose.isValidObjectId(body.course_id)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid course_id',
                } as ApiResponse);
            return;
            }
    
            const payload: ModulePayload = {
                title: body.title.trim(),
                order: body.order,
                course_id: body.course_id.trim(),
            };
    
            const module = await moduleService.createModule(payload);
                res.status(201).json({
                    success: true,
                    message: 'Module created successfully',
                    data: module,
                } as ApiResponse);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to create module',
                error: error instanceof Error ? error.message : String(error),
            } as ApiResponse);
        }
    }

    async updateModule(req: Request, res: Response): Promise<void> {
        // Updates module title/order while preserving its course ownership.
        try {
            const { id } = req.params;
            const body = req.body as {
                title?: string;
                order?: number;
                course_id?: string;
            };
    
            if (!id) {
                res.status(400).json({
                success: false,
                message: 'module id is required',
                } as ApiResponse);
                return;
            }
        
            const payload: Partial<ModulePayload> = {
                title: body.title?.trim(),
                order: body.order,
                course_id: body.course_id?.trim(),
            };
        
            const module = await moduleService.updateModule(id, payload);
            if (!module) {
                res.status(404).json({
                    success: false,
                    message: 'Module not found',
                } as ApiResponse);
                return;
            }
        
            res.status(200).json({
                success: true,
                message: 'Module updated successfully',
                data: module,
            } as ApiResponse);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to update module',
                error: error instanceof Error ? error.message : String(error),
            } as ApiResponse);
        }
    }

    async deleteModule(req: Request, res: Response): Promise<void> {
        // Deletes a module and delegates nested cleanup to ModuleService.
        try {
            const { id } = req.params;
        
            if (!id) {
                res.status(400).json({
                success: false,
                message: 'Module id is required',
                } as ApiResponse);
                return;
            }
    
            const module = await moduleService.deleteModule(id);
            if (!module) {
                res.status(404).json({
                success: false,
                message: 'Module not found',
                } as ApiResponse);
                return;
            }
    
            res.status(200).json({
                success: true,
                message: 'Module deleted successfully',
                data: module,
            } as ApiResponse);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to delete module',
                error: error instanceof Error ? error.message : String(error),
            } as ApiResponse);
        }
    }
}

export const moduleController = new ModuleController();
