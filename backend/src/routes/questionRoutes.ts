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
 *               chapterId:
 *                 type: string
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

export default router;
