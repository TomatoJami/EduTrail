import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUserCourse extends Document {
  user_id: mongoose.Types.ObjectId;
  course_id: mongoose.Types.ObjectId;
  is_completed: boolean;
  is_saved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserCourseSchema = new Schema<IUserCourse>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    course_id: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course is required'],
      index: true,
    },
    is_completed: {
      type: Boolean,
      default: false,
      required: true,
    },
    is_saved: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

UserCourseSchema.index({ user_id: 1, course_id: 1 }, { unique: true });

const UserCourseModel: Model<IUserCourse> =
  (mongoose.models.UserCourse as Model<IUserCourse>) ||
  mongoose.model<IUserCourse>('UserCourse', UserCourseSchema);

export const UserCourse = UserCourseModel;
