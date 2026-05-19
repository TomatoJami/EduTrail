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

const isPresentString = (value: string | undefined | null): value is string =>
  Boolean(value);

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

    // We'll run DB mutations inside a transaction and perform external image deletions only
    // after a successful commit to avoid inconsistent state.
    const session = await mongoose.startSession();
    let deletedCourse: ICourse | null = null;
    const imagesToDelete: string[] = [];

    try {
      await session.withTransaction(async () => {
        const course = await Course.findById(courseObjectId).session(session).populate('subject_id');
        if (!course) {
          // nothing to delete
          deletedCourse = null;
          return;
        }

        // collect the course image for deletion after commit
        if (course.course_img) imagesToDelete.push(course.course_img);

        const courseModules = await Module.find({ course_id: courseObjectId }).select('_id').session(session);
        const moduleIds = courseModules.map((moduleItem) => moduleItem._id);

        if (moduleIds.length > 0) {
          const [courseChapters, courseQuestions] = await Promise.all([
            Chapter.find({ module_id: { $in: moduleIds } }).select('_id content').session(session),
            Question.find({ module_id: { $in: moduleIds } }).select('_id').session(session),
          ]);

          const chapterIds = courseChapters.map((chapter) => chapter._id);
          const questionIds = courseQuestions.map((question) => question._id);

          const [testQuestions, shortAnswerQuestions, fillInTheBlankQuestions] = await Promise.all([
            TestQuestion.find({ module_id: { $in: moduleIds } }).select('question_img').session(session),
            ShortAnswerQuestion.find({ module_id: { $in: moduleIds } }).select('question_img').session(session),
            FillInTheBlankQuestion.find({ module_id: { $in: moduleIds } }).select('question_img').session(session),
          ]);

          // collect images from chapters and question types for deletion after commit
          imagesToDelete.push(...courseChapters.map((c) => c.content).filter(isPresentString));
          imagesToDelete.push(...testQuestions.map((q) => q.question_img).filter(isPresentString));
          imagesToDelete.push(...shortAnswerQuestions.map((q) => q.question_img).filter(isPresentString));
          imagesToDelete.push(...fillInTheBlankQuestions.map((q) => q.question_img).filter(isPresentString));

          await Promise.all([
            chapterIds.length > 0
              ? ChapterProgress.deleteMany({ chapter_id: { $in: chapterIds } }).session(session as any)
              : Promise.resolve(),
            questionIds.length > 0
              ? QuestionProgress.deleteMany({ question_id: { $in: questionIds } }).session(session as any)
              : Promise.resolve(),
            TestQuestion.deleteMany({ module_id: { $in: moduleIds } }).session(session as any),
            ShortAnswerQuestion.deleteMany({ module_id: { $in: moduleIds } }).session(session as any),
            FillInTheBlankQuestion.deleteMany({ module_id: { $in: moduleIds } }).session(session as any),
            Question.deleteMany({ module_id: { $in: moduleIds } }).session(session as any),
            Chapter.deleteMany({ module_id: { $in: moduleIds } }).session(session as any),
            Module.deleteMany({ course_id: courseObjectId }).session(session as any),
          ]);
        }

        await Promise.all([
          CourseProgress.deleteMany({ course_id: courseObjectId }).session(session as any),
          Course.findByIdAndDelete(courseObjectId).session(session as any),
        ]);

        // store deleted course to return after commit
        deletedCourse = course as ICourse;
      });
    } finally {
      session.endSession();
    }

    // After transaction commit, perform external image deletions. Failures here are logged
    // but do not roll back the DB transaction (transaction already committed).
    if (deletedCourse) {
      try {
        await deleteSupabaseImages(...imagesToDelete);
      } catch (err) {
        console.error('Error deleting course-related images after commit for course', id, err);
      }
    }

    return deletedCourse;
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
