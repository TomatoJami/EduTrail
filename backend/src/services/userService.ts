import crypto from 'crypto';
import mongoose from 'mongoose';
import { User, IUser } from '../models/User';
import { CourseProgress } from '../models/CourseProgress';
import { ChapterProgress } from '../models/ChapterProgress';
import { QuestionProgress } from '../models/QuestionProgress';
import { SignupPayload, User as UserType } from '../types';

/** Retrieves error message data. */
function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

/** Retrieves default admin credentials data. */
export function getDefaultAdminCredentials() {
  return {
    email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@edutrail.local',
    password: process.env.DEFAULT_ADMIN_PASSWORD || '12345678A!',
  };
}

// Owns user persistence, default admin creation, preferences, and account cleanup.
export class UserService {
  /** Handles the create user request flow. */
  async createUser(payload: SignupPayload): Promise<IUser> {
    try {
      const user = new User({
        email: payload.email,
        password: payload.password,
        name: payload.name,
        role: payload.role || 'student',
      });
      await user.save();
      return user;
    } catch (error) {
      throw error;
    }
  }

  /** Handles the get user by email request flow. */
  async getUserByEmail(email: string): Promise<IUser | null> {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const user = await User.findOne({ email: normalizedEmail }).select('+password +loginAttempts +lockUntil');
      return user;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to fetch user: ${errorMessage}`);
    }
  }

  /** Handles the ensure default admin user request flow. */
  async ensureDefaultAdminUser(): Promise<{ user: IUser; created: boolean }> {
    const defaultAdmin = getDefaultAdminCredentials();
    const existingAdmin = await User.findOne({ email: defaultAdmin.email });

    if (existingAdmin) {
      return { user: existingAdmin, created: false };
    }

    const admin = new User({
      email: defaultAdmin.email,
      password: defaultAdmin.password,
      name: 'Administrator',
      role: 'admin',
      hasCompletedOnboarding: true,
    });

    await admin.save();
    return { user: admin, created: true };
  }

  /** Handles the create password reset token request flow. */
  async createPasswordResetToken(email: string): Promise<{ resetToken: string } | null> {
    // Stores a hashed reset token and returns the raw token for email delivery.
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return null;
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetPasswordExpires = new Date(Date.now() + 1000 * 60 * 30);
      const resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

      user.resetPasswordToken = resetPasswordToken;
      user.resetPasswordExpires = resetPasswordExpires;
      await user.save();

      return { resetToken };
    } catch (error) {
      throw new Error(`Failed to create password reset token: ${getErrorMessage(error)}`);
    }
  }

  /** Handles the reset password request flow. */
  async resetPassword(resetToken: string, newPassword: string): Promise<IUser | null> {
    try {
      const resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

      const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpires: { $gt: new Date() },
      });

      if (!user) {
        return null;
      }

      user.password = newPassword;
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      user.loginAttempts = 0;
      user.lockUntil = null;

      await user.save();
      return user;
    } catch (error) {
      throw new Error(`Failed to reset password: ${getErrorMessage(error)}`);
    }
  }

  /** Handles the get user by id request flow. */
  async getUserById(id: string): Promise<IUser | null> {
    // Reads one user by id for profile and auth refresh requests.
    try {
      const user = await User.findById(id);
      return user;
    } catch (error) {
      throw new Error(`Failed to fetch user: ${getErrorMessage(error)}`);
    }
  }

  /** Handles the update user request flow. */
  async updateUser(id: string, updates: Partial<UserType>): Promise<IUser | null> {
    // Applies profile updates and lets the model hash a changed password.
    try {
      const user = await User.findById(id);
      if (!user) {
        return null;
      }

      // Update fields
      if (updates.name) user.name = updates.name;
      if (updates.email) user.email = updates.email;
      if (updates.password) user.password = updates.password;
      if (updates.role) user.role = updates.role;

      // Save will trigger pre-save middleware for password hashing
      await user.save();
      return user;
    } catch (error) {
      throw new Error(`Failed to update user: ${getErrorMessage(error)}`);
    }
  }

  /** Handles the delete user request flow. */
  async deleteUser(id: string): Promise<IUser | null> {
    const session = await mongoose.startSession();
    let deletedUser: IUser | null = null;

    try {
      await session.withTransaction(async () => {
        const user = await User.findById(id).session(session as any);
        if (!user) {
          deletedUser = null;
          return;
        }

        // Remove all learning progress owned by this user before deleting the account.
        await Promise.all([
          CourseProgress.deleteMany({ user_id: user._id }).session(session as any),
          ChapterProgress.deleteMany({ user_id: user._id }).session(session as any),
          QuestionProgress.deleteMany({ user_id: user._id }).session(session as any),
        ]);

        await User.findByIdAndDelete(user._id).session(session as any);
        deletedUser = user;
      });
    } finally {
      session.endSession();
    }

    return deletedUser;
  }

  /** Handles the get all users request flow. */
  async getAllUsers(): Promise<IUser[]> {
    // Lists users while excluding password fields.
    try {
      const users = await User.find().select('-password');
      return users;
    } catch (error) {
      throw new Error(`Failed to fetch users: ${getErrorMessage(error)}`);
    }
  }

  /** Handles the add to wishlist request flow. */
  async addToWishlist(userId: string, subjectId: string): Promise<IUser | null> {
    // Adds one subject ObjectId to the user's wishlist when it is not already present.
    try {
      const user = await User.findById(userId);
      if (!user) {
        return null;
      }

      // Check if subject already in wishlist
      const subjectObjectId = mongoose.Types.ObjectId;
      const subjectObjId = new subjectObjectId(subjectId);

      if (!user.wishlistSubjects.includes(subjectObjId)) {
        user.wishlistSubjects.push(subjectObjId);
        await user.save();
      }

      return user.populate('wishlistSubjects');
    } catch (error) {
      throw new Error(`Failed to add to wishlist: ${getErrorMessage(error)}`);
    }
  }

  /** Handles the remove from wishlist request flow. */
  async removeFromWishlist(userId: string, subjectId: string): Promise<IUser | null> {
    // Removes one subject ObjectId from the user's wishlist.
    try {
      const user = await User.findById(userId);
      if (!user) {
        return null;
      }

      const subjectObjectId = mongoose.Types.ObjectId;
      const subjectObjId = new subjectObjectId(subjectId);

      user.wishlistSubjects = user.wishlistSubjects.filter(
        (id: any) => id.toString() !== subjectObjId.toString()
      );
      await user.save();

      return user.populate('wishlistSubjects');
    } catch (error) {
      throw new Error(`Failed to remove from wishlist: ${getErrorMessage(error)}`);
    }
  }

  /** Handles the get wishlist request flow. */
  async getWishlist(userId: string): Promise<IUser | null> {
    // Reads the user with wishlist subjects populated.
    try {
      const user = await User.findById(userId).populate('wishlistSubjects');
      return user;
    } catch (error) {
      throw new Error(`Failed to fetch wishlist: ${getErrorMessage(error)}`);
    }
  }

  /** Handles the save preferences request flow. */
  async savePreferences(userId: string, preferredSubjects: string[], ageGroup: '1-3' | '4-9' | '10-12'): Promise<IUser | null> {
    // Converts selected subject ids and stores onboarding preferences.
    try {
      const user = await User.findById(userId);
      if (!user) {
        return null;
      }

      // Convert string IDs to ObjectId
      user.preferredSubjects = preferredSubjects.map((id: string) => new mongoose.Types.ObjectId(id));
      user.ageGroup = ageGroup;
      user.hasCompletedOnboarding = true;
      
      await user.save();
      return user.populate('preferredSubjects');
    } catch (error) {
      throw new Error(`Failed to save preferences: ${getErrorMessage(error)}`);
    }
  }

  /** Handles the skip preferences request flow. */
  async skipPreferences(userId: string): Promise<IUser | null> {
    // Marks onboarding complete without adding preferred subjects.
    try {
      const user = await User.findById(userId);
      if (!user) {
        return null;
      }

      user.hasCompletedOnboarding = true;
      await user.save();
      return user;
    } catch (error) {
      throw new Error(`Failed to skip preferences: ${getErrorMessage(error)}`);
    }
  }
}

export const userService = new UserService();
