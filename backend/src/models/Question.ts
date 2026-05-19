import mongoose, { Schema, Document, Model } from 'mongoose';

/** Defines the TypeScript shape for question type. */
export type QuestionType = 'test' | 'short-answer' | 'fill-blank';

/** Defines the TypeScript shape for question. */
export interface IQuestion extends Document {
  module_id: mongoose.Types.ObjectId;
  type: QuestionType;
  typeId: mongoose.Types.ObjectId;
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
    type: {
      type: String,
      enum: ['test', 'short-answer', 'fill-blank'],
      required: true,
    },
    typeId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'type',
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