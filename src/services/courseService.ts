import mongoose from 'mongoose';
import { Course, ICourse, CourseAgeGroup } from '@/models/Course';

export interface CoursePayload {
  title: string;
  description: string;
  ageGroup: CourseAgeGroup;
  course_img: string;
  subject_id: string;
}

export class CourseService {
  async getAllCourses(): Promise<ICourse[]> {
    return Course.find().populate('subject_id').sort({ createdAt: -1 });
  }

  async createCourse(payload: CoursePayload): Promise<ICourse> {
    const course = new Course({
      ...payload,
      subject_id: new mongoose.Types.ObjectId(payload.subject_id),
    });

    await course.save();
    return course;
  }

  async updateCourse(id: string, payload: Partial<CoursePayload>): Promise<ICourse | null> {
    if (!mongoose.isValidObjectId(id)) {
      throw new Error('Invalid course id');
    }

    const nextPayload: Record<string, unknown> = { ...payload };

    if (payload.subject_id) {
      if (!mongoose.isValidObjectId(payload.subject_id)) {
        throw new Error('Invalid subject id');
      }
      nextPayload.subject_id = new mongoose.Types.ObjectId(payload.subject_id);
    }

    return Course.findByIdAndUpdate(id, nextPayload, {
      new: true,
      runValidators: true,
    }).populate('subject_id');
  }

  async deleteCourse(id: string): Promise<ICourse | null> {
    if (!mongoose.isValidObjectId(id)) {
      throw new Error('Invalid course id');
    }

    return Course.findByIdAndDelete(id).populate('subject_id');
  }
}

export const courseService = new CourseService();
