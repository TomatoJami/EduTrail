import express from 'express';
import { userChapterController } from '../controllers/userChapterController';

const router = express.Router();

/**
 * @swagger
 * /user-chapters/{userId}/chapters/{chapterId}:
 *   get:
 *     tags:
 *       - User Progress
 *     summary: Get user chapter progress
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: chapterId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User chapter progress
 */
router.get('/:userId/chapters/:chapterId', (req, res) => userChapterController.getUserChapter(req, res));

/**
 * @swagger
 * /user-chapters/{userId}/chapters:
 *   get:
 *     tags:
 *       - User Progress
 *     summary: Get all user chapters with progress
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of user chapters with progress
 */
router.get('/:userId/chapters', (req, res) => userChapterController.getUserChapters(req, res));

/**
 * @swagger
 * /user-chapters/{userId}/modules/{moduleId}/chapters:
 *   get:
 *     tags:
 *       - User Progress
 *     summary: Get module chapters for user
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
 *         description: List of module chapters with user progress
 */
router.get('/:userId/modules/:moduleId/chapters', (req, res) => userChapterController.getUserChaptersByModule(req, res));

/**
 * @swagger
 * /user-chapters/{userId}/chapters:
 *   post:
 *     tags:
 *       - User Progress
 *     summary: Create or update chapter progress
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
 *               chapterId:
 *                 type: string
 *               progress:
 *                 type: number
 *     responses:
 *       201:
 *         description: Progress created/updated
 */
router.post('/:userId/chapters', (req, res) => userChapterController.createOrUpdateUserChapter(req, res));

/**
 * @swagger
 * /user-chapters/{userId}/chapters/{chapterId}/complete:
 *   put:
 *     tags:
 *       - User Progress
 *     summary: Mark chapter as completed/incomplete
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: chapterId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Status updated
 */
router.put('/:userId/chapters/:chapterId/complete', (req, res) => userChapterController.markChapterCompleted(req, res));

/**
 * @swagger
 * /user-chapters/{userId}/chapters/{chapterId}:
 *   delete:
 *     tags:
 *       - User Progress
 *     summary: Delete chapter progress
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: chapterId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Progress deleted
 */
router.delete('/:userId/chapters/:chapterId', (req, res) => userChapterController.deleteUserChapter(req, res));

export default router;
