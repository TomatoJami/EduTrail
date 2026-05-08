import mongoose from "mongoose";
import { Feedback, IFeedback, FeedbackType } from "../models/Feedback";

export interface FeedbackPayload {
  feedbackType: FeedbackType;
  data: string;
  user_id: string;
}

export class FeedbackService {
  async createFeedback(payload: FeedbackPayload): Promise<IFeedback> {
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

  async getAllFeedback(): Promise<IFeedback[]> {
    return Feedback.find()
      .populate("user_id")
      .sort({ createdAt: -1 });
  }

  async getFeedbackById(id: string): Promise<IFeedback | null> {
    if (!mongoose.isValidObjectId(id)) {
      throw new Error("Invalid feedback id");
    }

    return Feedback.findById(id).populate("user_id");
  }

  async getFeedbackByType(feedbackType: FeedbackType): Promise<IFeedback[]> {
    if (!["Error", "Wish"].includes(feedbackType)) {
        throw new Error('feedbackType must be either "Error" or "Wish"');
    }

    return Feedback.find({ feedbackType })
        .populate("user_id")
        .sort({ createdAt: -1 });
    }
}

export const feedbackService = new FeedbackService();