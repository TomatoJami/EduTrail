import express from 'express';
import { userChapterController } from '../controllers/userChapterController';

const router = express.Router();

// Get specific user chapter progress
router.get('/:userId/chapters/:chapterId', (req, res) => userChapterController.getUserChapter(req, res));

// Get all chapters for a user
router.get('/:userId/chapters', (req, res) => userChapterController.getUserChapters(req, res));

// Get chapters in a module for a user
router.get('/:userId/modules/:moduleId/chapters', (req, res) => userChapterController.getUserChaptersByModule(req, res));

// Create or update user chapter progress
router.post('/:userId/chapters', (req, res) => userChapterController.createOrUpdateUserChapter(req, res));

// Mark chapter as completed/incomplete
router.put('/:userId/chapters/:chapterId/complete', (req, res) => userChapterController.markChapterCompleted(req, res));

// Delete user chapter progress
router.delete('/:userId/chapters/:chapterId', (req, res) => userChapterController.deleteUserChapter(req, res));

export default router;
