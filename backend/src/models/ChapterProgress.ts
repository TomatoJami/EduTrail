import mongoose, { Schema, Document } from 'mongoose';

export interface IChapterProgress extends Document {
  user_id: mongoose.Types.ObjectId;
  chapter_id: mongoose.Types.ObjectId;
  is_completed: boolean;
}

const ChapterProgressSchema = new Schema<IChapterProgress>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    chapter_id: {
      type: Schema.Types.ObjectId,
      ref: 'Chapter',
      required: true,
      index: true,
    },
    is_completed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

ChapterProgressSchema.index(
  { user_id: 1, chapter_id: 1 },
  { unique: true }
);

export const ChapterProgress =
  mongoose.models.ChapterProgress ||
  mongoose.model<IChapterProgress>(
    'ChapterProgress',
    ChapterProgressSchema
  );