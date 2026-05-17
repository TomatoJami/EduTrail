import { Request } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FeedbackController } from '../../src/controllers/feedbackController';
import { feedbackService } from '../../src/services/feedbackService';
import { createMockResponse } from '../testUtils';

vi.mock('../../src/services/feedbackService', () => ({
  feedbackService: {
    createFeedback: vi.fn(),
    getAllFeedback: vi.fn(),
    getFeedbackById: vi.fn(),
    getFeedbackByType: vi.fn(),
  },
}));

describe('FeedbackController', () => {
  const controller = new FeedbackController();
  const userId = '507f1f77bcf86cd799439011';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates feedback type and user id', async () => {
    const res = createMockResponse();

    await controller.createFeedback({
      body: {
        feedbackType: 'Other',
        data: 'Something',
        user_id: userId,
      },
    } as Request, res);

    expect(feedbackService.createFeedback).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'feedbackType must be either "Error" or "Wish"',
    });
  });

  it('trims and creates feedback', async () => {
    const feedback = { _id: 'feedback-1' };
    vi.mocked(feedbackService.createFeedback).mockResolvedValue(feedback as any);
    const res = createMockResponse();

    await controller.createFeedback({
      body: {
        feedbackType: 'Wish',
        data: '  Please add more courses  ',
        user_id: userId,
      },
    } as Request, res);

    expect(feedbackService.createFeedback).toHaveBeenCalledWith({
      feedbackType: 'Wish',
      data: 'Please add more courses',
      user_id: userId,
    });
    expect(res.status).toHaveBeenCalledWith(201);
  });
});
