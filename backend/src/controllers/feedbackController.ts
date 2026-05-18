import { Request, Response } from "express";
import mongoose from "mongoose";
import {
  feedbackService,
  FeedbackPayload,
} from "../services/feedbackService";
import { ApiResponse } from "../types";

// Handles feedback submission and admin feedback retrieval endpoints.
export class FeedbackController {
  async createFeedback(req: Request, res: Response): Promise<void> {
    // Accepts learner feedback and stores the user id supplied by the proxy.
    try {
        
        
      const body = req.body as {
        feedbackType?: "Error" | "Wish";
        data?: string;
        user_id?: string;
      };

      if (!body.feedbackType || !body.data || !body.user_id) {
        res.status(400).json({
          success: false,
          message: "feedbackType, data and user_id are required",
        } as ApiResponse);
        return;
      }

      if (!["Error", "Wish"].includes(body.feedbackType)) {
        res.status(400).json({
          success: false,
          message: 'feedbackType must be either "Error" or "Wish"',
        } as ApiResponse);
        return;
      }

      if (!mongoose.isValidObjectId(body.user_id)) {
        res.status(400).json({
          success: false,
          message: "Invalid user_id",
        } as ApiResponse);
        return;
      }

      const payload: FeedbackPayload = {
        feedbackType: body.feedbackType,
        data: body.data.trim(),
        user_id: body.user_id,
      };

      const feedback = await feedbackService.createFeedback(payload);

      res.status(201).json({
        success: true,
        message: "Feedback created successfully",
        data: feedback,
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to create feedback",
        error: error instanceof Error ? error.message : String(error),
      } as ApiResponse);
    }
  }

  async getAllFeedback(req: Request, res: Response): Promise<void> {
    // Returns feedback entries for the admin review page.
    try {
      const feedback = await feedbackService.getAllFeedback();

      res.status(200).json({
        success: true,
        message: "Feedback fetched successfully",
        data: feedback,
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch feedback",
        error: error instanceof Error ? error.message : String(error),
      } as ApiResponse);
    }
  }

  async getFeedbackById(req: Request, res: Response): Promise<void> {
    // Fetches one feedback item by id for admin detail views.
    try {
      const { id } = req.params;

      const feedback = await feedbackService.getFeedbackById(id);

      if (!feedback) {
        res.status(404).json({
          success: false,
          message: "Feedback not found",
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: "Feedback fetched successfully",
        data: feedback,
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch feedback",
        error: error instanceof Error ? error.message : String(error),
      } as ApiResponse);
    }
  }

  async getFeedbackByType(req: Request, res: Response): Promise<void> {
    // Filters feedback by type for admin triage.
    try {
        const { feedbackType } = req.params;

        if (!["Error", "Wish"].includes(feedbackType)) {
        res.status(400).json({
            success: false,
            message: 'feedbackType must be either "Error" or "Wish"',
        } as ApiResponse);
        return;
        }

        const feedback = await feedbackService.getFeedbackByType(
        feedbackType as "Error" | "Wish"
        );

        res.status(200).json({
        success: true,
        message: "Feedback fetched successfully",
        data: feedback,
        } as ApiResponse);
    } catch (error) {
        res.status(500).json({
        success: false,
        message: "Failed to fetch feedback",
        error: error instanceof Error ? error.message : String(error),
        } as ApiResponse);
    }
    }
}

export const feedbackController = new FeedbackController();
