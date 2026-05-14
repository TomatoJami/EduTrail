import { Router } from 'express';
import { chapterController } from '../controllers/chapterController';
import { adminMiddleware } from '../middleware/authMiddleware';

const router = Router();

/**
 * @swagger
 * /chapters:
 *   get:
 *     tags:
 *       - Chapters
 *     summary: Get all chapters
 *     responses:
 *       200:
 *         description: List of all chapters
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Chapter'
 */
router.get('/', (req, res) => chapterController.getAllChapters(req, res));

/**
 * @swagger
 * /chapters/{id}:
 *   get:
 *     tags:
 *       - Chapters
 *     summary: Get chapter by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chapter data
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Chapter'
 *       404:
 *         description: Chapter not found
 */
router.get('/:id', (req, res) => chapterController.getChapterById(req, res));

/**
 * @swagger
 * /chapters:
 *   post:
 *     tags:
 *       - Chapters
 *     summary: Create new chapter (Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChapterInput'
 *     responses:
 *       201:
 *         description: Chapter created
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Chapter'
 */
router.post('/', adminMiddleware, (req, res) => chapterController.createChapter(req, res));

/**
 * @swagger
 * /chapters/{id}:
 *   put:
 *     tags:
 *       - Chapters
 *     summary: Update chapter (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChapterUpdateInput'
 *     responses:
 *       200:
 *         description: Chapter updated
 */
router.put('/:id', adminMiddleware, (req, res) => chapterController.updateChapter(req, res));

/**
 * @swagger
 * /chapters/{id}:
 *   delete:
 *     tags:
 *       - Chapters
 *     summary: Delete chapter (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chapter deleted
 */
router.delete('/:id', adminMiddleware, (req, res) => chapterController.deleteChapter(req, res));

/**
 * @swagger
 * /chapters/user/{userId}/modules/{moduleId}/chapters:
 *   get:
 *     tags:
 *       - Chapters
 *     summary: Get user chapters progress for a module
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
 *         description: User chapters progress
 */
router.get('/user/:userId/modules/:moduleId/chapters', (req, res) => chapterController.getUserChaptersProgress(req, res));

export default router;
