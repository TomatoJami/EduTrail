import { Router } from 'express';
import { subjectController } from '../controllers/subjectController';
import { adminMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Public routes
router.get('/', (req, res) => subjectController.getAllSubjects(req, res));
router.get('/:id', (req, res) => subjectController.getSubjectById(req, res));

// Protected routes (admin only)
router.post('/', adminMiddleware, (req, res) => subjectController.createSubject(req, res));
router.put('/:id', adminMiddleware, (req, res) => subjectController.updateSubject(req, res));
router.delete('/:id', adminMiddleware, (req, res) => subjectController.deleteSubject(req, res));

export default router;
