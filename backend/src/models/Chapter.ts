import mongoose, { Schema, Document, Model } from 'mongoose';

/** Defines the TypeScript shape for chapter. */
export interface IChapter extends Document {
  title: string;
  content: string;
  module_id: mongoose.Types.ObjectId;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const ChapterSchema = new Schema<IChapter>(
  {
    title: {
      type: String,
      required: [true, 'Chapter title is required'],
      trim: true,
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Chapter content is required'],
      trim: true,
      index: true,
    },
    module_id: {
      type: Schema.Types.ObjectId,
      ref: 'Module',
      required: [true, 'Module is required'],
      index: true,
    },
    order: {
      type: Number,
      required: [true, 'Chapter order is required'],
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const ChapterModel: Model<IChapter> =
  (mongoose.models.Chapter as Model<IChapter>) || mongoose.model<IChapter>('Chapter', ChapterSchema);

export const Chapter = ChapterModel;
