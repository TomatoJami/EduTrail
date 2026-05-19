import mongoose, { Schema, Document, Model } from 'mongoose';

/** Defines the TypeScript shape for ishort answer question. */
export interface IShortAnswerQuestion extends Document {
  module_id: mongoose.Types.ObjectId;
  question: string;
  question_img?: string;
  correctAnswers: string[];
  explanation?: string;
  caseSensitive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ShortAnswerQuestionSchema = new Schema<IShortAnswerQuestion>(
  {
    module_id: {
      type: Schema.Types.ObjectId,
      ref: 'Module',
      required: true,
      index: true,
    },
    question: {
      type: String,
      required: true,
      trim: true,
    },
    question_img: {
      type: String,
      trim: true,
      default: '',
    },
    correctAnswers: {
      type: [String],
      required: true,
      validate: [(val: string[]) => val.length >= 1, 'At least 1 correct answer required'],
    },
    explanation: {
      type: String,
    },
    caseSensitive: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const ShortAnswerQuestion =
  (mongoose.models.ShortAnswerQuestion as Model<IShortAnswerQuestion>) ||
  mongoose.model<IShortAnswerQuestion>('ShortAnswerQuestion', ShortAnswerQuestionSchema);
