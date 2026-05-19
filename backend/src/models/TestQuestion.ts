import mongoose, { Schema, Document, Model } from 'mongoose';

/** Defines the TypeScript shape for itest question. */
export interface ITestQuestion extends Document {
  module_id: mongoose.Types.ObjectId;
  question: string;
  question_img?: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TestQuestionSchema = new Schema<ITestQuestion>(
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
    options: {
      type: [String],
      required: true,
      validate: [(val: string[]) => val.length >= 2, 'Minimum 2 options required'],
    },
    correctAnswer: {
      type: Number,
      required: true,
    },
    explanation: {
      type: String,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const TestQuestion =
  (mongoose.models.TestQuestion as Model<ITestQuestion>) ||
  mongoose.model<ITestQuestion>('TestQuestion', TestQuestionSchema);
