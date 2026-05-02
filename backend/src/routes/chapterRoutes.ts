import { Router } from 'express';
import { chapterController } from '../controllers/chapterController';
import { adminMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Public routes
router.get('/', (req, res) => chapterController.getAllChapters(req, res));
router.get('/:id', (req, res) => chapterController.getChapterById(req, res));

// Protected routes (admin only)
router.post('/', adminMiddleware, (req, res) => chapterController.createChapter(req, res));
router.put('/:id', adminMiddleware, (req, res) => chapterController.updateChapter(req, res));
router.delete('/:id', adminMiddleware, (req, res) => chapterController.deleteChapter(req, res));

export default router;
