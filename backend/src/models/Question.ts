import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IQuestion extends Document {
  module_id: mongoose.Types.ObjectId;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>(
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

export const Question =
  (mongoose.models.Question as Model<IQuestion>) ||
  mongoose.model<IQuestion>('Question', QuestionSchema);