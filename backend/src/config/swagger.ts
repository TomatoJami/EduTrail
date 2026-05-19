import swaggerJsdoc from 'swagger-jsdoc';

/** Keeps the options logic isolated and reusable. */
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'EduTrail API',
      version: '1.0.0',
      description: 'API for EduTrail online learning platform',
      contact: {
        name: 'EduTrail Support',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Development server',
      },
      {
        url: 'https://api.edutrail.com/api',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Paste the JWT from POST /auth/login. Swagger will send it as Authorization: Bearer <token>.',
        },
      },
      // Defines the MongoDB schema for schemas.
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { description: 'Endpoint-specific response payload' },
            error: { type: 'string' },
          },
        },
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            id: { type: 'string' },
            email: { type: 'string' },
            name: { type: 'string' },
            role: { type: 'string', enum: ['student', 'admin'] },
            ageGroup: { type: 'string', enum: ['1-3', '4-9', '10-12'] },
            preferredSubjects: {
              type: 'array',
              items: { type: 'string' },
            },
            hasCompletedOnboarding: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        AuthUser: {
          allOf: [
            { $ref: '#/components/schemas/User' },
            {
              type: 'object',
              properties: {
                token: { type: 'string', description: 'JWT token for Authorization: Bearer <token>' },
                expiresAt: { type: 'string', format: 'date-time' },
              },
            },
          ],
        },
        SignupRequest: {
          type: 'object',
          required: ['email', 'password', 'name'],
          properties: {
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            password: {
              type: 'string',
              minLength: 8,
              example: 'Password1!',
              description: 'At least 8 chars, 1 uppercase letter, 1 letter, 1 number, and 1 special character',
            },
            name: { type: 'string', example: 'John Doe' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            password: { type: 'string', example: 'Password1!' },
          },
        },
        UserUpdateInput: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            password: { type: 'string', example: 'Password1!' },
            role: { type: 'string', enum: ['student', 'admin'], description: 'Admins only' },
          },
        },
        WishlistInput: {
          type: 'object',
          required: ['subjectId'],
          properties: {
            subjectId: { type: 'string', example: '665f1c2a9a83d28e2df08a10' },
          },
        },
        PreferencesInput: {
          type: 'object',
          required: ['preferredSubjects', 'ageGroup'],
          properties: {
            preferredSubjects: {
              type: 'array',
              items: { type: 'string' },
              example: ['665f1c2a9a83d28e2df08a10'],
            },
            ageGroup: { type: 'string', enum: ['1-3', '4-9', '10-12'], example: '10-12' },
          },
        },
        ForgotPasswordRequest: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', format: 'email', example: 'user@example.com' },
          },
        },
        ResetPasswordRequest: {
          type: 'object',
          required: ['token', 'newPassword'],
          properties: {
            token: { type: 'string' },
            newPassword: {
              type: 'string',
              minLength: 8,
              example: 'NewPassword1!',
              description: 'At least 8 chars, 1 uppercase letter, 1 letter, 1 number, and 1 special character',
            },
          },
        },
        Subject: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            subject_name: { type: 'string' },
            subject_img: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        SubjectInput: {
          type: 'object',
          required: ['subject_name', 'subject_img'],
          properties: {
            subject_name: { type: 'string', example: 'Biology' },
            subject_img: { type: 'string', example: 'https://example.com/biology.png' },
          },
        },
        SubjectUpdateInput: {
          type: 'object',
          properties: {
            subject_name: { type: 'string', example: 'Biology' },
            subject_img: { type: 'string', example: 'https://example.com/biology.png' },
          },
        },
        Course: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            goals: {
              type: 'array',
              items: { type: 'string' },
            },
            ageGroup: { type: 'string', enum: ['1-3', '4-9', '10-12'] },
            course_img: { type: 'string' },
            subject_id: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CourseInput: {
          type: 'object',
          required: ['title', 'description', 'ageGroup', 'course_img', 'subject_id'],
          properties: {
            title: { type: 'string', example: 'Biology Basics' },
            description: { type: 'string', example: 'A beginner-friendly biology course.' },
            goals: {
              type: 'array',
              items: { type: 'string' },
              example: ['Understand cells', 'Practice genetics questions'],
            },
            ageGroup: { type: 'string', enum: ['1-3', '4-9', '10-12'], example: '10-12' },
            course_img: { type: 'string', example: 'https://example.com/course.png' },
            subject_id: { type: 'string', example: '665f1c2a9a83d28e2df08a10' },
          },
        },
        CourseUpdateInput: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            goals: {
              type: 'array',
              items: { type: 'string' },
            },
            ageGroup: { type: 'string', enum: ['1-3', '4-9', '10-12'] },
            course_img: { type: 'string' },
            subject_id: { type: 'string' },
          },
        },
        Module: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string' },
            order: { type: 'number' },
            course_id: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        ModuleInput: {
          type: 'object',
          required: ['title', 'course_id'],
          properties: {
            title: { type: 'string', example: 'Cells and DNA' },
            order: { type: 'number', example: 1 },
            course_id: { type: 'string', example: '665f1c2a9a83d28e2df08a11' },
          },
        },
        ModuleUpdateInput: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            order: { type: 'number' },
            course_id: { type: 'string' },
          },
        },
        Chapter: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string' },
            content: { type: 'string' },
            order: { type: 'number' },
            module_id: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        ChapterInput: {
          type: 'object',
          required: ['title', 'content', 'module_id'],
          properties: {
            title: { type: 'string', example: 'What is a cell?' },
            content: { type: 'string', example: 'Cells are the basic structural units of living organisms.' },
            order: { type: 'number', example: 1 },
            module_id: { type: 'string', example: '665f1c2a9a83d28e2df08a12' },
          },
        },
        ChapterUpdateInput: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            content: { type: 'string' },
            order: { type: 'number' },
            module_id: { type: 'string' },
          },
        },
        Question: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            type: { type: 'string', enum: ['test', 'short-answer', 'fill-blank'] },
            typeId: { description: 'Type-specific question document' },
            module_id: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        TestQuestionInput: {
          type: 'object',
          required: ['module_id', 'question', 'options', 'correctAnswer'],
          properties: {
            module_id: { type: 'string', example: '665f1c2a9a83d28e2df08a12' },
            question: { type: 'string', example: 'Which organelle contains DNA?' },
            question_img: { type: 'string', example: 'https://example.com/question.png' },
            options: {
              type: 'array',
              minItems: 2,
              items: { type: 'string' },
              example: ['Nucleus', 'Ribosome', 'Cell wall', 'Vacuole'],
            },
            correctAnswer: { type: 'integer', example: 0 },
            explanation: { type: 'string', example: 'The nucleus stores most of the cell DNA.' },
          },
        },
        UniversalTestQuestionInput: {
          allOf: [
            {
              type: 'object',
              required: ['type'],
              properties: {
                type: { type: 'string', enum: ['test'], example: 'test' },
              },
            },
            { $ref: '#/components/schemas/TestQuestionInput' },
          ],
        },
        ShortAnswerQuestionInput: {
          type: 'object',
          required: ['module_id', 'question', 'correctAnswers'],
          properties: {
            module_id: { type: 'string', example: '665f1c2a9a83d28e2df08a12' },
            question: { type: 'string', example: 'What molecule carries genetic information?' },
            question_img: { type: 'string', example: '' },
            correctAnswers: {
              type: 'array',
              minItems: 1,
              items: { type: 'string' },
              example: ['DNA', 'deoxyribonucleic acid'],
            },
            caseSensitive: { type: 'boolean', example: false },
            explanation: { type: 'string', example: 'DNA stores hereditary information.' },
          },
        },
        UniversalShortAnswerQuestionInput: {
          allOf: [
            {
              type: 'object',
              required: ['type'],
              properties: {
                type: { type: 'string', enum: ['short-answer'], example: 'short-answer' },
              },
            },
            { $ref: '#/components/schemas/ShortAnswerQuestionInput' },
          ],
        },
        FillBlank: {
          type: 'object',
          required: ['blankId', 'correctAnswers'],
          properties: {
            blankId: { type: 'string', example: 'blank-1' },
            correctAnswers: {
              type: 'array',
              minItems: 1,
              items: { type: 'string' },
              example: ['nucleus'],
            },
            caseSensitive: { type: 'boolean', example: false },
          },
        },
        FillBlankQuestionInput: {
          type: 'object',
          required: ['module_id', 'questionText', 'blanks'],
          properties: {
            module_id: { type: 'string', example: '665f1c2a9a83d28e2df08a12' },
            questionText: { type: 'string', example: 'DNA is stored in the {{blank-1}}.' },
            question_img: { type: 'string', example: '' },
            blanks: {
              type: 'array',
              minItems: 1,
              items: { $ref: '#/components/schemas/FillBlank' },
            },
            explanation: { type: 'string', example: 'The nucleus contains DNA in eukaryotic cells.' },
          },
        },
        UniversalFillBlankQuestionInput: {
          allOf: [
            {
              type: 'object',
              required: ['type'],
              properties: {
                type: { type: 'string', enum: ['fill-blank'], example: 'fill-blank' },
              },
            },
            { $ref: '#/components/schemas/FillBlankQuestionInput' },
          ],
        },
        UniversalQuestionInput: {
          oneOf: [
            { $ref: '#/components/schemas/UniversalTestQuestionInput' },
            { $ref: '#/components/schemas/UniversalShortAnswerQuestionInput' },
            { $ref: '#/components/schemas/UniversalFillBlankQuestionInput' },
          ],
        },
        QuestionUpdateInput: {
          type: 'object',
          description: 'Send fields for the current question type. Test: question, question_img, options, correctAnswer, explanation. Short-answer: question, question_img, correctAnswers, caseSensitive, explanation. Fill-blank: questionText, question_img, blanks, explanation.',
          properties: {
            question: { type: 'string' },
            questionText: { type: 'string' },
            question_img: { type: 'string' },
            options: {
              type: 'array',
              items: { type: 'string' },
            },
            correctAnswer: { type: 'integer' },
            correctAnswers: {
              type: 'array',
              items: { type: 'string' },
            },
            blanks: {
              type: 'array',
              items: { $ref: '#/components/schemas/FillBlank' },
            },
            caseSensitive: { type: 'boolean' },
            explanation: { type: 'string' },
          },
        },
        CourseProgress: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'Document ID' },
            user_id: { type: 'string', description: 'User ID' },
            course_id: { type: 'string', description: 'Course ID' },
            status: {
              type: 'string',
              enum: ['in_progress', 'completed'],
              nullable: true,
              description: 'Course progress status (null if only bookmarked)',
            },
            is_bookmarked: {
              type: 'boolean',
              description: 'Whether course is bookmarked (independent flag)',
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        ChapterProgress: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'Document ID' },
            user_id: { type: 'string', description: 'User ID' },
            chapter_id: { type: 'string', description: 'Chapter ID' },
            is_completed: {
              type: 'boolean',
              description: 'Whether chapter is completed',
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        QuestionProgress: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'Document ID' },
            user_id: { type: 'string', description: 'User ID' },
            question_id: { type: 'string', description: 'Question ID' },
            is_completed: { type: 'boolean', description: 'Whether question is completed' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
