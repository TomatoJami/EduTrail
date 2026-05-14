import { Router } from 'express';
import { subjectController } from '../controllers/subjectController';
import { adminMiddleware } from '../middleware/authMiddleware';

const router = Router();

/**
 * @swagger
 * /subjects:
 *   get:
 *     tags:
 *       - Subjects
 *     summary: Get all subjects
 *     responses:
 *       200:
 *         description: List of all subjects
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
 *                         $ref: '#/components/schemas/Subject'
 */
router.get('/', (req, res) => subjectController.getAllSubjects(req, res));

/**
 * @swagger
 * /subjects/{id}:
 *   get:
 *     tags:
 *       - Subjects
 *     summary: Get subject by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Subject data
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Subject'
 *       404:
 *         description: Subject not found
 */
router.get('/:id', (req, res) => subjectController.getSubjectById(req, res));

/**
 * @swagger
 * /subjects:
 *   post:
 *     tags:
 *       - Subjects
 *     summary: Create new subject (Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SubjectInput'
 *     responses:
 *       201:
 *         description: Subject created
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Subject'
 */
router.post('/', adminMiddleware, (req, res) => subjectController.createSubject(req, res));

/**
 * @swagger
 * /subjects/{id}:
 *   put:
 *     tags:
 *       - Subjects
 *     summary: Update subject (Admin only)
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
 *             $ref: '#/components/schemas/SubjectUpdateInput'
 *     responses:
 *       200:
 *         description: Subject updated
 */
router.put('/:id', adminMiddleware, (req, res) => subjectController.updateSubject(req, res));

/**
 * @swagger
 * /subjects/{id}:
 *   delete:
 *     tags:
 *       - Subjects
 *     summary: Delete subject (Admin only)
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
 *         description: Subject deleted
 */
router.delete('/:id', adminMiddleware, (req, res) => subjectController.deleteSubject(req, res));

export default router;
