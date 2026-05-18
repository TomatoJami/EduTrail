import mongoose from 'mongoose';
import { ISubject, Subject } from '../models/Subject';
import { Course } from '../models/Course';
import { courseService } from './courseService';
import { deleteRemovedSupabaseImages, deleteSupabaseImages } from './storageCleanupService';

export interface SubjectPayload {
  subject_name: string;
  subject_img: string;
}

// Owns subject persistence and image cleanup when subjects change or are deleted.
export class SubjectService {
  async getAllSubjects(): Promise<ISubject[]> {
    // Reads all subjects for public selection and admin management.
    return Subject.find().sort({ createdAt: -1 });
  }

  async createSubject(payload: SubjectPayload): Promise<ISubject> {
    // Persists a new subject document.
    const subject = new Subject(payload);
    await subject.save();
    return subject;
  }

  async updateSubject(id: string, payload: Partial<SubjectPayload>): Promise<ISubject | null> {
    // Updates subject fields and deletes the previous image when it was replaced.
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

  async deleteSubject(id: string): Promise<ISubject | null> {
    // Deletes the subject and any Supabase image referenced by subject_img.
    if (!mongoose.isValidObjectId(id)) {
      throw new Error('Invalid subject id');
    }

    const subjectObjectId = new mongoose.Types.ObjectId(id);
    const subject = await Subject.findById(subjectObjectId);
    if (!subject) {
      return null;
    }

    const courses = await Course.find({ subject_id: subjectObjectId }).select('_id');

    // Delete each course through CourseService so modules, chapters, questions, and progress are also removed.
    await Promise.all(
      courses.map((course) => courseService.deleteCourse(String(course._id)))
    );

    const deletedSubject = await Subject.findByIdAndDelete(subjectObjectId);

    if (deletedSubject) {
      await deleteSupabaseImages(deletedSubject.subject_img);
    }

    return deletedSubject;
  }

  async getSubjectById(id: string): Promise<ISubject | null> {
    // Reads one subject for detail/edit views.
    if (!mongoose.isValidObjectId(id)) {
      throw new Error('Invalid subject id');
    }

    return Subject.findById(id);
  }
}

export const subjectService = new SubjectService();
