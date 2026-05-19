import { Request, Response } from 'express';
import { userService } from '../services/userService';
import { sendPasswordResetEmail } from '../services/emailService';
import { createAuthToken } from '../services/jwtService';
import { SignupPayload, ApiResponse, AuthResponse } from '../types';

/** Keeps the max login attempts logic isolated and reusable. */
const MAX_LOGIN_ATTEMPTS = 5;
/** Keeps the login lock minutes logic isolated and reusable. */
const LOGIN_LOCK_MINUTES = 15;
/** Keeps the login error message logic isolated and reusable. */
const LOGIN_ERROR_MESSAGE = 'Email or Password is incorrect';
/** Keeps the login limit error message logic isolated and reusable. */
const LOGIN_LIMIT_ERROR_MESSAGE = 'Login attempt limit exceeded. Please try again later.';

/** Validates password strength input. */
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

/** Keeps the can access user logic isolated and reusable. */
function canAccessUser(req: Request, userId: string) {
  const authReq = req as Request & { userId?: string; userRole?: 'student' | 'admin' };
  return authReq.userRole === 'admin' || authReq.userId === userId;
}

/** Groups user controller operations behind one class. */
export class UserController {
  /** Handles the signup request flow. */
  async signup(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body as {
        email?: string;
        password?: string;
        name?: string;
      };

      /** Keeps the is valid email logic isolated and reusable. */
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

  /** Handles the login request flow. */
  async login(req: Request, res: Response): Promise<void> {
    // Authenticates by email/password and returns a short-lived auth token.
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
          message: LOGIN_ERROR_MESSAGE,
        } as ApiResponse);
        return;
      }

      if (user.lockUntil && user.lockUntil > new Date()) {
        res.status(423).json({
          success: false,
          message: LOGIN_LIMIT_ERROR_MESSAGE,
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
        // Keep counting failed attempts internally, but return a generic message.
        const nextAttempts = (user.loginAttempts || 0) + 1;
        user.loginAttempts = nextAttempts;

        if (nextAttempts >= MAX_LOGIN_ATTEMPTS) {
          user.lockUntil = new Date(Date.now() + LOGIN_LOCK_MINUTES * 60 * 1000);
          await user.save();
          res.status(423).json({
            success: false,
            message: LOGIN_LIMIT_ERROR_MESSAGE,
          } as ApiResponse);
          return;
        }

        await user.save();
        res.status(401).json({
          success: false,
          message: LOGIN_ERROR_MESSAGE,
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: errorMessage,
      } as ApiResponse);
    }
  }

  /** Handles the forgot password request flow. */
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

  /** Handles the reset password request flow. */
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

  /** Handles the get user request flow. */
  async getUser(req: Request, res: Response): Promise<void> {
    // Returns the requested profile only when the caller owns it or is admin.
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

  /** Handles the get all users request flow. */
  async getAllUsers(req: Request, res: Response): Promise<void> {
    // Lists users for the admin panel with passwords excluded by the service/model.
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

  /** Handles the update user request flow. */
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

  /** Handles the delete user request flow. */
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: errorMessage,
      } as ApiResponse);
    }
  }

  /** Handles the add to wishlist request flow. */
  async addToWishlist(req: Request, res: Response): Promise<void> {
    // Adds a subject to the user's wishlist after ownership checks.
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: errorMessage,
      } as ApiResponse);
    }
  }

  /** Handles the remove from wishlist request flow. */
  async removeFromWishlist(req: Request, res: Response): Promise<void> {
    // Removes a subject from the user's wishlist after ownership checks.
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: errorMessage,
      } as ApiResponse);
    }
  }

  /** Handles the get wishlist request flow. */
  async getWishlist(req: Request, res: Response): Promise<void> {
    // Reads the user's wishlist subjects for account pages.
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: errorMessage,
      } as ApiResponse);
    }
  }

  /** Handles the save preferences request flow. */
  async savePreferences(req: Request, res: Response): Promise<void> {
    // Saves onboarding preferences and marks onboarding complete.
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: errorMessage,
      } as ApiResponse);
    }
  }

  /** Handles the skip preferences request flow. */
  async skipPreferences(req: Request, res: Response): Promise<void> {
    // Marks onboarding complete without storing preferred subjects.
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
