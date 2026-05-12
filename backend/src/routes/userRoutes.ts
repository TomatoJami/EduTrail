import { Router } from 'express';
import { userController } from '../controllers/userController';

const router = Router();

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Register a new user
 *     description: Creates a new user account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: securepassword123
 *               name:
 *                 type: string
 *                 example: John Doe
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 */
router.post('/signup', (req, res) => userController.signup(req, res));

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: User login
 *     description: Authenticate user by email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: securepassword123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', (req, res) => userController.login(req, res));

/**
 * @swagger
 * /forgot-password:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Send password reset email
 *     requestBody:
 *       required: true
 *     responses:
 *       200:
 *         description: If the email exists, a reset email was sent
 */
router.post('/forgot-password', (req, res) => userController.forgotPassword(req, res));

/**
 * @swagger
 * /reset-password:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Reset password using token
 *     requestBody:
 *       required: true
 *     responses:
 *       200:
 *         description: Password reset successfully
 */
router.post('/reset-password', (req, res) => userController.resetPassword(req, res));

// Public routes
/**
 * @swagger
 * /{id}:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get user by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: Пользователь не найден
 */
router.get('/:id', (req, res) => userController.getUser(req, res));

/**
 * @swagger
 * /:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get all users
 *     responses:
 *       200:
 *         description: List of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
router.get('/', (req, res) => userController.getAllUsers(req, res));

/**
 * @swagger
 * /{id}:
 *   put:
 *     tags:
 *       - Users
 *     summary: Update user
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
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated
 *       404:
 *         description: Пользователь не найден
 */
router.put('/:id', (req, res) => userController.updateUser(req, res));

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     tags:
 *       - User
 *     summary: Delete a user
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: Пользователь не найден
 */
router.delete('/:id', (req, res) => userController.deleteUser(req, res));

// Wishlist routes
/**
 * @swagger
 * /{id}/wishlist/add:
 *   post:
 *     tags:
 *       - Wishlist
 *     summary: Add course to wishlist
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
 *             type: object
 *             properties:
 *               courseId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Course added to wishlist
 */
router.post('/:id/wishlist/add', (req, res) => userController.addToWishlist(req, res));

/**
 * @swagger
 * /{id}/wishlist/remove:
 *   post:
 *     tags:
 *       - Wishlist
 *     summary: Remove course from wishlist
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
 *             type: object
 *             properties:
 *               courseId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Course removed from wishlist
 */
router.post('/:id/wishlist/remove', (req, res) => userController.removeFromWishlist(req, res));

/**
 * @swagger
 * /{id}/wishlist:
 *   get:
 *     tags:
 *       - Wishlist
 *     summary: Get wishlist
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Список избранных курсов
 */
router.get('/:id/wishlist', (req, res) => userController.getWishlist(req, res));

// Preferences routes
/**
 * @swagger
 * /{id}/preferences:
 *   post:
 *     tags:
 *       - Preferences
 *     summary: Save user preferences
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
 *             type: object
 *             properties:
 *               preferences:
 *                 type: object
 *     responses:
 *       200:
 *         description: Preferences saved
 */
router.post('/:id/preferences', (req, res) => userController.savePreferences(req, res));

/**
 * @swagger
 * /{id}/preferences/skip:
 *   post:
 *     tags:
 *       - Preferences
 *     summary: Skip preferences setup
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Setup skipped
 */
router.post('/:id/preferences/skip', (req, res) => userController.skipPreferences(req, res));

export default router;
