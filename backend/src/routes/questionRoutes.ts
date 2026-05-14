import { Router } from 'express';
import { questionController } from '../controllers/questionController';
import { adminMiddleware } from '../middleware/authMiddleware';

const router = Router();

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
router.get('/', (req, res) => questionController.getAllQuestions(req, res));

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
router.get('/user/:userId/modules/:moduleId/questions', (req, res) => questionController.getUserQuestionsProgress(req, res));

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
router.get('/:id', (req, res) => questionController.getQuestionById(req, res));

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
  const body = { ...req.body, type: 'test' };
  questionController.createQuestion({ ...req, body } as any, res);
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
  const body = { ...req.body, type: 'short-answer' };
  questionController.createQuestion({ ...req, body } as any, res);
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
  const body = { ...req.body, type: 'fill-blank' };
  questionController.createQuestion({ ...req, body } as any, res);
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
router.delete('/:id', adminMiddleware, (req, res) => questionController.deleteQuestion(req, res));

export default router;
