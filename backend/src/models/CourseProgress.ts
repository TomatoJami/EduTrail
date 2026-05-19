import mongoose, { Schema, Document } from 'mongoose';

/** Defines the TypeScript shape for course status. */
export type CourseStatus = 'in_progress' | 'completed';

/** Defines the TypeScript shape for course progress. */
export interface ICourseProgress extends Document {
  user_id: mongoose.Types.ObjectId;
  course_id: mongoose.Types.ObjectId;
  status?: CourseStatus;  // Present only after a learner starts or completes a course.
  is_bookmarked: boolean; // Independent bookmark flag.
  createdAt: Date;
  updatedAt: Date;
}

const CourseProgressSchema = new Schema<ICourseProgress>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    course_id: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed'],
      default: null,
      index: true,
    },
    is_bookmarked: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true, versionKey: false }
);

CourseProgressSchema.index({ user_id: 1, course_id: 1 }, { unique: true });

export const CourseProgress =
  mongoose.models.CourseProgress ||
  mongoose.model<ICourseProgress>('CourseProgress', CourseProgressSchema);
