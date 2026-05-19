import mongoose from 'mongoose';
import { Question } from '../models/Question';
import { TestQuestion, ITestQuestion } from '../models/TestQuestion';
import { ShortAnswerQuestion, IShortAnswerQuestion } from '../models/ShortAnswerQuestion';
import { FillInTheBlankQuestion, IFillInTheBlankQuestion } from '../models/FillInTheBlankQuestion';
import { deleteRemovedSupabaseImages, deleteSupabaseImages } from './storageCleanupService';

/** Defines the TypeScript shape for create test question payload. */
export interface CreateTestQuestionPayload {
  question: string;
  question_img?: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  module_id: string;
}

/** Defines the TypeScript shape for create short answer payload. */
export interface CreateShortAnswerPayload {
  question: string;
  question_img?: string;
  correctAnswers: string[];
  explanation?: string;
  caseSensitive?: boolean;
  module_id: string;
}

/** Defines the TypeScript shape for create fill blank payload. */
export interface CreateFillBlankPayload {
  questionText: string;
  question_img?: string;
  blanks: Array<{ blankId: string; correctAnswers: string[]; caseSensitive?: boolean }>;
  explanation?: string;
  module_id: string;
}

/** Defines the TypeScript shape for update question payload. */
type UpdateQuestionPayload = Partial<
  CreateTestQuestionPayload &
  CreateShortAnswerPayload &
  CreateFillBlankPayload & { type: string }
>;

export interface GradeAnswerPayload {
  questionId: string;
  answer: unknown;
}

export interface GradeQuestionResult {
  questionId: string;
  isCorrect: boolean;
  correctAnswer?: number;
  correctAnswers?: string[];
  blanks?: Array<{ blankId: string; correctAnswers: string[]; caseSensitive?: boolean }>;
  explanation?: string;
}

export interface GradeQuizResult {
  score: number;
  total: number;
  results: GradeQuestionResult[];
}

/** Removes answer keys from learner-facing question DTOs. */
function stripAnswerFields(question: Record<string, any>, type: string) {
  const sanitized = { ...question };

  delete sanitized.correctAnswer;
  delete sanitized.correctAnswers;

  if (type === 'fill-blank' && Array.isArray(sanitized.blanks)) {
    sanitized.blanks = sanitized.blanks.map((blank: Record<string, any>) => {
      const { correctAnswers: _correctAnswers, ...publicBlank } = blank;
      return publicBlank;
    });
  }

  return sanitized;
}

// Owns question persistence across wrapper and type-specific question collections.
export class QuestionService {
  /** Handles the get all questions request flow. */
  async getAllQuestions(includeAnswers = false): Promise<any[]> {
    // Reads wrapper questions and expands each wrapper into its subtype data.
    const questions = await Question.find();
    
    const result = [];
    for (const q of questions) {
      const typeData = await this.populateTypeData(q);
      if (typeData) {
        const typeDataObj = typeData.toObject ? typeData.toObject() : typeData;
        result.push({
          ...(includeAnswers ? typeDataObj : stripAnswerFields(typeDataObj, q.type)),
          _id: q._id.toString(),
          type: q.type,
        });
      }
    }
    return result;
  }

  /** Handles the get questions by module id request flow. */
  async getQuestionsByModuleId(moduleId: string, includeAnswers = false): Promise<any[]> {
    // Reads questions for a module and lazily migrates old subtype-only records.
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
          ...(includeAnswers ? typeDataObj : stripAnswerFields(typeDataObj, q.type)),
          _id: q._id.toString(),
          type: q.type,
        });
      }
    }
    return result;
  }

  /** Handles the migrate questions for module request flow. */
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
    } catch (err) {
      console.error('Error migrating questions for module', moduleId, err);
      // Do not rethrow to preserve existing lazy-migration behavior, but surface to logs
    }
  }

  /** Handles the populate type data request flow. */
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
    } catch (err) {
      console.error('Error populating type data for question', question._id, err);
    }
    return null;
  }

  // Test Question methods
  async createTestQuestion(payload: CreateTestQuestionPayload): Promise<any> {
    if (!mongoose.isValidObjectId(payload.module_id)) {
      throw new Error('Invalid module id');
    }

    if (
      !Number.isInteger(payload.correctAnswer) ||
      payload.correctAnswer < 0 ||
      payload.correctAnswer >= payload.options.length
    ) {
      throw new Error('Invalid correct answer index');
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

  /** Handles the get question by id request flow. */
  async getQuestionById(id: string, includeAnswers = false): Promise<any> {
    // Reads one wrapper question and returns normalized subtype data.
    if (!mongoose.isValidObjectId(id)) {
      throw new Error('Invalid question id');
    }

    const question = await Question.findById(id);
    if (!question) return null;
    
    const typeData = await this.populateTypeData(question);
    if (!typeData) return null;
    
    const typeDataObj = typeData.toObject ? typeData.toObject() : typeData;
    return {
      ...(includeAnswers ? typeDataObj : stripAnswerFields(typeDataObj, question.type)),
      _id: question._id.toString(),
      type: question.type,
    };
  }

  /** Grades submitted quiz answers without exposing answer keys before submission. */
  async gradeQuizAnswers(answers: GradeAnswerPayload[]): Promise<GradeQuizResult> {
    if (!Array.isArray(answers) || answers.length === 0) {
      throw new Error('Answers are required');
    }

    const results: GradeQuestionResult[] = [];

    for (const submitted of answers) {
      if (!mongoose.isValidObjectId(submitted.questionId)) {
        throw new Error('Invalid question id');
      }

      const question = await Question.findById(submitted.questionId);
      if (!question) {
        throw new Error('Question not found');
      }

      const typeData = await this.populateTypeData(question);
      if (!typeData) {
        throw new Error('Question data not found');
      }

      const data = typeData.toObject ? typeData.toObject() : typeData;
      let result: GradeQuestionResult;

      if (question.type === 'test') {
        const isCorrect = submitted.answer === data.correctAnswer;
        result = {
          questionId: submitted.questionId,
          isCorrect,
          correctAnswer: data.correctAnswer,
          explanation: data.explanation,
        };
      } else if (question.type === 'short-answer') {
        const userAnswer = typeof submitted.answer === 'string' ? submitted.answer : '';
        const isCorrect = data.correctAnswers.some((answer: string) =>
          data.caseSensitive ? answer === userAnswer : answer.toLowerCase() === userAnswer.toLowerCase()
        );
        result = {
          questionId: submitted.questionId,
          isCorrect,
          correctAnswers: data.correctAnswers,
          explanation: data.explanation,
        };
      } else {
        const userAnswers = Array.isArray(submitted.answer) ? submitted.answer : [];
        const isCorrect = data.blanks.every((blank: any, index: number) => {
          const userAnswer = typeof userAnswers[index] === 'string' ? userAnswers[index] : '';
          return blank.correctAnswers.some((answer: string) =>
            blank.caseSensitive ? answer === userAnswer : answer.toLowerCase() === userAnswer.toLowerCase()
          );
        });
        result = {
          questionId: submitted.questionId,
          isCorrect,
          blanks: data.blanks,
          explanation: data.explanation,
        };
      }

      results.push(result);
    }

    return {
      score: results.filter((result) => result.isCorrect).length,
      total: results.length,
      results,
    };
  }

  /** Handles the delete question request flow. */
  async deleteQuestion(id: string): Promise<void> {
    if (!mongoose.isValidObjectId(id)) {
      throw new Error('Invalid question id');
    }
    const questionObjectId = new mongoose.Types.ObjectId(id);

    const session = await mongoose.startSession();
    const imagesToDelete: string[] = [];

    try {
      await session.withTransaction(async () => {
        const question = await Question.findById(questionObjectId).session(session);
        if (!question) {
          throw new Error('Question not found');
        }

        const typeData = await this.populateTypeData(question);
        if (typeData && typeData.question_img) imagesToDelete.push(typeData.question_img);

        // Delete type-specific document within transaction
        if (question.type === 'test') {
          await TestQuestion.findByIdAndDelete(question.typeId).session(session);
        } else if (question.type === 'short-answer') {
          await ShortAnswerQuestion.findByIdAndDelete(question.typeId).session(session);
        } else if (question.type === 'fill-blank') {
          await FillInTheBlankQuestion.findByIdAndDelete(question.typeId).session(session);
        }

        // Delete the wrapper question
        await Question.findByIdAndDelete(questionObjectId).session(session);
      });
    } finally {
      await session.endSession();
    }

    if (imagesToDelete.length > 0) {
      try {
        await deleteSupabaseImages(...imagesToDelete);
      } catch (err) {
        console.error('Error deleting question images after commit for question', id, err);
      }
    }
  }

  /** Handles the update question request flow. */
  async updateQuestion(id: string, payload: UpdateQuestionPayload): Promise<Record<string, unknown> | null> {
    // Routes an update payload to the correct subtype updater.
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

  /** Handles the update test question request flow. */
  async updateTestQuestion(id: string, payload: Partial<CreateTestQuestionPayload>): Promise<ITestQuestion | null> {
    if (!mongoose.isValidObjectId(id)) {
      throw new Error('Invalid question id');
    }

    const previousQuestion = await TestQuestion.findById(id);
    if (!previousQuestion) {
      return null;
    }

    const updateData: any = {};
    if (payload.question) updateData.question = payload.question;
    if (payload.question_img !== undefined) updateData.question_img = payload.question_img;
    if (payload.options) updateData.options = payload.options;
    if (payload.correctAnswer !== undefined) updateData.correctAnswer = payload.correctAnswer;
    if (payload.explanation !== undefined) updateData.explanation = payload.explanation;

    const updatedQuestion = await TestQuestion.findByIdAndUpdate(id, updateData, {
      returnDocument: 'after',
      runValidators: true,
    });

    if (payload.question_img !== undefined) {
      await deleteRemovedSupabaseImages(previousQuestion.question_img, payload.question_img);
    }

    return updatedQuestion;
  }

  /** Handles the update short answer question request flow. */
  async updateShortAnswerQuestion(id: string, payload: Partial<CreateShortAnswerPayload>): Promise<IShortAnswerQuestion | null> {
    if (!mongoose.isValidObjectId(id)) {
      throw new Error('Invalid question id');
    }

    const previousQuestion = await ShortAnswerQuestion.findById(id);
    if (!previousQuestion) {
      return null;
    }

    const updateData: any = {};
    if (payload.question) updateData.question = payload.question;
    if (payload.question_img !== undefined) updateData.question_img = payload.question_img;
    if (payload.correctAnswers) updateData.correctAnswers = payload.correctAnswers;
    if (payload.explanation !== undefined) updateData.explanation = payload.explanation;
    if (payload.caseSensitive !== undefined) updateData.caseSensitive = payload.caseSensitive;

    const updatedQuestion = await ShortAnswerQuestion.findByIdAndUpdate(id, updateData, {
      returnDocument: 'after',
      runValidators: true,
    });

    if (payload.question_img !== undefined) {
      await deleteRemovedSupabaseImages(previousQuestion.question_img, payload.question_img);
    }

    return updatedQuestion;
  }

  /** Handles the update fill blank question request flow. */
  async updateFillBlankQuestion(id: string, payload: Partial<CreateFillBlankPayload>): Promise<IFillInTheBlankQuestion | null> {
    if (!mongoose.isValidObjectId(id)) {
      throw new Error('Invalid question id');
    }

    const previousQuestion = await FillInTheBlankQuestion.findById(id);
    if (!previousQuestion) {
      return null;
    }

    const updateData: any = {};
    if (payload.questionText) updateData.questionText = payload.questionText;
    if (payload.question_img !== undefined) updateData.question_img = payload.question_img;
    if (payload.blanks) updateData.blanks = payload.blanks;
    if (payload.explanation !== undefined) updateData.explanation = payload.explanation;

    const updatedQuestion = await FillInTheBlankQuestion.findByIdAndUpdate(id, updateData, {
      returnDocument: 'after',
      runValidators: true,
    });

    if (payload.question_img !== undefined) {
      await deleteRemovedSupabaseImages(previousQuestion.question_img, payload.question_img);
    }

    return updatedQuestion;
  }
}

export const questionService = new QuestionService();
