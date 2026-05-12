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
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: ["test", "short-answer", "fill-blank"]
 *         description: Optional. Filter questions by type
 *     responses:
 *       200:
 *         description: List of all questions or filtered questions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
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
 *                       status:
 *                         type: string
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
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 type:
 *                   type: string
 *                   enum: ["test", "short-answer", "fill-blank"]
 *                 typeId:
 *                   type: object
 *                   description: Type-specific question data
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
 *       - userId: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - type: object
 *                 title: Test Question
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: ["test"]
 *                   module_id:
 *                     type: string
 *                   question:
 *                     type: string
 *                   options:
 *                     type: array
 *                     items:
 *                       type: string
 *                     minItems: 2
 *                   correctAnswer:
 *                     type: integer
 *                   explanation:
 *                     type: string
 *                 required: ["type", "module_id", "question", "options", "correctAnswer"]
 *               - type: object
 *                 title: Short Answer Question
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: ["short-answer"]
 *                   module_id:
 *                     type: string
 *                   question:
 *                     type: string
 *                   correctAnswers:
 *                     type: array
 *                     items:
 *                       type: string
 *                     minItems: 1
 *                   caseSensitive:
 *                     type: boolean
 *                   explanation:
 *                     type: string
 *                 required: ["type", "module_id", "question", "correctAnswers"]
 *               - type: object
 *                 title: Fill in the Blank Question
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: ["fill-blank"]
 *                   module_id:
 *                     type: string
 *                   questionText:
 *                     type: string
 *                   blanks:
 *                     type: array
 *                     minItems: 1
 *                     items:
 *                       type: object
 *                       properties:
 *                         blankId:
 *                           type: string
 *                         correctAnswers:
 *                           type: array
 *                           items:
 *                             type: string
 *                         caseSensitive:
 *                           type: boolean
 *                   explanation:
 *                     type: string
 *                 required: ["type", "module_id", "questionText", "blanks"]
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
 *       - userId: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               module_id:
 *                 type: string
 *               question:
 *                 type: string
 *               options:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 2
 *               correctAnswer:
 *                 type: integer
 *               explanation:
 *                 type: string
 *             required: ["module_id", "question", "options", "correctAnswer"]
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
 *       - userId: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               module_id:
 *                 type: string
 *               question:
 *                 type: string
 *               correctAnswers:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 1
 *               caseSensitive:
 *                 type: boolean
 *               explanation:
 *                 type: string
 *             required: ["module_id", "question", "correctAnswers"]
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
 *       - userId: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               module_id:
 *                 type: string
 *               questionText:
 *                 type: string
 *               blanks:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   properties:
 *                     blankId:
 *                       type: string
 *                     correctAnswers:
 *                       type: array
 *                       items:
 *                         type: string
 *                     caseSensitive:
 *                       type: boolean
 *               explanation:
 *                 type: string
 *             required: ["module_id", "questionText", "blanks"]
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
 *   delete:
 *     tags:
 *       - Questions
 *     summary: Delete question (Admin only)
 *     description: Deletes both the wrapper Question and the type-specific question document
 *     security:
 *       - userId: []
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
