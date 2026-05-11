import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { questionService, QuestionPayload } from '../services/questionService';
import { Question } from '../models/Question';
import { QuestionProgress } from '../models/QuestionProgress';
import { ApiResponse } from '../types';

export class QuestionController {
    async getAllQuestions(req: Request, res: Response): Promise<void> {
        try {
            const { module_id } = req.query;
            
            let questions;
            if (module_id && typeof module_id === 'string') {
                questions = await questionService.getQuestionsByModuleId(module_id);
            } else {
                questions = await questionService.getAllQuestions();
            }
            
            res.status(200).json({
                success: true,
                message: 'Questions fetched successfully',
                data: questions,
            } as ApiResponse);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch questions',
                error: error instanceof Error ? error.message : String(error),
            } as ApiResponse);
        }
    }

    async getQuestionById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const question = await questionService.getQuestionById(id);
            if (!question) {
                res.status(404).json({
                    success: false,
                    message: 'Question not found',
                } as ApiResponse);
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Question fetched successfully',
                data: question,
            } as ApiResponse);
        } catch (error) {
            console.error('Error fetching question:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch question',
                error: error instanceof Error ? error.message : String(error),
            } as ApiResponse);
        }
    }

    async createQuestion(req: Request, res: Response): Promise<void> {
        try {
            const body = req.body as {
                question: string;
                options: string[];
                correctAnswer: number;
                explanation?: string;
                module_id?: string;
            };
    
            if (!body.question || !body.options ||  body.correctAnswer === undefined! || !body.module_id) {
                res.status(400).json({
                    success: false,
                    message: 'question, options, correctAnswer, and module_id are required',
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
    
            const payload: QuestionPayload = {
                question: body.question.trim(),
                options: body.options,
                correctAnswer: body.correctAnswer,
                explanation: body.explanation?.trim(),
                module_id: body.module_id?.trim()
            };
    
            const question = await questionService.createQuestion(payload);
                res.status(201).json({
                    success: true,
                    message: 'Question created successfully',
                    data: question,
                } as ApiResponse);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to create question',
                error: error instanceof Error ? error.message : String(error),
            } as ApiResponse);
        }
    }

    async updateQuestion(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const body = req.body as {
                question?: string;
                options?: string[];
                correctAnswer?: number;
                explanation?: string;
                module_id?: string;
            };
    
            if (!id) {
                res.status(400).json({
                success: false,
                message: 'question id is required',
                } as ApiResponse);
                return;
            }
        
            const payload: Partial<QuestionPayload> = {
                question: body.question?.trim(),
                options: body.options,
                correctAnswer: body.correctAnswer,
                explanation: body.explanation?.trim(),
                module_id: body.module_id?.trim(),
            };
        
            const question = await questionService.updateQuestion(id, payload);
            if (!question) {
                res.status(404).json({
                    success: false,
                    message: 'Question not found',
                } as ApiResponse);
                return;
            }
        
            res.status(200).json({
                success: true,
                message: 'Question updated successfully',
                data: question,
            } as ApiResponse);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to update question',
                error: error instanceof Error ? error.message : String(error),
            } as ApiResponse);
        }
    }

    async deleteQuestion(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
        
            if (!id) {
                res.status(400).json({
                success: false,
                message: 'Question id is required',
                } as ApiResponse);
                return;
            }
    
            const question = await questionService.deleteQuestion(id);
            if (!question) {
                res.status(404).json({
                success: false,
                message: 'Question not found',
                } as ApiResponse);
                return;
            }
    
            res.status(200).json({
                success: true,
                message: 'Question deleted successfully',
                data: question,
            } as ApiResponse);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to delete question',
                error: error instanceof Error ? error.message : String(error),
            } as ApiResponse);
        }
    }

    async getUserQuestionsProgress(req: Request, res: Response): Promise<void> {
        try {
            const { userId, moduleId } = req.params;

            console.log(`[getUserQuestionsProgress] START - userId: ${userId}, moduleId: ${moduleId}`);

            if (!userId || !moduleId) {
                res.status(400).json({
                    success: false,
                    message: 'userId and moduleId are required',
                } as ApiResponse);
                return;
            }

            // Convert to ObjectId
            const userObjectId = new mongoose.Types.ObjectId(userId);
            const moduleObjectId = new mongoose.Types.ObjectId(moduleId);

            // Get all questions for this module
            const questions = await Question.find({ module_id: moduleObjectId });
            console.log(`[getUserQuestionsProgress] Found questions: ${questions.length}`);

            const questionIds = questions.map(q => q._id);

            // Get progress for all these questions
            const progress = await QuestionProgress.find({
                user_id: userObjectId,
                question_id: { $in: questionIds },
            });

            console.log(`[getUserQuestionsProgress] Found progress records: ${progress.length}`, progress.map(p => ({ question_id: String(p.question_id), status: p.status })));

            // Convert ObjectIds to strings for JSON response
            const progressWithStringIds = progress.map(p => ({
              _id: p._id.toString(),
              user_id: p.user_id.toString(),
              question_id: p.question_id.toString(),
              status: p.status,
            }));

            res.status(200).json({
                success: true,
                message: 'User questions progress fetched successfully',
                data: progressWithStringIds,
            } as ApiResponse);
        } catch (error) {
            console.error(`[getUserQuestionsProgress] ERROR:`, error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch user questions progress',
                error: error instanceof Error ? error.message : String(error),
            } as ApiResponse);
        }
    }
}

export const questionController = new QuestionController();