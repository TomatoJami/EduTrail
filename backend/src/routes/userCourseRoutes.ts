import express from 'express';
import { userCourseController } from '../controllers/userCourseController';

const router = express.Router();

// Get specific user course progress
router.get('/:userId/courses/:courseId', (req, res) => userCourseController.getUserCourse(req, res));

// Get all courses for a user
router.get('/:userId/courses', (req, res) => userCourseController.getUserCourses(req, res));

// Create or update user course progress
router.post('/:userId/courses', (req, res) => userCourseController.createOrUpdateUserCourse(req, res));

// Mark course as completed/incomplete
router.put('/:userId/courses/:courseId/complete', (req, res) => userCourseController.markCourseCompleted(req, res));

// Save/unsave course
router.put('/:userId/courses/:courseId/save', (req, res) => userCourseController.saveCourse(req, res));

// Delete user course progress
router.delete('/:userId/courses/:courseId', (req, res) => userCourseController.deleteUserCourse(req, res));

export default router;
