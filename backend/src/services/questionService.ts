import mongoose from 'mongoose';
import { Question, IQuestion } from '../models/Question';
import { TestQuestion, ITestQuestion } from '../models/TestQuestion';
import { ShortAnswerQuestion, IShortAnswerQuestion } from '../models/ShortAnswerQuestion';
import { FillInTheBlankQuestion, IFillInTheBlankQuestion } from '../models/FillInTheBlankQuestion';
import { QuestionType, TestQuestion as TestQuestionType, ShortAnswerQuestion as ShortAnswerQuestionType, FillInTheBlankQuestion as FillInTheBlankQuestionType } from '../types';

export interface CreateTestQuestionPayload {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  module_id: string;
}

export interface CreateShortAnswerPayload {
  question: string;
  correctAnswers: string[];
  explanation?: string;
  caseSensitive?: boolean;
  module_id: string;
}

export interface CreateFillBlankPayload {
  questionText: string;
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
    
    console.log(`[getQuestionsByModuleId] Found ${questions.length} wrapper questions`);
    
    // If no wrapper questions found, migrate existing type-specific questions
    if (questions.length === 0) {
      console.log(`[getQuestionsByModuleId] No wrapper questions, migrating...`);
      await this.migrateQuestionsForModule(moduleId);
      questions = await Question.find({ module_id: moduleId }).sort({ createdAt: 1 });
      console.log(`[getQuestionsByModuleId] After migration: ${questions.length} wrapper questions`);
    }
    
    const result = [];
    for (const q of questions) {
      const typeData = await this.populateTypeData(q);
      console.log(`[getQuestionsByModuleId] Question ${q._id}, type: ${q.type}, data:`, typeData);
      if (typeData) {
        const typeDataObj = typeData.toObject ? typeData.toObject() : typeData;
        result.push({
          ...typeDataObj,
          _id: q._id.toString(),
          type: q.type,
        });
      }
    }
    console.log(`[getQuestionsByModuleId] Returning ${result.length} questions`);
    return result;
  }

  private async migrateQuestionsForModule(moduleId: string): Promise<void> {
    try {
      console.log(`[migrateQuestionsForModule] Starting migration for module ${moduleId}`);
      
      // Find all TestQuestions in this module
      const testQuestions = await TestQuestion.find({ module_id: moduleId });
      console.log(`[migrateQuestionsForModule] Found ${testQuestions.length} TestQuestions`);
      
      for (const tq of testQuestions) {
        const existing = await Question.findOne({ typeId: tq._id });
        if (!existing) {
          const question = new Question({
            module_id: new mongoose.Types.ObjectId(moduleId),
            type: 'test',
            typeId: tq._id,
          });
          await question.save();
          console.log(`[migrateQuestionsForModule] Created wrapper for TestQuestion ${tq._id}`);
        }
      }

      // Find all ShortAnswerQuestions in this module
      const shortAnswerQuestions = await ShortAnswerQuestion.find({ module_id: moduleId });
      console.log(`[migrateQuestionsForModule] Found ${shortAnswerQuestions.length} ShortAnswerQuestions`);
      
      for (const saq of shortAnswerQuestions) {
        const existing = await Question.findOne({ typeId: saq._id });
        if (!existing) {
          const question = new Question({
            module_id: new mongoose.Types.ObjectId(moduleId),
            type: 'short-answer',
            typeId: saq._id,
          });
          await question.save();
          console.log(`[migrateQuestionsForModule] Created wrapper for ShortAnswerQuestion ${saq._id}`);
        }
      }

      // Find all FillInTheBlankQuestions in this module
      const fillBlankQuestions = await FillInTheBlankQuestion.find({ module_id: moduleId });
      console.log(`[migrateQuestionsForModule] Found ${fillBlankQuestions.length} FillInTheBlankQuestions`);
      
      for (const fbq of fillBlankQuestions) {
        const existing = await Question.findOne({ typeId: fbq._id });
        if (!existing) {
          const question = new Question({
            module_id: new mongoose.Types.ObjectId(moduleId),
            type: 'fill-blank',
            typeId: fbq._id,
          });
          await question.save();
          console.log(`[migrateQuestionsForModule] Created wrapper for FillInTheBlankQuestion ${fbq._id}`);
        }
      }
      
      console.log(`[migrateQuestionsForModule] Migration completed for module ${moduleId}`);
    } catch (error) {
      console.error('[migrateQuestionsForModule] Migration error:', error);
    }
  }

  private async populateTypeData(question: any): Promise<any> {
    try {
      if (question.type === 'test') {
        const data = await TestQuestion.findById(question.typeId);
        console.log(`[populateTypeData] TestQuestion ${question.typeId}:`, data?.toObject ? data.toObject() : data);
        return data;
      } else if (question.type === 'short-answer') {
        const data = await ShortAnswerQuestion.findById(question.typeId);
        console.log(`[populateTypeData] ShortAnswerQuestion ${question.typeId}:`, data?.toObject ? data.toObject() : data);
        return data;
      } else if (question.type === 'fill-blank') {
        const data = await FillInTheBlankQuestion.findById(question.typeId);
        console.log(`[populateTypeData] FillInTheBlankQuestion ${question.typeId}:`, data?.toObject ? data.toObject() : data);
        return data;
      }
    } catch (error) {
      console.error(`[populateTypeData] Error for question ${question._id}:`, error);
    }
    return null;
  }

  // Test Question methods
  async createTestQuestion(payload: CreateTestQuestionPayload): Promise<ITestQuestion> {
    if (!mongoose.isValidObjectId(payload.module_id)) {
      throw new Error('Invalid module id');
    }

    const testQuestion = new TestQuestion({
      module_id: new mongoose.Types.ObjectId(payload.module_id),
      question: payload.question,
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
    return testQuestion;
  }

  // Short Answer Question methods
  async createShortAnswerQuestion(payload: CreateShortAnswerPayload): Promise<IShortAnswerQuestion> {
    if (!mongoose.isValidObjectId(payload.module_id)) {
      throw new Error('Invalid module id');
    }

    const shortAnswerQuestion = new ShortAnswerQuestion({
      module_id: new mongoose.Types.ObjectId(payload.module_id),
      question: payload.question,
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
    return shortAnswerQuestion;
  }

  // Fill in the blank Question methods
  async createFillBlankQuestion(payload: CreateFillBlankPayload): Promise<IFillInTheBlankQuestion> {
    if (!mongoose.isValidObjectId(payload.module_id)) {
      throw new Error('Invalid module id');
    }

    const fillBlankQuestion = new FillInTheBlankQuestion({
      module_id: new mongoose.Types.ObjectId(payload.module_id),
      questionText: payload.questionText,
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
    return fillBlankQuestion;
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
    if (payload.blanks) updateData.blanks = payload.blanks;
    if (payload.explanation !== undefined) updateData.explanation = payload.explanation;

    return FillInTheBlankQuestion.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  }
}

export const questionService = new QuestionService();
