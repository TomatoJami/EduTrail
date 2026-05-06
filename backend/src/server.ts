import 'express-async-errors';
import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Import routes
import userRoutes from './routes/userRoutes';
import courseRoutes from './routes/courseRoutes';
import subjectRoutes from './routes/subjectRoutes';
import uploadRoutes from './routes/uploadRoutes';
import moduleRoutes from './routes/moduleRoutes';
import chapterRoutes from './routes/chapterRoutes';
import questionRoutes from './routes/questionRoutes';
import userCourseRoutes from './routes/userCourseRoutes';
import userChapterRoutes from './routes/userChapterRoutes';
import userQuestionRoutes from './routes/userQuestionRoutes';

// Import middleware
import { loggingMiddleware, errorHandler } from './middleware/authMiddleware';

// Import Swagger
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

// Import database
import connectDB from './config/database';

const app: Express = express();
const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

// Middleware
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(loggingMiddleware);

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/auth', userRoutes);
app.use('/api/users', userRoutes);
app.use('/api/user-courses', userCourseRoutes);
app.use('/api/user-chapters', userChapterRoutes);
app.use('/api/user-questions', userQuestionRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/chapters', chapterRoutes);
app.use('/api/questions', questionRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handler
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Connect to database
    await connectDB();

    app.listen(PORT, () => {
      console.log(`
╔═════════════════════════════════════════════╗
║        EduTrail Backend Server              ║
║              Server running on              ║
║           http://localhost:${PORT}             ║
║     CORS Origin: ${CORS_ORIGIN}      ║
╚═════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
