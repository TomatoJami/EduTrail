import mongoose from 'mongoose';
import { ISubject, Subject } from '../models/Subject';
import { Course } from '../models/Course';
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

/** Defines the TypeScript shape for subject payload. */
export interface SubjectPayload {
  subject_name: string;
  subject_img: string;
}

// Owns subject persistence and image cleanup when subjects change or are deleted.
export class SubjectService {
  /** Handles the get all subjects request flow. */
  async getAllSubjects(): Promise<ISubject[]> {
    // Reads all subjects for public selection and admin management.
    return Subject.find().sort({ createdAt: -1 });
  }

  /** Handles the create subject request flow. */
  async createSubject(payload: SubjectPayload): Promise<ISubject> {
    // Persists a new subject document.
    const subject = new Subject(payload);
    await subject.save();
    return subject;
  }

  /** Handles the update subject request flow. */
  async updateSubject(id: string, payload: Partial<SubjectPayload>): Promise<ISubject | null> {
    if (!mongoose.isValidObjectId(id)) {
      throw new Error('Invalid subject id');
    }

    const previousSubject = await Subject.findById(id);
    if (!previousSubject) {
      return null;
    }

    const updatedSubject = await Subject.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });

    if (payload.subject_img !== undefined) {
      await deleteRemovedSupabaseImages(previousSubject.subject_img, payload.subject_img);
    }

    return updatedSubject;
  }

  /** Handles the delete subject request flow. */
  async deleteSubject(id: string): Promise<ISubject | null> {
    if (!mongoose.isValidObjectId(id)) {
      throw new Error('Invalid subject id');
    }
    const subjectObjectId = new mongoose.Types.ObjectId(id);
    const subject = await Subject.findById(subjectObjectId);
    if (!subject) {
      return null;
    }

    const courses = await Course.find({ subject_id: subjectObjectId }).select('_id');
    const courseIds = courses.map((c) => c._id);

    const session = await mongoose.startSession();
    let deletedSubject: ISubject | null = null;
    const imagesToDelete: string[] = [];

    try {
      await session.withTransaction(async () => {
        // collect subject image
        if (subject.subject_img) imagesToDelete.push(subject.subject_img);

        // find modules for all courses in this subject
        const modules = await Module.find({ course_id: { $in: courseIds } }).select('_id').session(session);
        const moduleIds = modules.map((m) => m._id);

        if (moduleIds.length > 0) {
          const [chapters, questions] = await Promise.all([
            Chapter.find({ module_id: { $in: moduleIds } }).select('_id content').session(session),
            Question.find({ module_id: { $in: moduleIds } }).select('_id').session(session),
          ]);

          const chapterIds = chapters.map((ch) => ch._id);
          const questionIds = questions.map((q) => q._id);

          const [testQuestions, shortAnswerQuestions, fillInTheBlankQuestions] = await Promise.all([
            TestQuestion.find({ module_id: { $in: moduleIds } }).select('question_img').session(session),
            ShortAnswerQuestion.find({ module_id: { $in: moduleIds } }).select('question_img').session(session),
            FillInTheBlankQuestion.find({ module_id: { $in: moduleIds } }).select('question_img').session(session),
          ]);

          imagesToDelete.push(...chapters.map((c) => c.content).filter((v): v is string => Boolean(v)));
          imagesToDelete.push(...testQuestions.map((q) => q.question_img).filter((v): v is string => Boolean(v)));
          imagesToDelete.push(...shortAnswerQuestions.map((q) => q.question_img).filter((v): v is string => Boolean(v)));
          imagesToDelete.push(...fillInTheBlankQuestions.map((q) => q.question_img).filter((v): v is string => Boolean(v)));

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
            Module.deleteMany({ course_id: { $in: courseIds } }).session(session as any),
          ]);
        }

        await Promise.all([
          CourseProgress.deleteMany({ course_id: { $in: courseIds } }).session(session as any),
          Course.deleteMany({ _id: { $in: courseIds } }).session(session as any),
        ]);

        // delete subject
        deletedSubject = await Subject.findByIdAndDelete(subjectObjectId).session(session as any);
      });
    } finally {
      session.endSession();
    }

    if (deletedSubject) {
      try {
        await deleteSupabaseImages(...imagesToDelete);
      } catch (err) {
        console.error('Error deleting subject-related images after commit for subject', id, err);
      }
    }

    return deletedSubject;
  }

  /** Handles the get subject by id request flow. */
  async getSubjectById(id: string): Promise<ISubject | null> {
    // Reads one subject for detail/edit views.
    if (!mongoose.isValidObjectId(id)) {
      throw new Error('Invalid subject id');
    }

    return Subject.findById(id);
  }
}

export const subjectService = new SubjectService();
