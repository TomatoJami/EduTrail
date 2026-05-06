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
 *       - userId: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Subject created
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
 *       - userId: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *       - userId: []
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
