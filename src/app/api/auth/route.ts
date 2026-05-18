import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

type AuthAction = 'signup' | 'login' | 'update' | 'forgot-password' | 'reset-password' | 'logout';

interface AuthRequestBody {
  action?: AuthAction;
  email?: string;
  password?: string;
  name?: string;
  userId?: string;
  newPassword?: string;
  token?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AuthRequestBody;
    const { action, email, password, name, token, newPassword } = body;

    switch (action) {
      case 'logout': {
        const response = NextResponse.json({ success: true, message: 'Logged out' });
        response.cookies.delete('authToken');
        response.cookies.delete('authExpiresAt');
        return response;
      }

      case 'signup': {
        if (!email || !password || !name) {
          return NextResponse.json(
            { success: false, message: 'Missing required fields' },
            { status: 400 }
          );
        }

        // Forward signup to the backend and store the returned token in cookies.
        const response = await fetch(`${API_URL}/auth/signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password, name }),
        });

        const data = await response.json();
        const nextResponse = NextResponse.json(
          data?.data?.token ? { ...data, data: { ...data.data, token: undefined } } : data,
          { status: response.status }
        );
        if (data?.data?.token && data?.data?.expiresAt) {
          const maxAge = Math.max(0, Math.floor((Date.parse(data.data.expiresAt) - Date.now()) / 1000));
          nextResponse.cookies.set('authToken', data.data.token, {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge,
          });
          nextResponse.cookies.set('authExpiresAt', data.data.expiresAt, {
            httpOnly: false,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge,
          });
        }
        return nextResponse;
      }

      case 'login': {
        if (!email || !password) {
          return NextResponse.json(
            { success: false, message: 'Email and password are required' },
            { status: 400 }
          );
        }

        // Forward login to the backend; the browser receives user data without the raw token.
        const response = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        const nextResponse = NextResponse.json(
          data?.data?.token ? { ...data, data: { ...data.data, token: undefined } } : data,
          { status: response.status }
        );
        if (data?.data?.token && data?.data?.expiresAt) {
          const maxAge = Math.max(0, Math.floor((Date.parse(data.data.expiresAt) - Date.now()) / 1000));
          nextResponse.cookies.set('authToken', data.data.token, {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge,
          });
          nextResponse.cookies.set('authExpiresAt', data.data.expiresAt, {
            httpOnly: false,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge,
          });
        }
        return nextResponse;
      }

      case 'update': {
        const { userId, name: updatedName, email: updatedEmail, newPassword } = body;

        if (!userId) {
          return NextResponse.json(
            { success: false, message: 'User ID is required' },
            { status: 400 }
          );
        }

        const updateData: any = {};
        if (updatedName) updateData.name = updatedName;
        if (updatedEmail) updateData.email = updatedEmail;
        if (newPassword) updateData.password = newPassword;

        // Forward profile updates to the backend user endpoint.
        const response = await fetch(`${API_URL}/users/${userId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
      }

      case 'forgot-password': {
        if (!email) {
          return NextResponse.json(
            { success: false, message: 'Email is required' },
            { status: 400 }
          );
        }

        // Ask the backend to generate and email a password reset token.
        const response = await fetch(`${API_URL}/auth/forgot-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();

        return NextResponse.json(data, { status: response.status });
      }

      case 'reset-password': {
        if (!token || !newPassword) {
          return NextResponse.json(
            { success: false, message: 'Token and newPassword are required' },
            { status: 400 }
          );
        }

        // Submit the reset token and replacement password to the backend.
        const response = await fetch(`${API_URL}/auth/reset-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token, newPassword }),
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
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (error instanceof TypeError && error.message === 'fetch failed') {
      return NextResponse.json(
        {
          success: false,
          message: 'Backend API is unavailable. Make sure the backend server is running on http://localhost:5000.',
          error: errorMessage,
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Internal server error', error: errorMessage },
      { status: 500 }
    );
  }
}
