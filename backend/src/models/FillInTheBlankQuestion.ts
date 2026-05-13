import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBlanksData {
  blankId: string;
  correctAnswers: string[];
  caseSensitive?: boolean;
}

export interface IFillInTheBlankQuestion extends Document {
  module_id: mongoose.Types.ObjectId;
  questionText: string;
  question_img?: string;
  blanks: IBlanksData[];
  explanation?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BlanksDataSchema = new Schema<IBlanksData>(
  {
    blankId: {
      type: String,
      required: true,
    },
    correctAnswers: {
      type: [String],
      required: true,
    },
    caseSensitive: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const FillInTheBlankQuestionSchema = new Schema<IFillInTheBlankQuestion>(
  {
    module_id: {
      type: Schema.Types.ObjectId,
      ref: 'Module',
      required: true,
      index: true,
    },
    questionText: {
      type: String,
      required: true,
      trim: true,
    },
    question_img: {
      type: String,
      trim: true,
      default: '',
    },
    blanks: {
      type: [BlanksDataSchema],
      required: true,
      validate: [(val: IBlanksData[]) => val.length >= 1, 'At least 1 blank required'],
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

export const FillInTheBlankQuestion =
  (mongoose.models.FillInTheBlankQuestion as Model<IFillInTheBlankQuestion>) ||
  mongoose.model<IFillInTheBlankQuestion>('FillInTheBlankQuestion', FillInTheBlankQuestionSchema);
