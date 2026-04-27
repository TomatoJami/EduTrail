import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

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
    const { action, email, password, name } = body;
    console.log('Auth POST received, action:', action);

    switch (action) {
      case 'signup': {
        if (!email || !password || !name) {
          return NextResponse.json(
            { success: false, message: 'Missing required fields' },
            { status: 400 }
          );
        }

        const response = await fetch(`${API_URL}/auth/signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password, name }),
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
      }

      case 'login': {
        if (!email || !password) {
          return NextResponse.json(
            { success: false, message: 'Email and password are required' },
            { status: 400 }
          );
        }

        const response = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
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