import { Router } from 'express';
import { questionController } from '../controllers/questionController';
import { adminMiddleware } from '../middleware/authMiddleware';

const router = Router();

/**
 * @swagger
 * /questions:
 *   get:
 *     tags:
 *       - Questions
 *     summary: Get all questions
 *     responses:
 *       200:
 *         description: List of all questions
 */
router.get('/', (req, res) => questionController.getAllQuestions(req, res));

/**
 * @swagger
 * /questions/{id}:
 *   get:
 *     tags:
 *       - Questions
 *     summary: Get question by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Question data
 *       404:
 *         description: Question not found
 */
router.get('/:id', (req, res) => questionController.getQuestionById(req, res));

/**
 * @swagger
 * /questions:
 *   post:
 *     tags:
 *       - Questions
 *     summary: Create new question (Admin only)
 *     security:
 *       - userId: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               question:
 *                 type: string
 *               correctAnswer:
 *                 type: integer
 *               module_id:
 *                 type: string
 *               options:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Question created
 */
router.post('/', adminMiddleware, (req, res) => questionController.createQuestion(req, res));

/**
 * @swagger
 * /questions/{id}:
 *   put:
 *     tags:
 *       - Questions
 *     summary: Update question (Admin only)
 *     security:
 *       - userId: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Question updated
 */
router.put('/:id', adminMiddleware, (req, res) => questionController.updateQuestion(req, res));

/**
 * @swagger
 * /questions/{id}:
 *   delete:
 *     tags:
 *       - Questions
 *     summary: Delete question (Admin only)
 *     security:
 *       - userId: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Question deleted
 */
router.delete('/:id', adminMiddleware, (req, res) => questionController.deleteQuestion(req, res));

/**
 * @swagger
 * /questions/user/{userId}/modules/{moduleId}/questions:
 *   get:
 *     tags:
 *       - Questions
 *     summary: Get user questions progress for a module
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User questions progress
 */
router.get('/user/:userId/modules/:moduleId/questions', (req, res) => questionController.getUserQuestionsProgress(req, res));

export default router;
