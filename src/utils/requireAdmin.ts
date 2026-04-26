import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/config/database';
import { User } from '@/models/User';

type AdminCheckResult =
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse };

export const requireAdmin = async (request: NextRequest): Promise<AdminCheckResult> => {
  const userId = request.headers.get('x-user-id');

  if (!userId || !mongoose.isValidObjectId(userId)) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, message: 'Unauthorized: invalid user id' },
        { status: 401 }
      ),
    };
  }

  await connectDB();
  const user = await User.findById(userId).select('role');

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, message: 'Unauthorized: user not found' },
        { status: 401 }
      ),
    };
  }

  if (user.role !== 'admin') {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, message: 'Forbidden: admin access required' },
        { status: 403 }
      ),
    };
  }

  return { ok: true, userId };
};
