import mongoose, { Document, Schema } from 'mongoose';

export interface IUserCourse extends Document {
  user_id: mongoose.Types.ObjectId;
  course_id: mongoose.Types.ObjectId;
  is_completed: boolean;
  is_saved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userCourseSchema = new Schema<IUserCourse>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    course_id: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    is_completed: {
      type: Boolean,
      default: false,
    },
    is_saved: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Unique constraint: one record per user per course
userCourseSchema.index({ user_id: 1, course_id: 1 }, { unique: true });

export const UserCourse = mongoose.model<IUserCourse>('UserCourse', userCourseSchema);
