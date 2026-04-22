import { NextResponse } from 'next/server';
import { userService } from '@/services/userService';
import { SignupPayload, AuthPayload, ApiResponse } from '@/types';
import connectDB from '@/config/database';

export class UserController {
  async signup(body: SignupPayload): Promise<NextResponse> {
    try {
      await connectDB();

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
      console.error('Signup error:', error);
      
      const err = error as any;
      
      // Handle Mongoose validation errors
      if (err.name === 'ValidationError' && err.errors) {
        const messages = Object.values(err.errors)
          .map((e: any) => e.message)
          .join(', ');
        return NextResponse.json(
          { success: false, message: 'Validation error', details: messages },
          { status: 400 }
        );
      }

      // Handle duplicate key errors
      if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return NextResponse.json(
          { success: false, message: `${field} already exists` },
          { status: 409 }
        );
      }

      const errorMessage = error instanceof Error ? error.message : String(error);
      return NextResponse.json(
        { success: false, message: 'Internal server error', error: errorMessage },
        { status: 500 }
      );
    }
  }

  async login(body: AuthPayload): Promise<NextResponse> {
    try {
      await connectDB();

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

      // Compare password
      const isPasswordValid = await user.comparePassword(body.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { success: false, message: 'Invalid credentials' },
          { status: 401 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: 'Login successful',
          data: { id: user._id, email: user.email, name: user.name, role: user.role },
        },
        { status: 200 }
      );
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return NextResponse.json(
        { success: false, message: 'Internal server error', error: errorMessage },
        { status: 500 }
      );
    }
  }

  async getUser(id: string): Promise<NextResponse> {
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
