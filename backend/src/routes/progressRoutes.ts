import { Router } from 'express';
import { progressController } from '../controllers/progressController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Every progress endpoint requires an authenticated learner.
router.use(authMiddleware);

// ============ CourseProgress Routes ============

/**
 * @swagger
 * /progress/courses:
 *   get:
 *     tags:
 *       - Progress
 *     summary: Get all courses by user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user courses with progress
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CourseProgress'
 *       400:
 *         description: User ID is required
 */
// GET /progress/courses lists progress records for the authenticated user.
router.get('/courses', (req, res) => progressController.getCoursesByUser(req, res));

/**
 * @swagger
 * /progress/courses/{courseId}:
 *   get:
 *     tags:
 *       - Progress
 *     summary: Get course progress by course ID and user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Course progress
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/CourseProgress'
 *       404:
 *         description: Course progress not found
 */
// GET /progress/courses/:courseId returns calculated course progress.
router.get('/courses/:courseId', (req, res) =>
  progressController.getCourseProgress(req, res)
);

/**
 * @swagger
 * /progress/courses/{courseId}/bookmark:
 *   post:
 *     tags:
 *       - Progress
 *     summary: Add/remove course from bookmarks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       201:
 *         description: Course bookmarked/unbookmarked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/CourseProgress'
 */
// POST /progress/courses/:courseId/bookmark toggles the bookmark flag.
router.post('/courses/:courseId/bookmark', (req, res) =>
  progressController.bookmarkCourse(req, res)
);

/**
 * @swagger
 * /progress/courses/{courseId}/start:
 *   post:
 *     tags:
 *       - Progress
 *     summary: Start course learning
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       201:
 *         description: Course started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/CourseProgress'
 */
// POST /progress/courses/:courseId/start starts or resumes a course.
router.post('/courses/:courseId/start', (req, res) =>
  progressController.startCourse(req, res)
);

/**
 * @swagger
 * /progress/courses/{courseId}/status:
 *   put:
 *     tags:
 *       - Progress
 *     summary: Update course status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [in_progress, completed]
 *                 description: Course status
 *             required:
 *               - status
 *     responses:
 *       200:
 *         description: Course status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/CourseProgress'
 *       404:
 *         description: Course progress not found
 */
// PUT /progress/courses/:courseId/status updates course completion status.
router.put('/courses/:courseId/status', (req, res) =>
  progressController.updateCourseStatus(req, res)
);



// ============ ChapterProgress Routes ============

/**
 * @swagger
 * /progress/chapters/{chapterId}:
 *   get:
 *     tags:
 *       - Progress
 *     summary: Get chapter progress
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chapterId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chapter ID
 *     responses:
 *       200:
 *         description: Chapter progress
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/ChapterProgress'
 *       404:
 *         description: Chapter progress not found
 */
// GET /progress/chapters/:chapterId returns one chapter progress record.
router.get('/chapters/:chapterId', (req, res) =>
  progressController.getChapterProgress(req, res)
);

/**
 * @swagger
 * /progress/chapters/{chapterId}:
 *   put:
 *     tags:
 *       - Progress
 *     summary: Update chapter completion status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chapterId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chapter ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               is_completed:
 *                 type: boolean
 *                 description: Chapter completion status
 *             required:
 *               - is_completed
 *     responses:
 *       200:
 *         description: Chapter progress updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/ChapterProgress'
 */
// PUT /progress/chapters/:chapterId upserts chapter completion.
router.put('/chapters/:chapterId', (req, res) =>
  progressController.updateChapterProgress(req, res)
);

// ============ QuestionProgress Routes ============

/**
 * @swagger
 * /progress/questions/{questionId}:
 *   get:
 *     tags:
 *       - Progress
 *     summary: Get question progress
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Question ID
 *     responses:
 *       200:
 *         description: Question progress
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/QuestionProgress'
 *       404:
 *         description: Question progress not found
 */
// GET /progress/questions/:questionId returns one question progress record.
router.get('/questions/:questionId', (req, res) =>
  progressController.getQuestionProgress(req, res)
);

/**
 * @swagger
 * /progress/questions/{questionId}:
 *   put:
 *     tags:
 *       - Progress
 *     summary: Update question progress (mark as completed)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Question ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               is_completed:
 *                 type: boolean
 *                 description: Question completion status
 *             required:
 *               - is_completed
 *           examples:
 *             completed:
 *               value:
 *                 is_completed: true
 *             not_completed:
 *               value:
 *                 is_completed: false
 *     responses:
 *       200:
 *         description: Question progress updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/QuestionProgress'
 */
// PUT /progress/questions/:questionId upserts question completion.
router.put('/questions/:questionId', (req, res) =>
  progressController.updateQuestionStatus(req, res)
);

/**
 * @swagger
 * /progress/modules/{moduleId}/questions:
 *   get:
 *     tags:
 *       - Progress
 *     summary: Get all question statuses for a module
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
 *         description: Module ID
 *     responses:
 *       200:
 *         description: Module question statuses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/QuestionProgress'
 */
// GET /progress/modules/:moduleId/questions returns all question statuses in a module.
router.get('/modules/:moduleId/questions', (req, res) =>
  progressController.getModuleQuestionStatuses(req, res)
);

export default router;
