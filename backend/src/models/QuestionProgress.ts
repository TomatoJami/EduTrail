// backend/src/models/QuestionProgress.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export type QuestionStatus = 'not_attempted' | 'correct' | 'incorrect';

export interface IQuestionProgress extends Document {
  user_id: mongoose.Types.ObjectId;
  question_id: mongoose.Types.ObjectId;
  status: QuestionStatus;
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
    status: {
      type: String,
      enum: ['not_attempted', 'correct', 'incorrect'],
      default: 'not_attempted',
      index: true,
    },
  },
  { timestamps: true, versionKey: false }
);

QuestionProgressSchema.index({ user_id: 1, question_id: 1 }, { unique: true });

export const QuestionProgress =
  mongoose.models.QuestionProgress ||
  mongoose.model<IQuestionProgress>('QuestionProgress', QuestionProgressSchema);