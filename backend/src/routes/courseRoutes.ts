import { Router } from 'express';
import { courseController } from '../controllers/courseController';
import { adminMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Public routes
router.get('/', (req, res) => courseController.getAllCourses(req, res));
router.get('/:id', (req, res) => courseController.getCourse(req, res));

// Protected routes (admin only)
router.post('/', adminMiddleware, (req, res) => courseController.createCourse(req, res));
router.put('/:id', adminMiddleware, (req, res) => courseController.updateCourse(req, res));
router.delete('/:id', adminMiddleware, (req, res) => courseController.deleteCourse(req, res));

export default router;
