import { NextRequest, NextResponse } from 'next/server';
import { userService } from '@/services/userService';
import { SignupPayload, AuthPayload, ApiResponse } from '@/types';
import connectDB from '@/config/database';

export class UserController {
  async signup(request: NextRequest): Promise<NextResponse> {
    try {
      await connectDB();

      const body: SignupPayload = await request.json();

      // Validate input
      if (!body.email || !body.password || !body.name) {
        return NextResponse.json(
          { success: false, message: 'Missing required fields' },
          { status: 400 }
        );
      }

      // Check if user exists
      const existingUser = await userService.getUserByEmail(body.email);
      if (existingUser) {
        return NextResponse.json(
          { success: false, message: 'User already exists' },
          { status: 409 }
        );
      }

      // Create user
      const user = await userService.createUser(body);

      return NextResponse.json(
        {
          success: true,
          message: 'User created successfully',
          data: { id: user._id, email: user.email, name: user.name, role: user.role },
        },
        { status: 201 }
      );
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Internal server error', error: String(error) },
        { status: 500 }
      );
    }
  }

  async login(request: NextRequest): Promise<NextResponse> {
    try {
      await connectDB();

      const body: AuthPayload = await request.json();

      if (!body.email || !body.password) {
        return NextResponse.json(
          { success: false, message: 'Email and password are required' },
          { status: 400 }
        );
      }

      const user = await userService.getUserByEmail(body.email);
      if (!user) {
        return NextResponse.json(
          { success: false, message: 'Invalid credentials' },
          { status: 401 }
        );
      }

      // TODO: Implement password verification

      return NextResponse.json(
        {
          success: true,
          message: 'Login successful',
          data: { id: user._id, email: user.email, name: user.name, role: user.role },
        },
        { status: 200 }
      );
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Internal server error', error: String(error) },
        { status: 500 }
      );
    }
  }

  async getUser(request: NextRequest, id: string): Promise<NextResponse> {
    try {
      await connectDB();

      const user = await userService.getUserById(id);
      if (!user) {
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: 'User fetched successfully',
          data: user,
        },
        { status: 200 }
      );
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Internal server error', error: String(error) },
        { status: 500 }
      );
    }
  }
}

export const userController = new UserController();
