// backend/src/models/ChapterProgress.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IChapterProgress extends Document {
  user_id: mongoose.Types.ObjectId;
  chapter_id: mongoose.Types.ObjectId;
  is_completed: boolean;
  createdAt: Date;
  updatedAt: Date;
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
      index: true,
    },
  },
  { timestamps: true, versionKey: false }
);

ChapterProgressSchema.index({ user_id: 1, chapter_id: 1 }, { unique: true });

export const ChapterProgress =
  mongoose.models.ChapterProgress ||
  mongoose.model<IChapterProgress>('ChapterProgress', ChapterProgressSchema);