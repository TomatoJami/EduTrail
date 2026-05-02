import { Router } from 'express';
import { moduleController } from '../controllers/moduleController';
import { adminMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Public routes
router.get('/', (req, res) => moduleController.getAllModules(req, res));
router.get('/:id', (req, res) => moduleController.getModuleById(req, res));

// Protected routes (admin only)
router.post('/', adminMiddleware, (req, res) => moduleController.createModule(req, res));
router.put('/:id', adminMiddleware, (req, res) => moduleController.updateModule(req, res));
router.delete('/:id', adminMiddleware, (req, res) => moduleController.deleteModule(req, res));

export default router;
