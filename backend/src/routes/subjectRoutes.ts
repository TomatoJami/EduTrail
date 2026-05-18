import { Router } from 'express';
import { subjectController } from '../controllers/subjectController';
import { adminMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Public read routes expose subjects; mutating routes below require adminMiddleware.
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
// GET /subjects returns all subjects for filters and onboarding.
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
// GET /subjects/:id returns one subject by id.
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
// POST /subjects creates a subject and is limited to admins.
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
// PUT /subjects/:id updates a subject and is limited to admins.
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
// DELETE /subjects/:id removes a subject and is limited to admins.
router.delete('/:id', adminMiddleware, (req, res) => subjectController.deleteSubject(req, res));

export default router;
