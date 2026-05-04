import mongoose from 'mongoose';
import { UserCourse, IUserCourse } from '../models/UserCourse';

export interface UserCoursePayload {
  user_id: string;
  course_id: string;
  is_completed?: boolean;
  is_saved?: boolean;
}

export class UserCourseService {
  async getUserCourse(userId: string, courseId: string): Promise<IUserCourse | null> {
    if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(courseId)) {
      throw new Error('Invalid user id or course id');
    }

    return UserCourse.findOne({
      user_id: new mongoose.Types.ObjectId(userId),
      course_id: new mongoose.Types.ObjectId(courseId),
    }).populate(['user_id', 'course_id']);
  }

  async getUserCourses(userId: string): Promise<IUserCourse[]> {
    if (!mongoose.isValidObjectId(userId)) {
      throw new Error('Invalid user id');
    }

    return UserCourse.find({
      user_id: new mongoose.Types.ObjectId(userId),
    }).populate(['user_id', 'course_id']);
  }

  async createOrUpdateUserCourse(payload: UserCoursePayload): Promise<IUserCourse> {
    if (!mongoose.isValidObjectId(payload.user_id) || !mongoose.isValidObjectId(payload.course_id)) {
      throw new Error('Invalid user id or course id');
    }

    const userId = new mongoose.Types.ObjectId(payload.user_id);
    const courseId = new mongoose.Types.ObjectId(payload.course_id);

    let userCourse = await UserCourse.findOne({
      user_id: userId,
      course_id: courseId,
    });

    if (userCourse) {
      // Update existing record
      if (payload.is_completed !== undefined) {
        userCourse.is_completed = payload.is_completed;
      }
      if (payload.is_saved !== undefined) {
        userCourse.is_saved = payload.is_saved;
      }
      await userCourse.save();
    } else {
      // Create new record
      userCourse = new UserCourse({
        user_id: userId,
        course_id: courseId,
        is_completed: payload.is_completed ?? false,
        is_saved: payload.is_saved ?? false,
      });
      await userCourse.save();
    }

    return userCourse.populate(['user_id', 'course_id']);
  }

  async markCourseCompleted(userId: string, courseId: string, completed: boolean): Promise<IUserCourse | null> {
    if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(courseId)) {
      throw new Error('Invalid user id or course id');
    }

    return UserCourse.findOneAndUpdate(
      {
        user_id: new mongoose.Types.ObjectId(userId),
        course_id: new mongoose.Types.ObjectId(courseId),
      },
      { is_completed: completed },
      { new: true }
    ).populate(['user_id', 'course_id']);
  }

  async saveCourse(userId: string, courseId: string, saved: boolean): Promise<IUserCourse | null> {
    if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(courseId)) {
      throw new Error('Invalid user id or course id');
    }

    return UserCourse.findOneAndUpdate(
      {
        user_id: new mongoose.Types.ObjectId(userId),
        course_id: new mongoose.Types.ObjectId(courseId),
      },
      { is_saved: saved },
      { new: true }
    ).populate(['user_id', 'course_id']);
  }

  async deleteUserCourse(userId: string, courseId: string): Promise<IUserCourse | null> {
    if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(courseId)) {
      throw new Error('Invalid user id or course id');
    }

    return UserCourse.findOneAndDelete({
      user_id: new mongoose.Types.ObjectId(userId),
      course_id: new mongoose.Types.ObjectId(courseId),
    });
  }
}

export const userCourseService = new UserCourseService();
