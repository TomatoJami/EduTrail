import 'express-async-errors';
import express, { Express } from 'express';
import cors from 'cors';

// Import routes
import userRoutes from './routes/userRoutes';
import courseRoutes from './routes/courseRoutes';
import subjectRoutes from './routes/subjectRoutes';
import uploadRoutes from './routes/uploadRoutes';
import moduleRoutes from './routes/moduleRoutes';
import chapterRoutes from './routes/chapterRoutes';
import questionRoutes from './routes/questionRoutes';
import progressRoutes from './routes/progressRoutes';
import feedbackRoutes from './routes/feedbackRoutes';

// Import middleware
import { loggingMiddleware, errorHandler } from './middleware/authMiddleware';

// Import Swagger
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

const app: Express = express();
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
if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_API_DOCS === 'true') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

// Routes
app.use('/api/auth', userRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/chapters', chapterRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/feedback', feedbackRoutes);

// User progress endpoints
app.use('/api/user-chapters', chapterRoutes);
app.use('/api/user-questions', questionRoutes);

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

export default app;
