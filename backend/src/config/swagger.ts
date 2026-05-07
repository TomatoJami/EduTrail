import swaggerJsdoc from 'swagger-jsdoc';

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
        userId: {
          type: 'apiKey',
          in: 'header',
          name: 'x-user-id',
          description: 'User ID header for authenticated requests',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            name: { type: 'string' },
            role: { type: 'string', enum: ['student', 'admin'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Course: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Module: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            courseId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
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
            status: {
              type: 'string',
              enum: ['not_attempted', 'correct', 'incorrect'],
              description: 'Question answer status',
            },
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
