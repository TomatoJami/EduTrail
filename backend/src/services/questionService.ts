import mongoose from 'mongoose';
import { Question, IQuestion } from '../models/Question';
import { TestQuestion, ITestQuestion } from '../models/TestQuestion';
import { ShortAnswerQuestion, IShortAnswerQuestion } from '../models/ShortAnswerQuestion';
import { FillInTheBlankQuestion, IFillInTheBlankQuestion } from '../models/FillInTheBlankQuestion';
import { QuestionType, TestQuestion as TestQuestionType, ShortAnswerQuestion as ShortAnswerQuestionType, FillInTheBlankQuestion as FillInTheBlankQuestionType } from '../types';

export interface CreateTestQuestionPayload {
  question: string;
  question_img?: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  module_id: string;
}

export interface CreateShortAnswerPayload {
  question: string;
  question_img?: string;
  correctAnswers: string[];
  explanation?: string;
  caseSensitive?: boolean;
  module_id: string;
}

export interface CreateFillBlankPayload {
  questionText: string;
  question_img?: string;
  blanks: Array<{ blankId: string; correctAnswers: string[]; caseSensitive?: boolean }>;
  explanation?: string;
  module_id: string;
}

export class QuestionService {
  async getAllQuestions(): Promise<any[]> {
    const questions = await Question.find();
    
    const result = [];
    for (const q of questions) {
      const typeData = await this.populateTypeData(q);
      if (typeData) {
        const typeDataObj = typeData.toObject ? typeData.toObject() : typeData;
        result.push({
          ...typeDataObj,
          _id: q._id.toString(),
          type: q.type,
        });
      }
    }
    return result;
  }

  async getQuestionsByModuleId(moduleId: string): Promise<any[]> {
    if (!mongoose.isValidObjectId(moduleId)) {
      throw new Error('Invalid module id');
    }
    
    // First, try to get wrapper questions
    let questions = await Question.find({ module_id: moduleId }).sort({ createdAt: 1 });
    
    // If no wrapper questions found, migrate existing type-specific questions
    if (questions.length === 0) {
      await this.migrateQuestionsForModule(moduleId);
      questions = await Question.find({ module_id: moduleId }).sort({ createdAt: 1 });
    }
    
    const result = [];
    for (const q of questions) {
      const typeData = await this.populateTypeData(q);
      if (typeData) {
        const typeDataObj = typeData.toObject ? typeData.toObject() : typeData;
        result.push({
          ...typeDataObj,
          _id: q._id.toString(),
          type: q.type,
        });
      }
    }
    return result;
  }

  private async migrateQuestionsForModule(moduleId: string): Promise<void> {
    try {
      
      // Find all TestQuestions in this module
      const testQuestions = await TestQuestion.find({ module_id: moduleId });
      
      for (const tq of testQuestions) {
        const existing = await Question.findOne({ typeId: tq._id });
        if (!existing) {
          const question = new Question({
            module_id: new mongoose.Types.ObjectId(moduleId),
            type: 'test',
            typeId: tq._id,
          });
          await question.save();
        }
      }

      // Find all ShortAnswerQuestions in this module
      const shortAnswerQuestions = await ShortAnswerQuestion.find({ module_id: moduleId });
      
      for (const saq of shortAnswerQuestions) {
        const existing = await Question.findOne({ typeId: saq._id });
        if (!existing) {
          const question = new Question({
            module_id: new mongoose.Types.ObjectId(moduleId),
            type: 'short-answer',
            typeId: saq._id,
          });
          await question.save();
        }
      }

      // Find all FillInTheBlankQuestions in this module
      const fillBlankQuestions = await FillInTheBlankQuestion.find({ module_id: moduleId });
      
      for (const fbq of fillBlankQuestions) {
        const existing = await Question.findOne({ typeId: fbq._id });
        if (!existing) {
          const question = new Question({
            module_id: new mongoose.Types.ObjectId(moduleId),
            type: 'fill-blank',
            typeId: fbq._id,
          });
          await question.save();
        }
      }
    } catch (error) {
    }
  }

  private async populateTypeData(question: any): Promise<any> {
    try {
      if (question.type === 'test') {
        const data = await TestQuestion.findById(question.typeId);
        return data;
      } else if (question.type === 'short-answer') {
        const data = await ShortAnswerQuestion.findById(question.typeId);
        return data;
      } else if (question.type === 'fill-blank') {
        const data = await FillInTheBlankQuestion.findById(question.typeId);
        return data;
      }
    } catch (error) {
    }
    return null;
  }

  // Test Question methods
  async createTestQuestion(payload: CreateTestQuestionPayload): Promise<any> {
    if (!mongoose.isValidObjectId(payload.module_id)) {
      throw new Error('Invalid module id');
    }

    const testQuestion = new TestQuestion({
      module_id: new mongoose.Types.ObjectId(payload.module_id),
      question: payload.question,
      question_img: payload.question_img || '',
      options: payload.options,
      correctAnswer: payload.correctAnswer,
      explanation: payload.explanation,
    });

    await testQuestion.save();

    const question = new Question({
      module_id: new mongoose.Types.ObjectId(payload.module_id),
      type: 'test',
      typeId: testQuestion._id,
    });

    await question.save();
    return {
      ...(testQuestion.toObject ? testQuestion.toObject() : testQuestion),
      _id: question._id.toString(),
      type: 'test',
    };
  }

  // Short Answer Question methods
  async createShortAnswerQuestion(payload: CreateShortAnswerPayload): Promise<any> {
    if (!mongoose.isValidObjectId(payload.module_id)) {
      throw new Error('Invalid module id');
    }

    const shortAnswerQuestion = new ShortAnswerQuestion({
      module_id: new mongoose.Types.ObjectId(payload.module_id),
      question: payload.question,
      question_img: payload.question_img || '',
      correctAnswers: payload.correctAnswers,
      explanation: payload.explanation,
      caseSensitive: payload.caseSensitive || false,
    });

    await shortAnswerQuestion.save();

    const question = new Question({
      module_id: new mongoose.Types.ObjectId(payload.module_id),
      type: 'short-answer',
      typeId: shortAnswerQuestion._id,
    });

    await question.save();
    return {
      ...(shortAnswerQuestion.toObject ? shortAnswerQuestion.toObject() : shortAnswerQuestion),
      _id: question._id.toString(),
      type: 'short-answer',
    };
  }

  // Fill in the blank Question methods
  async createFillBlankQuestion(payload: CreateFillBlankPayload): Promise<any> {
    if (!mongoose.isValidObjectId(payload.module_id)) {
      throw new Error('Invalid module id');
    }

    const fillBlankQuestion = new FillInTheBlankQuestion({
      module_id: new mongoose.Types.ObjectId(payload.module_id),
      questionText: payload.questionText,
      question_img: payload.question_img || '',
      blanks: payload.blanks,
      explanation: payload.explanation,
    });

    await fillBlankQuestion.save();

    const question = new Question({
      module_id: new mongoose.Types.ObjectId(payload.module_id),
      type: 'fill-blank',
      typeId: fillBlankQuestion._id,
    });

    await question.save();
    return {
      ...(fillBlankQuestion.toObject ? fillBlankQuestion.toObject() : fillBlankQuestion),
      _id: question._id.toString(),
      type: 'fill-blank',
    };
  }

  async getQuestionById(id: string): Promise<any> {
    if (!mongoose.isValidObjectId(id)) {
      throw new Error('Invalid question id');
    }

    const question = await Question.findById(id);
    if (!question) return null;
    
    const typeData = await this.populateTypeData(question);
    if (!typeData) return null;
    
    const typeDataObj = typeData.toObject ? typeData.toObject() : typeData;
    return {
      ...typeDataObj,
      _id: question._id.toString(),
      type: question.type,
    } as any;
  }

  async deleteQuestion(id: string): Promise<void> {
    if (!mongoose.isValidObjectId(id)) {
      throw new Error('Invalid question id');
    }

    const question = await Question.findById(id);
    if (!question) {
      throw new Error('Question not found');
    }

    // Delete the specific type question
    if (question.type === 'test') {
      await TestQuestion.findByIdAndDelete(question.typeId);
    } else if (question.type === 'short-answer') {
      await ShortAnswerQuestion.findByIdAndDelete(question.typeId);
    } else if (question.type === 'fill-blank') {
      await FillInTheBlankQuestion.findByIdAndDelete(question.typeId);
    }

    // Delete the base question
    await Question.findByIdAndDelete(id);
  }

  async updateQuestion(id: string, payload: Partial<CreateTestQuestionPayload & CreateShortAnswerPayload & CreateFillBlankPayload & { type: string }>): Promise<any | null> {
    if (!mongoose.isValidObjectId(id)) {
      throw new Error('Invalid question id');
    }

    const question = await Question.findById(id);
    if (!question) {
      return null;
    }

    let typeData = null;

    if (question.type === 'test') {
      typeData = await this.updateTestQuestion(String(question.typeId), payload);
    } else if (question.type === 'short-answer') {
      typeData = await this.updateShortAnswerQuestion(String(question.typeId), payload);
    } else if (question.type === 'fill-blank') {
      typeData = await this.updateFillBlankQuestion(String(question.typeId), payload);
    }

    if (!typeData) {
      return null;
    }

    const typeDataObj = typeData.toObject ? typeData.toObject() : typeData;
    return {
      ...typeDataObj,
      _id: question._id.toString(),
      type: question.type,
    };
  }

  async updateTestQuestion(id: string, payload: Partial<CreateTestQuestionPayload>): Promise<ITestQuestion | null> {
    if (!mongoose.isValidObjectId(id)) {
      throw new Error('Invalid question id');
    }

    const updateData: any = {};
    if (payload.question) updateData.question = payload.question;
    if (payload.question_img !== undefined) updateData.question_img = payload.question_img;
    if (payload.options) updateData.options = payload.options;
    if (payload.correctAnswer !== undefined) updateData.correctAnswer = payload.correctAnswer;
    if (payload.explanation !== undefined) updateData.explanation = payload.explanation;

    return TestQuestion.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  }

  async updateShortAnswerQuestion(id: string, payload: Partial<CreateShortAnswerPayload>): Promise<IShortAnswerQuestion | null> {
    if (!mongoose.isValidObjectId(id)) {
      throw new Error('Invalid question id');
    }

    const updateData: any = {};
    if (payload.question) updateData.question = payload.question;
    if (payload.question_img !== undefined) updateData.question_img = payload.question_img;
    if (payload.correctAnswers) updateData.correctAnswers = payload.correctAnswers;
    if (payload.explanation !== undefined) updateData.explanation = payload.explanation;
    if (payload.caseSensitive !== undefined) updateData.caseSensitive = payload.caseSensitive;

    return ShortAnswerQuestion.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  }

  async updateFillBlankQuestion(id: string, payload: Partial<CreateFillBlankPayload>): Promise<IFillInTheBlankQuestion | null> {
    if (!mongoose.isValidObjectId(id)) {
      throw new Error('Invalid question id');
    }

    const updateData: any = {};
    if (payload.questionText) updateData.questionText = payload.questionText;
    if (payload.question_img !== undefined) updateData.question_img = payload.question_img;
    if (payload.blanks) updateData.blanks = payload.blanks;
    if (payload.explanation !== undefined) updateData.explanation = payload.explanation;

    return FillInTheBlankQuestion.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  }
}

export const questionService = new QuestionService();
