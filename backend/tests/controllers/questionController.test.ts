import { Request } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QuestionController } from '../../src/controllers/questionController';
import { questionService } from '../../src/services/questionService';
import { createMockResponse } from '../testUtils';

vi.mock('../../src/services/questionService', () => ({
  questionService: {
    getAllQuestions: vi.fn(),
    getQuestionsByModuleId: vi.fn(),
    getQuestionById: vi.fn(),
    gradeQuizAnswers: vi.fn(),
    createTestQuestion: vi.fn(),
    createShortAnswerQuestion: vi.fn(),
    createFillBlankQuestion: vi.fn(),
    updateTestQuestion: vi.fn(),
    updateShortAnswerQuestion: vi.fn(),
    updateFillBlankQuestion: vi.fn(),
    deleteQuestion: vi.fn(),
  },
}));

describe('QuestionController', () => {
  const controller = new QuestionController();
  const userId = '507f1f77bcf86cd799439011';
  const otherUserId = '507f191e810c19729de860ea';
  const moduleId = '507f1f77bcf86cd799439012';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects missing question type and module id', async () => {
    const res = createMockResponse();

    await controller.createQuestion({ body: {} } as Request, res);

    expect(questionService.createTestQuestion).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'type and module_id are required',
    });
  });

  it('rejects invalid question types', async () => {
    const res = createMockResponse();

    await controller.createQuestion({
      body: {
        type: 'essay',
        module_id: moduleId,
      },
    } as Request, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid question type. Must be: test, short-answer, or fill-blank',
    });
  });

  it('trims and creates test questions', async () => {
    const question = { _id: 'question-1' };
    vi.mocked(questionService.createTestQuestion).mockResolvedValue(question as any);
    const res = createMockResponse();

    await controller.createQuestion({
      body: {
        type: 'test',
        module_id: moduleId,
        question: '  What is 2 + 2?  ',
        question_img: '  https://example.com/q.jpg  ',
        options: ['3', '4'],
        correctAnswer: 1,
        explanation: '  Basic math  ',
      },
    } as Request, res);

    expect(questionService.createTestQuestion).toHaveBeenCalledWith({
      question: 'What is 2 + 2?',
      question_img: 'https://example.com/q.jpg',
      options: ['3', '4'],
      correctAnswer: 1,
      explanation: 'Basic math',
      module_id: moduleId,
    });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('prevents students from reading another user question progress', async () => {
    const res = createMockResponse();

    await controller.getUserQuestionsProgress({
      params: { userId, moduleId },
      userId: otherUserId,
      userRole: 'student',
    } as unknown as Request, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Forbidden: cannot access another user progress',
    });
  });
});
