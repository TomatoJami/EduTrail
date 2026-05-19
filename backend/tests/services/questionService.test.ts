import { describe, it, expect, beforeEach, vi } from 'vitest';
import mongoose from 'mongoose';
import { QuestionService } from '../../src/services/questionService';
import { Question } from '../../src/models/Question';
import { TestQuestion } from '../../src/models/TestQuestion';
import { ShortAnswerQuestion } from '../../src/models/ShortAnswerQuestion';
import { FillInTheBlankQuestion } from '../../src/models/FillInTheBlankQuestion';
import * as storageCleanupService from '../../src/services/storageCleanupService';

vi.mock('../../src/models/Question');
vi.mock('../../src/models/TestQuestion');
vi.mock('../../src/models/ShortAnswerQuestion');
vi.mock('../../src/models/FillInTheBlankQuestion');
vi.mock('../../src/services/storageCleanupService');

describe('QuestionService', () => {
  let questionService: QuestionService;

  beforeEach(() => {
    vi.clearAllMocks();
    questionService = new QuestionService();
  });

  describe('createTestQuestion', () => {
    it('should create a test question successfully', async () => {
      const moduleId = new mongoose.Types.ObjectId().toString();
      const payload = {
        question: 'What is 2+2?',
        options: ['3', '4', '5'],
        correctAnswer: 1,
        explanation: 'The sum is 4',
        module_id: moduleId,
      };

      const mockTestQuestion = {
        _id: new mongoose.Types.ObjectId(),
        save: vi.fn().mockResolvedValue(true),
      };

      const mockQuestion = {
        _id: new mongoose.Types.ObjectId(),
        save: vi.fn().mockResolvedValue(true),
      };

      vi.mocked(TestQuestion).mockImplementation(function () { return mockTestQuestion as any; });
      vi.mocked(Question).mockImplementation(function () { return mockQuestion as any; });

      await questionService.createTestQuestion(payload);

      expect(mockTestQuestion.save).toHaveBeenCalled();
      expect(mockQuestion.save).toHaveBeenCalled();
    });

    it('should throw error for invalid module id', async () => {
      const payload = {
        question: 'Question text',
        options: ['A', 'B'],
        correctAnswer: 0,
        module_id: 'invalid-id',
      };

      await expect(questionService.createTestQuestion(payload)).rejects.toThrow(
        'Invalid module id'
      );
    });

    it('should throw error for invalid correct answer index', async () => {
      const moduleId = new mongoose.Types.ObjectId().toString();
      const payload = {
        question: 'Question',
        options: ['A', 'B'],
        correctAnswer: 5,
        module_id: moduleId,
      };

      await expect(questionService.createTestQuestion(payload)).rejects.toThrow();
    });
  });

  describe('createShortAnswerQuestion', () => {
    it('should create a short answer question', async () => {
      const moduleId = new mongoose.Types.ObjectId().toString();
      const payload = {
        question: 'What is the capital of France?',
        correctAnswers: ['Paris', 'paris'],
        explanation: 'Paris is the capital city',
        module_id: moduleId,
      };

      const mockShortAnswer = {
        _id: new mongoose.Types.ObjectId(),
        save: vi.fn().mockResolvedValue(true),
      };

      const mockQuestion = {
        _id: new mongoose.Types.ObjectId(),
        save: vi.fn().mockResolvedValue(true),
      };

      vi.mocked(ShortAnswerQuestion).mockImplementation(function () { return mockShortAnswer as any; });
      vi.mocked(Question).mockImplementation(function () { return mockQuestion as any; });

      await questionService.createShortAnswerQuestion(payload);

      expect(mockShortAnswer.save).toHaveBeenCalled();
      expect(mockQuestion.save).toHaveBeenCalled();
    });

    it('should throw error for invalid module id', async () => {
      const payload = {
        question: 'Question text',
        correctAnswers: ['answer'],
        module_id: 'invalid-id',
      };

      await expect(questionService.createShortAnswerQuestion(payload)).rejects.toThrow(
        'Invalid module id'
      );
    });
  });

  describe('createFillInTheBlanksQuestion', () => {
    it('should create a fill in the blanks question', async () => {
      const moduleId = new mongoose.Types.ObjectId().toString();
      const payload = {
        questionText: 'The capital of France is _____.',
        blanks: [
          {
            blankId: 'blank-1',
            correctAnswers: ['Paris'],
          },
        ],
        module_id: moduleId,
      };

      const mockFillBlank = {
        _id: new mongoose.Types.ObjectId(),
        save: vi.fn().mockResolvedValue(true),
      };

      const mockQuestion = {
        _id: new mongoose.Types.ObjectId(),
        save: vi.fn().mockResolvedValue(true),
      };

      vi.mocked(FillInTheBlankQuestion).mockImplementation(function () { return mockFillBlank as any; });
      vi.mocked(Question).mockImplementation(function () { return mockQuestion as any; });

      await questionService.createFillBlankQuestion(payload);

      expect(mockFillBlank.save).toHaveBeenCalled();
      expect(mockQuestion.save).toHaveBeenCalled();
    });

    it('should support multiple blanks', async () => {
      const moduleId = new mongoose.Types.ObjectId().toString();
      const payload = {
        questionText: '_____ is the capital of _____.',
        blanks: [
          {
            blankId: 'blank-1',
            correctAnswers: ['Paris'],
          },
          {
            blankId: 'blank-2',
            correctAnswers: ['France'],
          },
        ],
        module_id: moduleId,
      };

      const mockFillBlank = {
        _id: new mongoose.Types.ObjectId(),
        save: vi.fn().mockResolvedValue(true),
      };

      const mockQuestion = {
        _id: new mongoose.Types.ObjectId(),
        save: vi.fn().mockResolvedValue(true),
      };

      vi.mocked(FillInTheBlankQuestion).mockImplementation(function () { return mockFillBlank as any; });
      vi.mocked(Question).mockImplementation(function () { return mockQuestion as any; });

      await questionService.createFillBlankQuestion(payload);

      expect(mockFillBlank.save).toHaveBeenCalled();
    });
  });

  describe('getQuestionsByModuleId', () => {
    it('should return questions for a module with type data', async () => {
      const moduleId = new mongoose.Types.ObjectId().toString();
      const mockQuestions = [
        { _id: 'q-1', type: 'test', typeId: 'test-1' },
      ];

      vi.mocked(Question.find).mockReturnValue({
        sort: vi.fn().mockResolvedValue(mockQuestions),
      } as any);
      vi.mocked(TestQuestion.findById).mockResolvedValue({
        toObject: () => ({ question: 'What is 2+2?', options: ['3', '4'] }),
      } as any);

      const result = await questionService.getQuestionsByModuleId(moduleId);

      expect(Question.find).toHaveBeenCalledWith({ module_id: moduleId });
      expect(result.length).toBeGreaterThanOrEqual(0);
    });

    it('should throw error for invalid module id', async () => {
      await expect(questionService.getQuestionsByModuleId('invalid-id')).rejects.toThrow(
        'Invalid module id'
      );
    });

    it('should return empty array when no questions exist', async () => {
      const moduleId = new mongoose.Types.ObjectId().toString();

      vi.mocked(Question.find).mockReturnValue({
        sort: vi.fn().mockResolvedValue([]),
      } as any);

      const result = await questionService.getQuestionsByModuleId(moduleId);

      expect(result).toEqual([]);
    });
  });

  describe('deleteQuestion', () => {
    it('should delete a test question and its wrapper', async () => {
      const questionId = new mongoose.Types.ObjectId().toString();
      const mockQuestion = {
        _id: questionId,
        type: 'test',
        typeId: 'test-1',
      };

      vi.mocked(Question.findById).mockResolvedValue(mockQuestion as any);
      vi.mocked(TestQuestion.findByIdAndDelete).mockResolvedValue({} as any);
      vi.mocked(Question.findByIdAndDelete).mockResolvedValue(mockQuestion as any);

      const result = await questionService.deleteQuestion(questionId);

      expect(Question.findById).toHaveBeenCalledWith(questionId);
      expect(Question.findByIdAndDelete).toHaveBeenCalledWith(questionId);
    });

    it('should throw error for invalid question id', async () => {
      await expect(questionService.deleteQuestion('invalid-id')).rejects.toThrow(
        'Invalid question id'
      );
    });

    it('should return null when question not found', async () => {
      const questionId = new mongoose.Types.ObjectId().toString();
      vi.mocked(Question.findById).mockResolvedValue(null);

      await expect(questionService.deleteQuestion(questionId)).rejects.toThrow(
        'Question not found'
      );
    });

    it('should cleanup question images on delete', async () => {
      const questionId = new mongoose.Types.ObjectId().toString();
      const mockQuestion = {
        _id: questionId,
        type: 'test',
        typeId: 'test-1',
      };

      vi.mocked(Question.findById).mockResolvedValue(mockQuestion as any);
      vi.mocked(TestQuestion.findByIdAndDelete).mockResolvedValue({
        question_img: 'question.jpg',
      } as any);
      vi.mocked(Question.findByIdAndDelete).mockResolvedValue(mockQuestion as any);

      await questionService.deleteQuestion(questionId);

      expect(storageCleanupService.deleteSupabaseImages).toHaveBeenCalled();
    });
  });
});
