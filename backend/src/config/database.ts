import mongoose from 'mongoose';

/** Chooses the MongoDB connection string for the backend. */
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/edutrail';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

/** Keeps the cached logic isolated and reusable. */
const cached = (global as any).mongoose || { conn: null, promise: null };

/** Keeps the connect db logic isolated and reusable. */
async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongoose) => {
        return mongoose;
      })
      .catch((error) => {
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

export default connectDB;
