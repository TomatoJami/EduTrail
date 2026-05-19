import { Router } from "express";
import { feedbackController } from "../controllers/feedbackController";
import { adminMiddleware } from "../middleware/authMiddleware";

/** Collects this module route handlers before they are mounted in Express. */
const router = Router();

// Learners can submit feedback; adminMiddleware protects feedback review routes.
/**
 * @swagger
 * /feedback:
 *   post:
 *     tags:
 *       - Feedback
 *     summary: Create feedback
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - feedbackType
 *               - data
 *               - user_id
 *             properties:
 *               feedbackType:
 *                 type: string
 *                 enum: [Error, Wish]
 *               data:
 *                 type: string
 *               user_id:
 *                 type: string
 *     responses:
 *       201:
 *         description: Feedback created successfully
 */
// POST /feedback stores learner feedback.
router.post("/", (req, res) =>
  feedbackController.createFeedback(req, res)
);

/**
 * @swagger
 * /feedback:
 *   get:
 *     tags:
 *       - Feedback
 *     summary: Get all feedback (Admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of feedback
 */
// GET /feedback lists all feedback and is limited to admins.
router.get("/", adminMiddleware, (req, res) =>
  feedbackController.getAllFeedback(req, res)
);

/**
 * @swagger
 * /feedback/{id}:
 *   get:
 *     tags:
 *       - Feedback
 *     summary: Get feedback by ID (Admin only)
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
 *         description: Feedback data
 *       404:
 *         description: Feedback not found
 */
// GET /feedback/:id returns one feedback item and is limited to admins.
router.get("/:id", adminMiddleware, (req, res) =>
  feedbackController.getFeedbackById(req, res)
);

/**
 * @swagger
 * /feedback/type/{feedbackType}:
 *   get:
 *     tags:
 *       - Feedback
 *     summary: Get feedback by type (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: feedbackType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [Error, Wish]
 *     responses:
 *       200:
 *         description: List of feedback by type
 */
// GET /feedback/type/:feedbackType filters feedback and is limited to admins.
router.get("/type/:feedbackType", adminMiddleware, (req, res) =>
  feedbackController.getFeedbackByType(req, res)
);

export default router;
