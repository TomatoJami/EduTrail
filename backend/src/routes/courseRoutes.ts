import { Router } from 'express';
import { courseController } from '../controllers/courseController';
import { adminMiddleware } from '../middleware/authMiddleware';

const router = Router();

/**
 * @swagger
 * /courses:
 *   get:
 *     tags:
 *       - Courses
 *     summary: Get all courses
 *     responses:
 *       200:
 *         description: List of all courses
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
 *                         $ref: '#/components/schemas/Course'
 */
router.get('/', (req, res) => courseController.getAllCourses(req, res));

/**
 * @swagger
 * /courses/{id}:
 *   get:
 *     tags:
 *       - Courses
 *     summary: Get course by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course data
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Course'
 *       404:
 *         description: Course not found
 */
router.get('/:id', (req, res) => courseController.getCourseById(req, res));

/**
 * @swagger
 * /courses:
 *   post:
 *     tags:
 *       - Courses
 *     summary: Create new course (Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CourseInput'
 *     responses:
 *       201:
 *         description: Course created
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Course'
 *       403:
 *         description: Insufficient permissions
 */
router.post('/', adminMiddleware, (req, res) => courseController.createCourse(req, res));

/**
 * @swagger
 * /courses/{id}:
 *   put:
 *     tags:
 *       - Courses
 *     summary: Update course (Admin only)
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
 *             $ref: '#/components/schemas/CourseUpdateInput'
 *     responses:
 *       200:
 *         description: Course updated
 *       404:
 *         description: Course not found
 *       403:
 *         description: Insufficient permissions
 */
router.put('/:id', adminMiddleware, (req, res) => courseController.updateCourse(req, res));

/**
 * @swagger
 * /courses/{id}:
 *   delete:
 *     tags:
 *       - Courses
 *     summary: Delete course (Admin only)
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
 *         description: Course deleted
 *       404:
 *         description: Course not found
 *       403:
 *         description: Недостаточно прав
 */
router.delete('/:id', adminMiddleware, (req, res) => courseController.deleteCourse(req, res));

export default router;
