import mongoose from 'mongoose';
import { Course, ICourse, CourseAgeGroup } from '../models/Course';
import { Module } from '../models/Module';
import { Chapter } from '../models/Chapter';
import { Question } from '../models/Question';
import { TestQuestion } from '../models/TestQuestion';
import { ShortAnswerQuestion } from '../models/ShortAnswerQuestion';
import { FillInTheBlankQuestion } from '../models/FillInTheBlankQuestion';
import { ChapterProgress } from '../models/ChapterProgress';
import { QuestionProgress } from '../models/QuestionProgress';
import { CourseProgress } from '../models/CourseProgress';
import { deleteRemovedSupabaseImages, deleteSupabaseImages } from './storageCleanupService';

/** Defines the TypeScript shape for course payload. */
export interface CoursePayload {
  title: string;
  description: string;
  goals: string[];
  ageGroup: CourseAgeGroup;
  course_img: string;
  subject_id: string;
}

// Owns course persistence and related cleanup that must happen outside controllers.
export class CourseService {
  /** Handles the get all courses request flow. */
  async getAllCourses(): Promise<ICourse[]> {
    // Reads courses with subject data so API consumers receive display-ready records.
    return Course.find().populate('subject_id').sort({ createdAt: -1 });
  }

  /** Handles the create course request flow. */
  async createCourse(payload: CoursePayload): Promise<ICourse> {
    // Persists a new course document from validated controller input.
    const course = new Course({
      ...payload,
      subject_id: new mongoose.Types.ObjectId(payload.subject_id),
    });

    await course.save();
    return course.populate('subject_id');
  }

  /** Handles the update course request flow. */
  async updateCourse(id: string, payload: Partial<CoursePayload>): Promise<ICourse | null> {
    if (!mongoose.isValidObjectId(id)) {
      throw new Error('Invalid course id');
    }

    const nextPayload: Record<string, unknown> = Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value !== undefined)
    );

    if (payload.subject_id) {
      if (!mongoose.isValidObjectId(payload.subject_id)) {
        throw new Error('Invalid subject id');
      }
      nextPayload.subject_id = new mongoose.Types.ObjectId(payload.subject_id);
    }

    const previousCourse = await Course.findById(id);
    if (!previousCourse) {
      return null;
    }

    const updatedCourse = await Course.findByIdAndUpdate(id, nextPayload, {
      returnDocument: 'after',
      runValidators: true,
    }).populate('subject_id');

    if (payload.course_img !== undefined) {
      await deleteRemovedSupabaseImages(previousCourse.course_img, payload.course_img);
    }

    return updatedCourse;
  }

  /** Handles the delete course request flow. */
  async deleteCourse(id: string): Promise<ICourse | null> {
    // Removes a course, nested modules/chapters/questions, progress, and course images.
    if (!mongoose.isValidObjectId(id)) {
      throw new Error('Invalid course id');
    }

    const courseObjectId = new mongoose.Types.ObjectId(id);
    const course = await Course.findById(courseObjectId).populate('subject_id');

    if (!course) {
      return null;
    }

    const courseModules = await Module.find({ course_id: courseObjectId }).select('_id');
    const moduleIds = courseModules.map((moduleItem) => moduleItem._id);

    if (moduleIds.length > 0) {
      const [courseChapters, courseQuestions] = await Promise.all([
        Chapter.find({ module_id: { $in: moduleIds } }).select('_id content'),
        Question.find({ module_id: { $in: moduleIds } }).select('_id'),
      ]);

      const chapterIds = courseChapters.map((chapter) => chapter._id);
      const questionIds = courseQuestions.map((question) => question._id);

      const [testQuestions, shortAnswerQuestions, fillInTheBlankQuestions] = await Promise.all([
        TestQuestion.find({ module_id: { $in: moduleIds } }).select('question_img'),
        ShortAnswerQuestion.find({ module_id: { $in: moduleIds } }).select('question_img'),
        FillInTheBlankQuestion.find({ module_id: { $in: moduleIds } }).select('question_img'),
      ]);

      await Promise.all([
        chapterIds.length > 0
          ? ChapterProgress.deleteMany({ chapter_id: { $in: chapterIds } })
          : Promise.resolve(),
        questionIds.length > 0
          ? QuestionProgress.deleteMany({ question_id: { $in: questionIds } })
          : Promise.resolve(),
        TestQuestion.deleteMany({ module_id: { $in: moduleIds } }),
        ShortAnswerQuestion.deleteMany({ module_id: { $in: moduleIds } }),
        FillInTheBlankQuestion.deleteMany({ module_id: { $in: moduleIds } }),
        Question.deleteMany({ module_id: { $in: moduleIds } }),
        Chapter.deleteMany({ module_id: { $in: moduleIds } }),
        Module.deleteMany({ course_id: courseObjectId }),
      ]);

      await deleteSupabaseImages(
        ...courseChapters.map((chapter) => chapter.content),
        ...testQuestions.map((question) => question.question_img),
        ...shortAnswerQuestions.map((question) => question.question_img),
        ...fillInTheBlankQuestions.map((question) => question.question_img)
      );
    }

    await Promise.all([
      CourseProgress.deleteMany({ course_id: courseObjectId }),
      Course.findByIdAndDelete(courseObjectId),
    ]);

    await deleteSupabaseImages(course.course_img);

    return course;
  }

  /** Handles the get course by id request flow. */
  async getCourseById(id: string): Promise<ICourse | null> {
    // Reads one course and populates its subject relation for detail pages.
    if (!mongoose.isValidObjectId(id)) {
      throw new Error('Invalid course id');
    }

    return Course.findById(id).populate('subject_id');
  }
}

export const courseService = new CourseService();
