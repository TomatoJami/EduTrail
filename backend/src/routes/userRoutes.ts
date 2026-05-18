import { Router } from 'express';
import { userController } from '../controllers/userController';
import { adminMiddleware, authMiddleware } from '../middleware/authMiddleware';
import { authRateLimiter, passwordResetRateLimiter } from '../middleware/rateLimitMiddleware';

const router = Router();

// Auth routes are rate-limited; profile/admin routes below are protected per handler.
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
 *             $ref: '#/components/schemas/SignupRequest'
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
 *                 data:
 *                   $ref: '#/components/schemas/AuthUser'
 *       400:
 *         description: Validation error
 */
// POST /auth/signup creates a new learner account behind the auth rate limiter.
router.post('/signup', authRateLimiter, (req, res) => userController.signup(req, res));

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
 *             $ref: '#/components/schemas/LoginRequest'
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
 *                 data:
 *                   $ref: '#/components/schemas/AuthUser'
 *       401:
 *         description: Invalid credentials
 */
// POST /auth/login checks credentials behind the auth rate limiter.
router.post('/login', authRateLimiter, (req, res) => userController.login(req, res));

/**
 * @swagger
 * /forgot-password:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Send password reset email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordRequest'
 *     responses:
 *       200:
 *         description: If the email exists, a reset email was sent
 */
// POST /auth/forgot-password starts a password reset flow.
router.post('/forgot-password', passwordResetRateLimiter, (req, res) => userController.forgotPassword(req, res));

/**
 * @swagger
 * /reset-password:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Reset password using token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordRequest'
 *     responses:
 *       200:
 *         description: Password reset successfully
 */
// POST /auth/reset-password completes a password reset flow.
router.post('/reset-password', passwordResetRateLimiter, (req, res) => userController.resetPassword(req, res));

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get user by ID
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
 *         description: User data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: Пользователь не найден
 */
// GET /users/:id returns a profile for the owner or an admin.
router.get('/:id', authMiddleware, (req, res) => userController.getUser(req, res));

/**
 * @swagger
 * /users:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get all users
 *     security:
 *       - bearerAuth: []
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
// GET /users lists all users and is limited to admins.
router.get('/', adminMiddleware, (req, res) => userController.getAllUsers(req, res));

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     tags:
 *       - Users
 *     summary: Update user
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
 *             $ref: '#/components/schemas/UserUpdateInput'
 *     responses:
 *       200:
 *         description: User updated
 *       404:
 *         description: Пользователь не найден
 */
// PUT /users/:id updates a profile for the owner or an admin.
router.put('/:id', authMiddleware, (req, res) => userController.updateUser(req, res));

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     tags:
 *       - Users
 *     summary: Delete a user
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
 *         description: User deleted successfully
 *       404:
 *         description: Пользователь не найден
 */
// DELETE /users/:id removes an account and is limited to admins.
router.delete('/:id', adminMiddleware, (req, res) => userController.deleteUser(req, res));

// Wishlist routes
/**
 * @swagger
 * /users/{id}/wishlist/add:
 *   post:
 *     tags:
 *       - Wishlist
 *     summary: Add subject to wishlist
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
 *             $ref: '#/components/schemas/WishlistInput'
 *     responses:
 *       200:
 *         description: Subject added to wishlist
 */
// POST /users/:id/wishlist/add adds one subject to the user's wishlist.
router.post('/:id/wishlist/add', authMiddleware, (req, res) => userController.addToWishlist(req, res));

/**
 * @swagger
 * /users/{id}/wishlist/remove:
 *   post:
 *     tags:
 *       - Wishlist
 *     summary: Remove subject from wishlist
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
 *             $ref: '#/components/schemas/WishlistInput'
 *     responses:
 *       200:
 *         description: Subject removed from wishlist
 */
// POST /users/:id/wishlist/remove removes one subject from the user's wishlist.
router.post('/:id/wishlist/remove', authMiddleware, (req, res) => userController.removeFromWishlist(req, res));

/**
 * @swagger
 * /users/{id}/wishlist:
 *   get:
 *     tags:
 *       - Wishlist
 *     summary: Get wishlist
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
 *         description: Список избранных курсов
 */
// GET /users/:id/wishlist returns the user's wishlist subjects.
router.get('/:id/wishlist', authMiddleware, (req, res) => userController.getWishlist(req, res));

// Preferences routes
/**
 * @swagger
 * /users/{id}/preferences:
 *   post:
 *     tags:
 *       - Preferences
 *     summary: Save user preferences
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
 *             $ref: '#/components/schemas/PreferencesInput'
 *     responses:
 *       200:
 *         description: Preferences saved
 */
// POST /users/:id/preferences saves onboarding preferences.
router.post('/:id/preferences', authMiddleware, (req, res) => userController.savePreferences(req, res));

/**
 * @swagger
 * /users/{id}/preferences/skip:
 *   post:
 *     tags:
 *       - Preferences
 *     summary: Skip preferences setup
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
 *         description: Setup skipped
 */
// POST /users/:id/preferences/skip marks onboarding as skipped.
router.post('/:id/preferences/skip', authMiddleware, (req, res) => userController.skipPreferences(req, res));

export default router;
