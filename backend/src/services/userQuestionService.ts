import mongoose from 'mongoose';
import { UserQuestion, IUserQuestion } from '../models/UserQuestion';

export interface UserQuestionPayload {
  user_id: string;
  question_id: string;
  is_completed?: boolean;
}

export class UserQuestionService {
  async getUserQuestion(userId: string, questionId: string): Promise<IUserQuestion | null> {
    if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(questionId)) {
      throw new Error('Invalid user id or question id');
    }

    return UserQuestion.findOne({
      user_id: new mongoose.Types.ObjectId(userId),
      question_id: new mongoose.Types.ObjectId(questionId),
    }).populate(['user_id', 'question_id']);
  }

  async getUserQuestions(userId: string): Promise<IUserQuestion[]> {
    if (!mongoose.isValidObjectId(userId)) {
      throw new Error('Invalid user id');
    }

    return UserQuestion.find({
      user_id: new mongoose.Types.ObjectId(userId),
    }).populate(['user_id', 'question_id']);
  }

  async getUserQuestionsByModule(userId: string, moduleId: string): Promise<IUserQuestion[]> {
    if (!mongoose.isValidObjectId(userId)) {
      throw new Error('Invalid user id');
    }

    // This will be used to get all questions in a module and their completion status
    // We need to get questions by module_id first, then check their completion
    const Question = require('../models/Question').Question;
    
    const questions = await Question.find({ module_id: new mongoose.Types.ObjectId(moduleId) });
    const questionIds = questions.map((q: any) => q._id);

    if (questionIds.length === 0) {
      return [];
    }

    return UserQuestion.find({
      user_id: new mongoose.Types.ObjectId(userId),
      question_id: { $in: questionIds },
    }).populate(['user_id', 'question_id']);
  }

  async createOrUpdateUserQuestion(payload: UserQuestionPayload): Promise<IUserQuestion> {
    if (!mongoose.isValidObjectId(payload.user_id) || !mongoose.isValidObjectId(payload.question_id)) {
      throw new Error('Invalid user id or question id');
    }

    const userId = new mongoose.Types.ObjectId(payload.user_id);
    const questionId = new mongoose.Types.ObjectId(payload.question_id);

    let userQuestion = await UserQuestion.findOne({
      user_id: userId,
      question_id: questionId,
    });

    if (userQuestion) {
      // Update existing record
      if (payload.is_completed !== undefined) {
        userQuestion.is_completed = payload.is_completed;
      }
      await userQuestion.save();
    } else {
      // Create new record
      userQuestion = new UserQuestion({
        user_id: userId,
        question_id: questionId,
        is_completed: payload.is_completed ?? false,
      });
      await userQuestion.save();
    }

    return userQuestion.populate(['user_id', 'question_id']);
  }

  async markQuestionCompleted(userId: string, questionId: string, completed: boolean): Promise<IUserQuestion | null> {
    if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(questionId)) {
      throw new Error('Invalid user id or question id');
    }

    return UserQuestion.findOneAndUpdate(
      {
        user_id: new mongoose.Types.ObjectId(userId),
        question_id: new mongoose.Types.ObjectId(questionId),
      },
      { is_completed: completed },
      { new: true }
    ).populate(['user_id', 'question_id']);
  }

  async deleteUserQuestion(userId: string, questionId: string): Promise<IUserQuestion | null> {
    if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(questionId)) {
      throw new Error('Invalid user id or question id');
    }

    return UserQuestion.findOneAndDelete({
      user_id: new mongoose.Types.ObjectId(userId),
      question_id: new mongoose.Types.ObjectId(questionId),
    });
  }
}

export const userQuestionService = new UserQuestionService();
