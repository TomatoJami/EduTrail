import mongoose, { Document, Schema } from 'mongoose';

export interface IUserQuestion extends Document {
  user_id: mongoose.Types.ObjectId;
  question_id: mongoose.Types.ObjectId;
  is_completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userQuestionSchema = new Schema<IUserQuestion>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    question_id: {
      type: Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    },
    is_completed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Unique constraint: one record per user per question
userQuestionSchema.index({ user_id: 1, question_id: 1 }, { unique: true });

export const UserQuestion = mongoose.model<IUserQuestion>('UserQuestion', userQuestionSchema);
