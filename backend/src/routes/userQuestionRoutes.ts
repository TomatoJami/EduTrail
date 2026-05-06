import express from 'express';
import { userQuestionController } from '../controllers/userQuestionController';

const router = express.Router();

/**
 * @swagger
 * /user-questions/{userId}/questions/{questionId}:
 *   get:
 *     tags:
 *       - User Progress
 *     summary: Get user answer to question
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User answer to question
 */
router.get('/:userId/questions/:questionId', (req, res) => userQuestionController.getUserQuestion(req, res));

/**
 * @swagger
 * /user-questions/{userId}/questions:
 *   get:
 *     tags:
 *       - User Progress
 *     summary: Get all user question answers
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of user answers
 */
router.get('/:userId/questions', (req, res) => userQuestionController.getUserQuestions(req, res));

/**
 * @swagger
 * /user-questions/{userId}/modules/{moduleId}/questions:
 *   get:
 *     tags:
 *       - User Progress
 *     summary: Get module questions for user
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
 *         description: List of module questions with user answers
 */
router.get('/:userId/modules/:moduleId/questions', (req, res) => userQuestionController.getUserQuestionsByModule(req, res));

/**
 * @swagger
 * /user-questions/{userId}/questions:
 *   post:
 *     tags:
 *       - User Progress
 *     summary: Create or update answer to question
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               questionId:
 *                 type: string
 *               answer:
 *                 type: string
 *     responses:
 *       201:
 *         description: Answer created/updated
 */
router.post('/:userId/questions', (req, res) => userQuestionController.createOrUpdateUserQuestion(req, res));

/**
 * @swagger
 * /user-questions/{userId}/questions/{questionId}/complete:
 *   put:
 *     tags:
 *       - User Progress
 *     summary: Mark question as completed/incomplete
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Status updated
 */
router.put('/:userId/questions/:questionId/complete', (req, res) => userQuestionController.markQuestionCompleted(req, res));

/**
 * @swagger
 * /user-questions/{userId}/questions/{questionId}:
 *   delete:
 *     tags:
 *       - User Progress
 *     summary: Delete question answer
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Answer deleted
 */
router.delete('/:userId/questions/:questionId', (req, res) => userQuestionController.deleteUserQuestion(req, res));

export default router;
