// backend/src/models/QuestionProgress.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestionProgress extends Document {
  user_id: mongoose.Types.ObjectId;
  question_id: mongoose.Types.ObjectId;
  is_completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionProgressSchema = new Schema<IQuestionProgress>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    question_id: {
      type: Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
      index: true,
    },
    is_completed: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true, versionKey: false }
);

QuestionProgressSchema.index({ user_id: 1, question_id: 1 }, { unique: true });

export const QuestionProgress =
  mongoose.models.QuestionProgress ||
  mongoose.model<IQuestionProgress>('QuestionProgress', QuestionProgressSchema);
