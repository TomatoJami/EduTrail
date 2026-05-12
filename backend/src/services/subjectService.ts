import mongoose from 'mongoose';
import { ISubject, Subject } from '../models/Subject';
import { Course } from '../models/Course';

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

    await Course.deleteMany({ subject_id: new mongoose.Types.ObjectId(id) });

    return Subject.findByIdAndDelete(id);
  }

  async getSubjectById(id: string): Promise<ISubject | null> {
    if (!mongoose.isValidObjectId(id)) {
      throw new Error('Invalid subject id');
    }

    return Subject.findById(id);
  }
}

export const subjectService = new SubjectService();
