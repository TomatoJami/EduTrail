import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { questionService, CreateTestQuestionPayload, CreateShortAnswerPayload, CreateFillBlankPayload } from '../services/questionService';
import { ApiResponse } from '../types';
import { Question } from '../models/Question';
import { QuestionProgress } from '../models/QuestionProgress';

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
                type: string;
                module_id: string;
                question?: string;
                question_img?: string;
                options?: string[];
                correctAnswer?: number;
                correctAnswers?: string[];
                questionText?: string;
                blanks?: any[];
                explanation?: string;
                caseSensitive?: boolean;
            };

            const { type, module_id } = body;

            if (!type || !module_id) {
                res.status(400).json({
                    success: false,
                    message: 'type and module_id are required',
                } as ApiResponse);
                return;
            }

            if (!mongoose.isValidObjectId(module_id)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid module_id',
                } as ApiResponse);
                return;
            }

            let question;

            if (type === 'test') {
                if (!body.question || !body.options || body.correctAnswer === undefined) {
                    res.status(400).json({
                        success: false,
                        message: 'For test questions: question, options, and correctAnswer are required',
                    } as ApiResponse);
                    return;
                }

                const payload: CreateTestQuestionPayload = {
                    question: body.question.trim(),
                    question_img: body.question_img?.trim() || '',
                    options: body.options,
                    correctAnswer: body.correctAnswer,
                    explanation: body.explanation?.trim(),
                    module_id: module_id.trim(),
                };

                question = await questionService.createTestQuestion(payload);
            } else if (type === 'short-answer') {
                if (!body.question || !body.correctAnswers || body.correctAnswers.length === 0) {
                    res.status(400).json({
                        success: false,
                        message: 'For short-answer questions: question and correctAnswers are required',
                    } as ApiResponse);
                    return;
                }

                const payload: CreateShortAnswerPayload = {
                    question: body.question.trim(),
                    question_img: body.question_img?.trim() || '',
                    correctAnswers: body.correctAnswers,
                    explanation: body.explanation?.trim(),
                    caseSensitive: body.caseSensitive || false,
                    module_id: module_id.trim(),
                };

                question = await questionService.createShortAnswerQuestion(payload);
            } else if (type === 'fill-blank') {
                if (!body.questionText || !body.blanks || body.blanks.length === 0) {
                    res.status(400).json({
                        success: false,
                        message: 'For fill-blank questions: questionText and blanks are required',
                    } as ApiResponse);
                    return;
                }

                const payload: CreateFillBlankPayload = {
                    questionText: body.questionText.trim(),
                    question_img: body.question_img?.trim() || '',
                    blanks: body.blanks,
                    explanation: body.explanation?.trim(),
                    module_id: module_id.trim(),
                };

                question = await questionService.createFillBlankQuestion(payload);
            } else {
                res.status(400).json({
                    success: false,
                    message: 'Invalid question type. Must be: test, short-answer, or fill-blank',
                } as ApiResponse);
                return;
            }

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

            await questionService.deleteQuestion(id);

            res.status(200).json({
                success: true,
                message: 'Question deleted successfully',
            } as ApiResponse);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to delete question',
                error: error instanceof Error ? error.message : String(error),
            } as ApiResponse);
        }
    }

    async updateQuestion(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            if (!id) {
                res.status(400).json({
                    success: false,
                    message: 'Question id is required',
                } as ApiResponse);
                return;
            }

            const question = await Question.findById(id);

            if (!question) {
                res.status(404).json({
                    success: false,
                    message: 'Question not found',
                } as ApiResponse);
                return;
            }

            let updatedQuestion;

            if (question.type === 'test') {
                updatedQuestion = await questionService.updateTestQuestion(String(question.typeId), req.body);
            } else if (question.type === 'short-answer') {
                updatedQuestion = await questionService.updateShortAnswerQuestion(String(question.typeId), req.body);
            } else if (question.type === 'fill-blank') {
                updatedQuestion = await questionService.updateFillBlankQuestion(String(question.typeId), req.body);
            }

            if (!updatedQuestion) {
                res.status(404).json({
                    success: false,
                    message: 'Question not found',
                } as ApiResponse);
                return;
            }

            res.status(200).json({
                success: true,
                message: 'Question updated successfully',
                data: {
                    ...(updatedQuestion.toObject ? updatedQuestion.toObject() : updatedQuestion),
                    _id: question._id.toString(),
                    type: question.type,
                },
            } as ApiResponse);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to update question',
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
