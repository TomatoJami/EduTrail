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
  const body = (await request.json()) as AuthRequestBody;
  const { action } = body;

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
}