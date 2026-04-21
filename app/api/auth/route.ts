import { NextRequest, NextResponse } from 'next/server';
import { userController } from '@/controllers/userController';

export async function POST(request: NextRequest) {
  const { action } = await request.json();

  switch (action) {
    case 'signup':
      return userController.signup(request);
    case 'login':
      return userController.login(request);
    default:
      return NextResponse.json(
        { success: false, message: 'Invalid action' },
        { status: 400 }
      );
  }
}
