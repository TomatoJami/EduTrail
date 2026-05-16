import mongoose from 'mongoose';
import { ISubject, Subject } from '../models/Subject';
import { Course } from '../models/Course';
import { courseService } from './courseService';

export interface SubjectPayload {
  subject_name: string;
  subject_img: string;
}

export class SubjectService {
  async getAllSubjects(): Promise<ISubject[]> {
    return Subject.find().sort({ createdAt: -1 });
  }

  async createSubject(payload: SubjectPayload): Promise<ISubject> {
    const subject = new Subject(payload);
    await subject.save();
    return subject;
  }

  async updateSubject(id: string, payload: Partial<SubjectPayload>): Promise<ISubject | null> {
    if (!mongoose.isValidObjectId(id)) {
      throw new Error('Invalid subject id');
    }

    return Subject.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });
  }

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

    // Delete each course through CourseService so modules, chapters, questions, and progress are also removed.
    await Promise.all(
      courses.map((course) => courseService.deleteCourse(String(course._id)))
    );

    return Subject.findByIdAndDelete(subjectObjectId);
  }

  async getSubjectById(id: string): Promise<ISubject | null> {
    if (!mongoose.isValidObjectId(id)) {
      throw new Error('Invalid subject id');
    }

    return Subject.findById(id);
  }
}

export const subjectService = new SubjectService();
