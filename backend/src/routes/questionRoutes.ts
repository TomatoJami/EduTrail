import { Router } from 'express';
import { questionController } from '../controllers/questionController';
import { adminMiddleware, authMiddleware, optionalAuthMiddleware } from '../middleware/authMiddleware';

/** Collects this module route handlers before they are mounted in Express. */
const router = Router();

// Question routes expose reads publicly and protect writes/progress with auth middleware.
/**
 * @swagger
 * /questions:
 *   get:
 *     tags:
 *       - Questions
 *     summary: Get all questions or filter by module
 *     parameters:
 *       - in: query
 *         name: module_id
 *         schema:
 *           type: string
 *         description: Optional. Filter questions by module ID
 *     responses:
 *       200:
 *         description: List of all questions or filtered questions
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
 *                         $ref: '#/components/schemas/Question'
 */
// GET /questions optionally filters questions by module_id query.
router.get('/', optionalAuthMiddleware, (req, res) => questionController.getAllQuestions(req, res));

/**
 * @swagger
 * /questions/user/{userId}/modules/{moduleId}/questions:
 *   get:
 *     tags:
 *       - Questions
 *       - Progress
 *     summary: Get user questions progress for a module
 *     description: Retrieves all questions in a module and their completion status for a specific user
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
 *         description: Module ID
 *     responses:
 *       200:
 *         description: User questions progress
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
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       user_id:
 *                         type: string
 *                       question_id:
 *                         type: string
 *                       is_completed:
 *                         type: boolean
 *       400:
 *         description: Missing userId or moduleId
 *       500:
 *         description: Failed to fetch user questions progress
 */
// GET /questions/user/:userId/modules/:moduleId/questions returns learner question progress.
router.get('/user/:userId/modules/:moduleId/questions', authMiddleware, (req, res) => questionController.getUserQuestionsProgress(req, res));

/**
 * @swagger
 * /questions/grade:
 *   post:
 *     tags:
 *       - Questions
 *     summary: Grade submitted quiz answers
 *     description: Authenticated learner endpoint that returns grading results after submission; public question reads do not expose answer keys.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/QuizGradeInput'
 *     responses:
 *       200:
 *         description: Quiz graded successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/QuizGradeResult'
 *       400:
 *         description: Invalid answer payload
 *       401:
 *         description: Unauthorized
 */
// POST /questions/grade grades learner answers without exposing keys in public reads.
router.post('/grade', authMiddleware, (req, res) => questionController.gradeQuiz(req, res));

/**
 * @swagger
 * /questions/{id}:
 *   get:
 *     tags:
 *       - Questions
 *     summary: Get question by ID with type-specific data
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Question ID
 *     responses:
 *       200:
 *         description: Question data with type-specific fields
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Question'
 *       404:
 *         description: Question not found
 */
// GET /questions/:id returns one normalized question by id.
router.get('/:id', optionalAuthMiddleware, (req, res) => questionController.getQuestionById(req, res));

/**
 * @swagger
 * /questions:
 *   post:
 *     tags:
 *       - Questions
 *     summary: Create new question (Admin only) - Universal endpoint
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UniversalQuestionInput'
 *     responses:
 *       201:
 *         description: Question created successfully
 *       400:
 *         description: Invalid question type or missing required fields
 *       500:
 *         description: Failed to create question
 */
// POST /questions creates any supported question type and is limited to admins.
router.post('/', adminMiddleware, (req, res) => questionController.createQuestion(req, res));

/**
 * @swagger
 * /questions/test:
 *   post:
 *     tags:
 *       - Questions
 *     summary: Create test (multiple choice) question (Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TestQuestionInput'
 *     responses:
 *       201:
 *         description: Test question created successfully
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Failed to create question
 */
router.post('/test', adminMiddleware, (req, res) => {
  // POST /questions/test forces the legacy multiple-choice type before creating.
  const body = { ...req.body, type: 'test' };
  void questionController.createQuestion({ ...req, body } as any, res);
});

/**
 * @swagger
 * /questions/short-answer:
 *   post:
 *     tags:
 *       - Questions
 *     summary: Create short answer question (Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ShortAnswerQuestionInput'
 *     responses:
 *       201:
 *         description: Short answer question created successfully
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Failed to create question
 */
router.post('/short-answer', adminMiddleware, (req, res) => {
  // POST /questions/short-answer forces the legacy short-answer type before creating.
  const body = { ...req.body, type: 'short-answer' };
  void questionController.createQuestion({ ...req, body } as any, res);
});

/**
 * @swagger
 * /questions/fill-blank:
 *   post:
 *     tags:
 *       - Questions
 *     summary: Create fill in the blank question (Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FillBlankQuestionInput'
 *     responses:
 *       201:
 *         description: Fill in the blank question created successfully
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Failed to create question
 */
router.post('/fill-blank', adminMiddleware, (req, res) => {
  // POST /questions/fill-blank forces the legacy fill-blank type before creating.
  const body = { ...req.body, type: 'fill-blank' };
  void questionController.createQuestion({ ...req, body } as any, res);
});

/**
 * @swagger
 * /questions/{id}:
 *   put:
 *     tags:
 *       - Questions
 *     summary: Update question by ID (Admin only)
 *     description: The accepted fields depend on the existing question type.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Question wrapper ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/QuestionUpdateInput'
 *     responses:
 *       200:
 *         description: Question updated successfully
 *       404:
 *         description: Question not found
 *       500:
 *         description: Failed to update question
 */
// PUT /questions/:id updates a question and is limited to admins.
router.put('/:id', adminMiddleware, (req, res) => questionController.updateQuestion(req, res));

/**
 * @swagger
 * /questions/{id}:
 *   delete:
 *     tags:
 *       - Questions
 *     summary: Delete question (Admin only)
 *     description: Deletes both the wrapper Question and the type-specific question document
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Question ID to delete
 *     responses:
 *       200:
 *         description: Question deleted successfully
 *       400:
 *         description: Question id is required
 *       500:
 *         description: Failed to delete question
 */
// DELETE /questions/:id removes a question and is limited to admins.
router.delete('/:id', adminMiddleware, (req, res) => questionController.deleteQuestion(req, res));

export default router;
