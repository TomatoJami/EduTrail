import { Router } from 'express';
import { moduleController } from '../controllers/moduleController';
import { adminMiddleware } from '../middleware/authMiddleware';

/** Collects this module route handlers before they are mounted in Express. */
const router = Router();

// Module routes are read publicly but require admin access for create/update/delete.
/**
 * @swagger
 * /modules:
 *   get:
 *     tags:
 *       - Modules
 *     summary: Get all modules
 *     parameters:
 *       - in: query
 *         name: course_id
 *         schema:
 *           type: string
 *         description: Optional. Filter modules by course ID
 *     responses:
 *       200:
 *         description: List of all modules
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
 *                         $ref: '#/components/schemas/Module'
 */
// GET /modules optionally filters modules by course_id query.
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
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Module'
 *       404:
 *         description: Module not found
 */
// GET /modules/:id returns one module by id.
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
 *             $ref: '#/components/schemas/ModuleInput'
 *     responses:
 *       201:
 *         description: Module created
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Module'
 */
// POST /modules creates a module and is limited to admins.
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ModuleUpdateInput'
 *     responses:
 *       200:
 *         description: Module updated
 */
// PUT /modules/:id updates a module and is limited to admins.
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
// DELETE /modules/:id removes a module and nested content.
router.delete('/:id', adminMiddleware, (req, res) => moduleController.deleteModule(req, res));

export default router;
