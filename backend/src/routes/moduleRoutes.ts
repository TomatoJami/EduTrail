import { Router } from 'express';
import { moduleController } from '../controllers/moduleController';
import { adminMiddleware } from '../middleware/authMiddleware';

const router = Router();

/**
 * @swagger
 * /modules:
 *   get:
 *     tags:
 *       - Modules
 *     summary: Get all modules
 *     responses:
 *       200:
 *         description: List of all modules
 */
router.get('/', (req, res) => moduleController.getAllModules(req, res));

/**
 * @swagger
 * /modules/{id}:
 *   get:
 *     tags:
 *       - Modules
 *     summary: Get module by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Module data
 *       404:
 *         description: Module not found
 */
router.get('/:id', (req, res) => moduleController.getModuleById(req, res));

/**
 * @swagger
 * /modules:
 *   post:
 *     tags:
 *       - Modules
 *     summary: Create new module (Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               courseId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Module created
 */
router.post('/', adminMiddleware, (req, res) => moduleController.createModule(req, res));

/**
 * @swagger
 * /modules/{id}:
 *   put:
 *     tags:
 *       - Modules
 *     summary: Update module (Admin only)
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
 *         description: Module updated
 */
router.put('/:id', adminMiddleware, (req, res) => moduleController.updateModule(req, res));

/**
 * @swagger
 * /modules/{id}:
 *   delete:
 *     tags:
 *       - Modules
 *     summary: Delete module (Admin only)
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
 *         description: Module deleted
 */
router.delete('/:id', adminMiddleware, (req, res) => moduleController.deleteModule(req, res));

export default router;
