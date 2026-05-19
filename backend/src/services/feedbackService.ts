import mongoose from "mongoose";
import { Feedback, IFeedback, FeedbackType } from "../models/Feedback";

/** Defines the TypeScript shape for feedback payload. */
export interface FeedbackPayload {
  feedbackType: FeedbackType;
  data: string;
  user_id: string;
}

// Owns feedback persistence and query helpers for admin review screens.
export class FeedbackService {
  /** Handles the create feedback request flow. */
  async createFeedback(payload: FeedbackPayload): Promise<IFeedback> {
    // Stores one feedback entry from the public feedback form.
    if (!mongoose.isValidObjectId(payload.user_id)) {
      throw new Error("Invalid user_id");
    }

    const feedback = new Feedback({
      feedbackType: payload.feedbackType,
      data: payload.data.trim(),
      user_id: new mongoose.Types.ObjectId(payload.user_id),
    });

    await feedback.save();

    return feedback.populate("user_id");
  }

  /** Handles the get all feedback request flow. */
  async getAllFeedback(): Promise<IFeedback[]> {
    // Reads feedback entries newest-first for admin review.
    return Feedback.find()
      .populate("user_id")
      .sort({ createdAt: -1 });
  }

  /** Handles the get feedback by id request flow. */
  async getFeedbackById(id: string): Promise<IFeedback | null> {
    // Reads one feedback entry by id.
    if (!mongoose.isValidObjectId(id)) {
      throw new Error("Invalid feedback id");
    }

    return Feedback.findById(id).populate("user_id");
  }

  /** Handles the get feedback by type request flow. */
  async getFeedbackByType(feedbackType: FeedbackType): Promise<IFeedback[]> {
    // Reads feedback entries filtered by category.
    if (!["Error", "Wish"].includes(feedbackType)) {
        throw new Error('feedbackType must be either "Error" or "Wish"');
    }

    return Feedback.find({ feedbackType })
        .populate("user_id")
        .sort({ createdAt: -1 });
    }
}

export const feedbackService = new FeedbackService();
