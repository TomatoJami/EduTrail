import { NextResponse } from 'next/server';
import { userController } from '@/controllers/userController';
import { AuthPayload, SignupPayload } from '@/types';

type AuthAction = 'signup' | 'login';

interface AuthRequestBody {
  action?: AuthAction;
  email?: string;
  password?: string;
  name?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AuthRequestBody;
    const { action } = body;
    console.log('Auth POST received, action:', action);

    switch (action) {
    case 'signup': {
      if (!body.email || !body.password || !body.name) {
        return NextResponse.json(
          { success: false, message: 'Missing required fields' },
          { status: 400 }
        );
      }

      const signupPayload: SignupPayload = {
        email: body.email,
        password: body.password,
        name: body.name,
      };

      return userController.signup(signupPayload);
    }
    case 'login': {
      if (!body.email || !body.password) {
        return NextResponse.json(
          { success: false, message: 'Email and password are required' },
          { status: 400 }
        );
      }

      const loginPayload: AuthPayload = {
        email: body.email,
        password: body.password,
      };

      return userController.login(loginPayload);
    }
    default:
      return NextResponse.json(
        { success: false, message: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Auth route error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: errorMessage },
      { status: 500 }
    );
  }
}