import { Request, Response } from 'express';
import { userService } from '../services/userService';
import { SignupPayload, AuthPayload, ApiResponse, AuthResponse } from '../types';

export class UserController {
  async signup(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body as {
        email?: string;
        password?: string;
        name?: string;
      };

      // Validate input
      if (!body.email || !body.password || !body.name) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields',
        } as ApiResponse);
        return;
      }

      // Check if user exists
      const existingUser = await userService.getUserByEmail(body.email);
      if (existingUser) {
        res.status(409).json({
          success: false,
          message: 'User already exists',
        } as ApiResponse);
        return;
      }

      // Create user
      const signupPayload: SignupPayload = {
        email: body.email,
        password: body.password,
        name: body.name,
      };

      const user = await userService.createUser(signupPayload);

      const response: ApiResponse<AuthResponse> = {
        success: true,
        message: 'User created successfully',
        data: {
          id: user._id?.toString() || '',
          email: user.email,
          name: user.name,
          role: user.role,
        },
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Signup error:', error);

      const err = error as any;

      // Handle Mongoose validation errors
      if (err.name === 'ValidationError' && err.errors) {
        const messages = Object.values(err.errors)
          .map((e: any) => e.message)
          .join(', ');
        res.status(400).json({
          success: false,
          message: 'Validation error',
          error: messages,
        } as ApiResponse);
        return;
      }

      // Handle duplicate key errors
      if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        res.status(409).json({
          success: false,
          message: `${field} already exists`,
        } as ApiResponse);
        return;
      }

      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: errorMessage,
      } as ApiResponse);
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body as {
        email?: string;
        password?: string;
      };

      if (!body.email || !body.password) {
        res.status(400).json({
          success: false,
          message: 'Email and password are required',
        } as ApiResponse);
        return;
      }

      const user = await userService.getUserByEmail(body.email);
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        } as ApiResponse);
        return;
      }

      // Compare password
      const isPasswordValid = await user.comparePassword(body.password);
      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        } as ApiResponse);
        return;
      }

      const response: ApiResponse<AuthResponse> = {
        success: true,
        message: 'Login successful',
        data: {
          id: user._id?.toString() || '',
          email: user.email,
          name: user.name,
          role: user.role,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: errorMessage,
      } as ApiResponse);
    }
  }

  async getUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const user = await userService.getUserById(id);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'User fetched successfully',
        data: user,
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: String(error),
      } as ApiResponse);
    }
  }

  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await userService.getAllUsers();

      res.status(200).json({
        success: true,
        message: 'Users fetched successfully',
        data: users,
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: String(error),
      } as ApiResponse);
    }
  }

  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const body = req.body as {
        name?: string;
        email?: string;
        password?: string;
      };

      // Validate input
      if (!id) {
        res.status(400).json({
          success: false,
          message: 'User ID is required',
        } as ApiResponse);
        return;
      }

      const updates: any = {};
      if (body.name) updates.name = body.name;
      if (body.email) updates.email = body.email;
      if (body.password) updates.password = body.password;

      if (Object.keys(updates).length === 0) {
        res.status(400).json({
          success: false,
          message: 'No fields to update',
        } as ApiResponse);
        return;
      }

      const user = await userService.updateUser(id, updates);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: {
          id: user._id?.toString() || '',
          email: user.email,
          name: user.name,
          role: user.role,
        },
      } as ApiResponse);
    } catch (error) {
      console.error('Update user error:', error);

      const err = error as any;

      // Handle duplicate key errors (e.g., email already exists)
      if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        res.status(409).json({
          success: false,
          message: `${field} already exists`,
        } as ApiResponse);
        return;
      }

      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: errorMessage,
      } as ApiResponse);
    }
  }

  async addToWishlist(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { subjectId } = req.body;

      if (!id || !subjectId) {
        res.status(400).json({
          success: false,
          message: 'User ID and Subject ID are required',
        } as ApiResponse);
        return;
      }

      const user = await userService.addToWishlist(id, subjectId);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Subject added to wishlist',
        data: user,
      } as ApiResponse);
    } catch (error) {
      console.error('Add to wishlist error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: errorMessage,
      } as ApiResponse);
    }
  }

  async removeFromWishlist(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { subjectId } = req.body;

      if (!id || !subjectId) {
        res.status(400).json({
          success: false,
          message: 'User ID and Subject ID are required',
        } as ApiResponse);
        return;
      }

      const user = await userService.removeFromWishlist(id, subjectId);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Subject removed from wishlist',
        data: user,
      } as ApiResponse);
    } catch (error) {
      console.error('Remove from wishlist error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: errorMessage,
      } as ApiResponse);
    }
  }

  async getWishlist(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'User ID is required',
        } as ApiResponse);
        return;
      }

      const user = await userService.getWishlist(id);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Wishlist fetched successfully',
        data: user.wishlistSubjects,
      } as ApiResponse);
    } catch (error) {
      console.error('Get wishlist error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: errorMessage,
      } as ApiResponse);
    }
  }
}

export const userController = new UserController();
