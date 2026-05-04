import express from 'express';
import { userQuestionController } from '../controllers/userQuestionController';

const router = express.Router();

// Get specific user question progress
router.get('/:userId/questions/:questionId', (req, res) => userQuestionController.getUserQuestion(req, res));

// Get all questions for a user
router.get('/:userId/questions', (req, res) => userQuestionController.getUserQuestions(req, res));

// Get questions in a module for a user
router.get('/:userId/modules/:moduleId/questions', (req, res) => userQuestionController.getUserQuestionsByModule(req, res));

// Create or update user question progress
router.post('/:userId/questions', (req, res) => userQuestionController.createOrUpdateUserQuestion(req, res));

// Mark question as completed/incomplete
router.put('/:userId/questions/:questionId/complete', (req, res) => userQuestionController.markQuestionCompleted(req, res));

// Delete user question progress
router.delete('/:userId/questions/:questionId', (req, res) => userQuestionController.deleteUserQuestion(req, res));

export default router;
