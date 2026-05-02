import { Router } from 'express';
import { questionController } from '../controllers/questionController';
import { adminMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Public routes
router.get('/', (req, res) => questionController.getAllQuestions(req, res));
router.get('/:id', (req, res) => questionController.getQuestionById(req, res));

// Protected routes (admin only)
router.post('/', adminMiddleware, (req, res) => questionController.createQuestion(req, res));
router.put('/:id', adminMiddleware, (req, res) => questionController.updateQuestion(req, res));
router.delete('/:id', adminMiddleware, (req, res) => questionController.deleteQuestion(req, res));

export default router;
