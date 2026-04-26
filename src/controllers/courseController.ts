import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import connectDB from '@/config/database';
import { courseService, CoursePayload } from '@/services/courseService';

const allowedAgeGroups = ['1-3', '4-9', '10-12'] as const;

export class CourseController {
  async getAllCourses(): Promise<NextResponse> {
    try {
      await connectDB();
      const courses = await courseService.getAllCourses();

      return NextResponse.json(
        { success: true, message: 'Courses fetched successfully', data: courses },
        { status: 200 }
      );
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to fetch courses',
          error: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }
  }

  async createCourse(payload: CoursePayload): Promise<NextResponse> {
    try {
      await connectDB();

      if (!payload.title || !payload.description || !payload.course_img || !payload.subject_id || !payload.ageGroup) {
        return NextResponse.json(
          { success: false, message: 'title, description, ageGroup, course_img and subject_id are required' },
          { status: 400 }
        );
      }

      if (!allowedAgeGroups.includes(payload.ageGroup)) {
        return NextResponse.json(
          { success: false, message: 'Invalid ageGroup value' },
          { status: 400 }
        );
      }

      if (!mongoose.isValidObjectId(payload.subject_id)) {
        return NextResponse.json(
          { success: false, message: 'Invalid subject_id' },
          { status: 400 }
        );
      }

      const course = await courseService.createCourse(payload);
      return NextResponse.json(
        { success: true, message: 'Course created successfully', data: course },
        { status: 201 }
      );
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to create course',
          error: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }
  }

  async updateCourse(id: string, payload: Partial<CoursePayload>): Promise<NextResponse> {
    try {
      await connectDB();

      if (!id) {
        return NextResponse.json(
          { success: false, message: 'Course id is required' },
          { status: 400 }
        );
      }

      if (payload.ageGroup && !allowedAgeGroups.includes(payload.ageGroup)) {
        return NextResponse.json(
          { success: false, message: 'Invalid ageGroup value' },
          { status: 400 }
        );
      }

      const course = await courseService.updateCourse(id, payload);
      if (!course) {
        return NextResponse.json(
          { success: false, message: 'Course not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { success: true, message: 'Course updated successfully', data: course },
        { status: 200 }
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const status = message.includes('Invalid') ? 400 : 500;

      return NextResponse.json(
        { success: false, message: 'Failed to update course', error: message },
        { status }
      );
    }
  }

  async deleteCourse(id: string): Promise<NextResponse> {
    try {
      await connectDB();

      if (!id) {
        return NextResponse.json(
          { success: false, message: 'Course id is required' },
          { status: 400 }
        );
      }

      const course = await courseService.deleteCourse(id);
      if (!course) {
        return NextResponse.json(
          { success: false, message: 'Course not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { success: true, message: 'Course deleted successfully', data: course },
        { status: 200 }
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const status = message.includes('Invalid') ? 400 : 500;

      return NextResponse.json(
        { success: false, message: 'Failed to delete course', error: message },
        { status }
      );
    }
  }
}

export const courseController = new CourseController();
