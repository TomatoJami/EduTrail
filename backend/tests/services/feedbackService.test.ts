import { describe, it, expect, beforeEach, vi } from 'vitest';
import mongoose from 'mongoose';
import { FeedbackService, FeedbackPayload } from '../../src/services/feedbackService';
import { Feedback } from '../../src/models/Feedback';

vi.mock('../../src/models/Feedback');

describe('FeedbackService', () => {
  let feedbackService: FeedbackService;

  beforeEach(() => {
    vi.clearAllMocks();
    feedbackService = new FeedbackService();
  });

  describe('createFeedback', () => {
    it('should create a new error feedback entry', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const payload: FeedbackPayload = {
        feedbackType: 'Error',
        data: 'Bug found in module 1',
        user_id: userId,
      };

      const mockFeedback = {
        save: vi.fn().mockResolvedValue(true),
        populate: vi.fn().mockResolvedValue({ _id: 'feedback-1', ...payload }),
      };

      vi.mocked(Feedback).mockImplementation(function () { return mockFeedback as any; });

      const result = await feedbackService.createFeedback(payload);

      expect(mockFeedback.save).toHaveBeenCalled();
      expect(mockFeedback.populate).toHaveBeenCalledWith('user_id');
    });

    it('should create a new wish feedback entry', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const payload: FeedbackPayload = {
        feedbackType: 'Wish',
        data: 'Add more interactive exercises',
        user_id: userId,
      };

      const mockFeedback = {
        save: vi.fn().mockResolvedValue(true),
        populate: vi.fn().mockResolvedValue({ _id: 'feedback-1', ...payload }),
      };

      vi.mocked(Feedback).mockImplementation(function () { return mockFeedback as any; });

      await feedbackService.createFeedback(payload);

      expect(mockFeedback.save).toHaveBeenCalled();
    });

    it('should trim whitespace from feedback data', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const payload: FeedbackPayload = {
        feedbackType: 'Error',
        data: '  Feedback with spaces  ',
        user_id: userId,
      };

      const mockFeedback = {
        save: vi.fn().mockResolvedValue(true),
        populate: vi.fn().mockResolvedValue({ _id: 'feedback-1', ...payload }),
      };

      vi.mocked(Feedback).mockImplementation(function () { return mockFeedback as any; });

      await feedbackService.createFeedback(payload);

      expect(vi.mocked(Feedback)).toHaveBeenCalledWith(
        expect.objectContaining({
          data: 'Feedback with spaces',
        })
      );
    });

    it('should throw error for invalid user_id', async () => {
      const payload: FeedbackPayload = {
        feedbackType: 'Error',
        data: 'Bug found',
        user_id: 'invalid-id',
      };

      await expect(feedbackService.createFeedback(payload)).rejects.toThrow('Invalid user_id');
    });
  });

  describe('getAllFeedback', () => {
    it('should return all feedback sorted by creation date newest first', async () => {
      const mockFeedback = [
        {
          _id: 'feedback-1',
          feedbackType: 'Error',
          data: 'Recent feedback',
          user_id: 'user-1',
        },
        {
          _id: 'feedback-2',
          feedbackType: 'Wish',
          data: 'Older feedback',
          user_id: 'user-2',
        },
      ];

      vi.mocked(Feedback.find).mockReturnValue({
        populate: vi.fn().mockReturnValue({
          sort: vi.fn().mockResolvedValue(mockFeedback),
        }),
      } as any);

      const result = await feedbackService.getAllFeedback();

      expect(result).toEqual(mockFeedback);
      expect(Feedback.find).toHaveBeenCalled();
    });

    it('should return empty array when no feedback exists', async () => {
      vi.mocked(Feedback.find).mockReturnValue({
        populate: vi.fn().mockReturnValue({
          sort: vi.fn().mockResolvedValue([]),
        }),
      } as any);

      const result = await feedbackService.getAllFeedback();

      expect(result).toEqual([]);
    });
  });

  describe('getFeedbackById', () => {
    it('should retrieve feedback by id', async () => {
      const feedbackId = new mongoose.Types.ObjectId().toString();
      const mockFeedback = {
        _id: feedbackId,
        feedbackType: 'Error',
        data: 'Bug details',
        user_id: 'user-1',
      };

      vi.mocked(Feedback.findById).mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockFeedback),
      } as any);

      const result = await feedbackService.getFeedbackById(feedbackId);

      expect(Feedback.findById).toHaveBeenCalledWith(feedbackId);
      expect(result).toEqual(mockFeedback);
    });

    it('should throw error for invalid feedback id', async () => {
      await expect(feedbackService.getFeedbackById('invalid-id')).rejects.toThrow(
        'Invalid feedback id'
      );
    });

    it('should return null when feedback not found', async () => {
      const feedbackId = new mongoose.Types.ObjectId().toString();

      vi.mocked(Feedback.findById).mockReturnValue({
        populate: vi.fn().mockResolvedValue(null),
      } as any);

      const result = await feedbackService.getFeedbackById(feedbackId);

      expect(result).toBeNull();
    });
  });

  describe('getFeedbackByType', () => {
    it('should retrieve all error feedback', async () => {
      const mockFeedback = [
        {
          _id: 'feedback-1',
          feedbackType: 'Error',
          data: 'Bug 1',
          user_id: 'user-1',
        },
        {
          _id: 'feedback-2',
          feedbackType: 'Error',
          data: 'Bug 2',
          user_id: 'user-2',
        },
      ];

      vi.mocked(Feedback.find).mockReturnValue({
        populate: vi.fn().mockReturnValue({
          sort: vi.fn().mockResolvedValue(mockFeedback),
        }),
      } as any);

      const result = await feedbackService.getFeedbackByType('Error');

      expect(Feedback.find).toHaveBeenCalledWith({ feedbackType: 'Error' });
      expect(result).toEqual(mockFeedback);
    });

    it('should retrieve all wish feedback', async () => {
      const mockFeedback = [
        {
          _id: 'feedback-1',
          feedbackType: 'Wish',
          data: 'Wish 1',
          user_id: 'user-1',
        },
      ];

      vi.mocked(Feedback.find).mockReturnValue({
        populate: vi.fn().mockReturnValue({
          sort: vi.fn().mockResolvedValue(mockFeedback),
        }),
      } as any);

      const result = await feedbackService.getFeedbackByType('Wish');

      expect(Feedback.find).toHaveBeenCalledWith({ feedbackType: 'Wish' });
      expect(result).toEqual(mockFeedback);
    });

    it('should throw error for invalid feedback type', async () => {
      await expect(feedbackService.getFeedbackByType('Invalid' as any)).rejects.toThrow(
        'feedbackType must be either "Error" or "Wish"'
      );
    });

    it('should return empty array when no feedback of type exists', async () => {
      vi.mocked(Feedback.find).mockReturnValue({
        populate: vi.fn().mockReturnValue({
          sort: vi.fn().mockResolvedValue([]),
        }),
      } as any);

      const result = await feedbackService.getFeedbackByType('Error');

      expect(result).toEqual([]);
    });
  });
});
