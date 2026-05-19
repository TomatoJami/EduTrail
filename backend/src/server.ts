import 'express-async-errors';
import './config/env';
import app from './app';

// Import database
import connectDB from './config/database';
import { userService } from './services/userService';

/** Chooses the HTTP port for the backend server. */
const PORT = process.env.PORT || 5000;

// Start server
async function startServer() {
  try {
    // Connect to database
    await connectDB();

    await userService.ensureDefaultAdminUser();

    app.listen(PORT, () => {
      console.info(`EduTrail backend is running on http://localhost:${PORT}`);
    });
  } catch {
    process.exit(1);
  }
}

void startServer();

export default app;
