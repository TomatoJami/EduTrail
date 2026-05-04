import mongoose from 'mongoose';
import { Question, IQuestion } from '../models/Question';

export interface QuestionPayload {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  module_id: string;
}

export class QuestionService {
  async getAllQuestions(): Promise<IQuestion[]> {
    return Question.find().populate('module_id').sort({ order: 1 });
  }

  async getQuestionsByModuleId(moduleId: string): Promise<IQuestion[]> {
    if (!mongoose.isValidObjectId(moduleId)) {
      throw new Error('Invalid module id');
    }
    return Question.find({ module_id: moduleId }).populate('module_id').sort({ order: 1 });
  }

  async createQuestion(payload: QuestionPayload): Promise<IQuestion> {
    const moduleId = new mongoose.Types.ObjectId(payload.module_id);

    const question = new Question({
      ...payload,
      module_id: moduleId,
    });

    await question.save();
    return question.populate('module_id');
  }

  async updateQuestion(id: string, payload: Partial<QuestionPayload>): Promise<IQuestion | null> {
    if (!mongoose.isValidObjectId(id)) {
      throw new Error('Invalid question id');
    }

    const nextPayload: Record<string, unknown> = { ...payload };

    if (payload.module_id) {
      if (!mongoose.isValidObjectId(payload.module_id)) {
        throw new Error('Invalid module id');
      }
      nextPayload.module_id = new mongoose.Types.ObjectId(payload.module_id);
    }

    return Question.findByIdAndUpdate(id, nextPayload, {
      new: true,
      runValidators: true,
    }).populate('module_id');
  }

  async deleteQuestion(id: string): Promise<IQuestion | null> {
    if (!mongoose.isValidObjectId(id)) {
      throw new Error('Invalid question id');
    }

    return Question.findByIdAndDelete(id);
  }

  async getQuestionById(id: string): Promise<IQuestion | null> {
    if (!mongoose.isValidObjectId(id)) {
      throw new Error('Invalid question id');
    }

    return Question.findById(id).populate('module_id');
  }
}

export const questionService = new QuestionService();
