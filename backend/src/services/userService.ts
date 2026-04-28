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
}

export const userService = new UserService();
