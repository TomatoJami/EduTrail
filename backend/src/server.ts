import 'express-async-errors';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import dns from 'dns';
import app from './app';

// Use public resolvers so MongoDB SRV lookups work even if the local DNS resolver fails.
dns.setServers(['1.1.1.1', '1.0.0.1', '8.8.8.8', '8.8.4.4']);

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
