import express from 'express';
import { userCourseController } from '../controllers/userCourseController';

const router = express.Router();

/**
 * @swagger
 * /user-courses/{userId}/courses/{courseId}:
 *   get:
 *     tags:
 *       - User Progress
 *     summary: Get user course progress
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User course progress
 */
router.get('/:userId/courses/:courseId', (req, res) => userCourseController.getUserCourse(req, res));

/**
 * @swagger
 * /user-courses/{userId}/courses:
 *   get:
 *     tags:
 *       - User Progress
 *     summary: Get all user courses with progress
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of user courses with progress
 */
router.get('/:userId/courses', (req, res) => userCourseController.getUserCourses(req, res));

/**
 * @swagger
 * /user-courses/{userId}/courses:
 *   post:
 *     tags:
 *       - User Progress
 *     summary: Create or update course progress
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
 *               courseId:
 *                 type: string
 *               progress:
 *                 type: number
 *     responses:
 *       201:
 *         description: Progress created/updated
 */
router.post('/:userId/courses', (req, res) => userCourseController.createOrUpdateUserCourse(req, res));

/**
 * @swagger
 * /user-courses/{userId}/courses/{courseId}/complete:
 *   put:
 *     tags:
 *       - User Progress
 *     summary: Mark course as completed/incomplete
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Status updated
 */
router.put('/:userId/courses/:courseId/complete', (req, res) => userCourseController.markCourseCompleted(req, res));

/**
 * @swagger
 * /user-courses/{userId}/courses/{courseId}/save:
 *   put:
 *     tags:
 *       - User Progress
 *     summary: Save/remove course from saved
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Save status updated
 */
router.put('/:userId/courses/:courseId/save', (req, res) => userCourseController.saveCourse(req, res));

/**
 * @swagger
 * /user-courses/{userId}/courses/{courseId}:
 *   delete:
 *     tags:
 *       - User Progress
 *     summary: Delete course progress
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Progress deleted
 */
router.delete('/:userId/courses/:courseId', (req, res) => userCourseController.deleteUserCourse(req, res));

export default router;
