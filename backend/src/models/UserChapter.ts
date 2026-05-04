import mongoose, { Document, Schema } from 'mongoose';

export interface IUserChapter extends Document {
  user_id: mongoose.Types.ObjectId;
  chapter_id: mongoose.Types.ObjectId;
  is_completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userChapterSchema = new Schema<IUserChapter>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    chapter_id: {
      type: Schema.Types.ObjectId,
      ref: 'Chapter',
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

// Unique constraint: one record per user per chapter
userChapterSchema.index({ user_id: 1, chapter_id: 1 }, { unique: true });

export const UserChapter = mongoose.model<IUserChapter>('UserChapter', userChapterSchema);
