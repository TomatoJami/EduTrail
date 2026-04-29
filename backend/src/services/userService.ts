import { User, IUser } from '../models/User';
import { SignupPayload, AuthPayload, User as UserType } from '../types';

export class UserService {
  async createUser(payload: SignupPayload): Promise<IUser> {
    try {
      const user = new User({
        email: payload.email,
        password: payload.password,
        name: payload.name,
        role: payload.role || 'student',
      });

      console.log('Creating user:', { email: user.email, name: user.name });
      await user.save();
      console.log('User created successfully:', user._id);
      return user;
    } catch (error) {
      console.error('Error in createUser:', error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<IUser | null> {
    try {
      const user = await User.findOne({ email }).select('+password');
      return user;
    } catch (error) {
      console.error('Error in getUserByEmail:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to fetch user: ${errorMessage}`);
    }
  }

  async getUserById(id: string): Promise<IUser | null> {
    try {
      const user = await User.findById(id);
      return user;
    } catch (error) {
      throw new Error(`Failed to fetch user: ${error}`);
    }
  }

  async updateUser(id: string, updates: Partial<UserType>): Promise<IUser | null> {
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
      throw new Error(`Failed to update user: ${error}`);
    }
  }

  async deleteUser(id: string): Promise<IUser | null> {
    try {
      const user = await User.findByIdAndDelete(id);
      return user;
    } catch (error) {
      throw new Error(`Failed to delete user: ${error}`);
    }
  }

  async getAllUsers(): Promise<IUser[]> {
    try {
      const users = await User.find().select('-password');
      return users;
    } catch (error) {
      throw new Error(`Failed to fetch users: ${error}`);
    }
  }

  async addToWishlist(userId: string, subjectId: string): Promise<IUser | null> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return null;
      }

      // Check if subject already in wishlist
      const subjectObjectId = require('mongoose').Types.ObjectId;
      const subjectObjId = new subjectObjectId(subjectId);

      if (!user.wishlistSubjects.includes(subjectObjId)) {
        user.wishlistSubjects.push(subjectObjId);
        await user.save();
      }

      return user.populate('wishlistSubjects');
    } catch (error) {
      throw new Error(`Failed to add to wishlist: ${error}`);
    }
  }

  async removeFromWishlist(userId: string, subjectId: string): Promise<IUser | null> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return null;
      }

      const subjectObjectId = require('mongoose').Types.ObjectId;
      const subjectObjId = new subjectObjectId(subjectId);

      user.wishlistSubjects = user.wishlistSubjects.filter(
        (id: any) => id.toString() !== subjectObjId.toString()
      );
      await user.save();

      return user.populate('wishlistSubjects');
    } catch (error) {
      throw new Error(`Failed to remove from wishlist: ${error}`);
    }
  }

  async getWishlist(userId: string): Promise<IUser | null> {
    try {
      const user = await User.findById(userId).populate('wishlistSubjects');
      return user;
    } catch (error) {
      throw new Error(`Failed to fetch wishlist: ${error}`);
    }
  }

  async savePreferences(userId: string, preferredSubjects: string[], ageGroup: '1-3' | '4-9' | '10-12'): Promise<IUser | null> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return null;
      }

      // Convert string IDs to ObjectId
      const mongoose = require('mongoose');
      user.preferredSubjects = preferredSubjects.map((id: string) => new mongoose.Types.ObjectId(id));
      user.ageGroup = ageGroup;
      user.hasCompletedOnboarding = true;
      
      await user.save();
      return user.populate('preferredSubjects');
    } catch (error) {
      throw new Error(`Failed to save preferences: ${error}`);
    }
  }

  async skipPreferences(userId: string): Promise<IUser | null> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return null;
      }

      user.hasCompletedOnboarding = true;
      await user.save();
      return user;
    } catch (error) {
      throw new Error(`Failed to skip preferences: ${error}`);
    }
  }
}

export const userService = new UserService();
