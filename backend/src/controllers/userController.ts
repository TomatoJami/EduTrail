import { Request, Response } from 'express';
import { userService } from '../services/userService';
import { sendPasswordResetEmail } from '../services/emailService';
import { createAuthToken } from '../services/jwtService';
import { SignupPayload, AuthPayload, ApiResponse, AuthResponse } from '../types';

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCK_MINUTES = 15;

function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  if (!/[A-Za-z]/.test(password)) {
    return 'Password must contain at least one letter';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!/\d/.test(password)) {
    return 'Password must contain at least one digit';
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'Password must contain at least one special character';
  }
  return null;
}

function getLockMessage(lockUntil: Date): string {
  const remainingMs = lockUntil.getTime() - Date.now();
  const remainingMinutes = Math.max(1, Math.ceil(remainingMs / 60000));
  return `Too many failed login attempts. Try again in ${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'}.`;
}

function canAccessUser(req: Request, userId: string) {
  const authReq = req as Request & { userId?: string; userRole?: 'student' | 'admin' };
  return authReq.userRole === 'admin' || authReq.userId === userId;
}

export class UserController {
  async signup(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body as {
        email?: string;
        password?: string;
        name?: string;
      };

      const isValidEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      };

      // Validate input
      if (!body.email || !body.password || !body.name) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields',
        } as ApiResponse);
        return;
      }

      if (!isValidEmail(body.email)) {
        res.status(400).json({
          success: false,
          message: 'Invalid email format',
        } as ApiResponse);
        return;
      }

      const passwordError = validatePasswordStrength(body.password);
      if (passwordError) {
        res.status(400).json({
          success: false,
          message: passwordError,
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
      const authToken = createAuthToken({
        id: user._id?.toString() || '',
        email: user.email,
        role: user.role,
      });

      const response: ApiResponse<AuthResponse> = {
        success: true,
        message: 'User created successfully',
        data: {
          id: user._id?.toString() || '',
          email: user.email,
          name: user.name,
          role: user.role,
          token: authToken.token,
          expiresAt: authToken.expiresAt,
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

      if (user.lockUntil && user.lockUntil > new Date()) {
        res.status(423).json({
          success: false,
          message: getLockMessage(user.lockUntil),
        } as ApiResponse);
        return;
      }

      if (user.lockUntil && user.lockUntil <= new Date()) {
        user.loginAttempts = 0;
        user.lockUntil = null;
      }

      // Compare password
      const isPasswordValid = await user.comparePassword(body.password);
      if (!isPasswordValid) {
        const nextAttempts = (user.loginAttempts || 0) + 1;
        user.loginAttempts = nextAttempts;

        if (nextAttempts >= MAX_LOGIN_ATTEMPTS) {
          user.lockUntil = new Date(Date.now() + LOGIN_LOCK_MINUTES * 60 * 1000);
          await user.save();
          res.status(423).json({
            success: false,
            message: getLockMessage(user.lockUntil),
          } as ApiResponse);
          return;
        }

        await user.save();
        res.status(401).json({
          success: false,
          message: `Invalid credentials. ${MAX_LOGIN_ATTEMPTS - nextAttempts} attempt${MAX_LOGIN_ATTEMPTS - nextAttempts === 1 ? '' : 's'} remaining before temporary lock.`,
        } as ApiResponse);
        return;
      }

      if ((user.loginAttempts || 0) > 0 || user.lockUntil) {
        user.loginAttempts = 0;
        user.lockUntil = null;
        await user.save();
      }

      const authToken = createAuthToken({
        id: user._id?.toString() || '',
        email: user.email,
        role: user.role,
      });

      const response: ApiResponse<AuthResponse> = {
        success: true,
        message: 'Login successful',
        data: {
          id: user._id?.toString() || '',
          email: user.email,
          name: user.name,
          role: user.role,
          token: authToken.token,
          expiresAt: authToken.expiresAt,
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

  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body as { email?: string };

      if (!body.email) {
        res.status(400).json({
          success: false,
          message: 'Email is required',
        } as ApiResponse);
        return;
      }

      const resetResult = await userService.createPasswordResetToken(body.email);

      if (!resetResult) {
        res.status(200).json({
          success: true,
          message: 'If the email exists, a reset email was sent',
        } as ApiResponse);
        return;
      }

      await sendPasswordResetEmail(body.email, resetResult.resetToken);

      res.status(200).json({
        success: true,
        message: 'If the email exists, a reset email was sent',
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to send password reset email',
        error: error instanceof Error ? error.message : String(error),
      } as ApiResponse);
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body as {
        token?: string;
        newPassword?: string;
      };

      if (!body.token || !body.newPassword) {
        res.status(400).json({
          success: false,
          message: 'Token and newPassword are required',
        } as ApiResponse);
        return;
      }

      const passwordError = validatePasswordStrength(body.newPassword);
      if (passwordError) {
        res.status(400).json({
          success: false,
          message: passwordError,
        } as ApiResponse);
        return;
      }

      const user = await userService.resetPassword(body.token, body.newPassword);

      if (!user) {
        res.status(400).json({
          success: false,
          message: 'Invalid or expired reset token',
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Password reset successfully',
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to reset password',
        error: error instanceof Error ? error.message : String(error),
      } as ApiResponse);
    }
  }

  async getUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!canAccessUser(req, id)) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: cannot access another user',
        } as ApiResponse);
        return;
      }

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
      const authReq = req as Request & { userId?: string; userRole?: 'student' | 'admin' };
      const body = req.body as {
        name?: string;
        email?: string;
        password?: string;
        role?: string;
      };

      // Validate input
      if (!id) {
        res.status(400).json({
          success: false,
          message: 'User ID is required',
        } as ApiResponse);
        return;
      }

      if (!canAccessUser(req, id)) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: cannot update another user',
        } as ApiResponse);
        return;
      }

      if (body.role && authReq.userRole !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Forbidden: only admins can update roles',
        } as ApiResponse);
        return;
      }

      const updates: any = {};
      if (body.name) updates.name = body.name;
      if (body.email) updates.email = body.email;
      if (body.password) updates.password = body.password;
      if (body.role) updates.role = body.role;

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

  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'User ID is required',
        } as ApiResponse);
        return;
      }

      const user = await userService.deleteUser(id);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
        data: {
          id: user._id?.toString() || '',
          email: user.email,
          name: user.name,
        },
      } as ApiResponse);
    } catch (error) {
      console.error('Delete user error:', error);
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

      if (!canAccessUser(req, id)) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: cannot update another user',
        } as ApiResponse);
        return;
      }

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

      if (!canAccessUser(req, id)) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: cannot update another user',
        } as ApiResponse);
        return;
      }

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

      if (!canAccessUser(req, id)) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: cannot access another user',
        } as ApiResponse);
        return;
      }

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
        data: user.preferredSubjects,
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

  async savePreferences(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { preferredSubjects, ageGroup } = req.body;

      if (!canAccessUser(req, id)) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: cannot update another user',
        } as ApiResponse);
        return;
      }

      if (!id || !ageGroup) {
        res.status(400).json({
          success: false,
          message: 'User ID and age group are required',
        } as ApiResponse);
        return;
      }

      // Validate age group
      if (!['1-3', '4-9', '10-12'].includes(ageGroup)) {
        res.status(400).json({
          success: false,
          message: 'Invalid age group',
        } as ApiResponse);
        return;
      }

      // Validate preferred subjects array
      if (!Array.isArray(preferredSubjects)) {
        res.status(400).json({
          success: false,
          message: 'Preferred subjects must be an array',
        } as ApiResponse);
        return;
      }

      const user = await userService.savePreferences(id, preferredSubjects, ageGroup);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Preferences saved successfully',
        data: {
          id: user._id?.toString() || '',
          email: user.email,
          name: user.name,
          ageGroup: user.ageGroup,
          preferredSubjects: user.preferredSubjects,
          hasCompletedOnboarding: user.hasCompletedOnboarding,
        },
      } as ApiResponse);
    } catch (error) {
      console.error('Save preferences error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: errorMessage,
      } as ApiResponse);
    }
  }

  async skipPreferences(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!canAccessUser(req, id)) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: cannot update another user',
        } as ApiResponse);
        return;
      }

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'User ID is required',
        } as ApiResponse);
        return;
      }

      const user = await userService.skipPreferences(id);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Preferences skipped',
        data: {
          id: user._id?.toString() || '',
          email: user.email,
          name: user.name,
          hasCompletedOnboarding: user.hasCompletedOnboarding,
        },
      } as ApiResponse);
    } catch (error) {
      console.error('Skip preferences error:', error);
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
