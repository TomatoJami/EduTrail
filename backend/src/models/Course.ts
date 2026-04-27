import mongoose, { Schema, Document, Model } from 'mongoose';

export type CourseAgeGroup = '1-3' | '4-9' | '10-12';

export interface ICourse extends Document {
  title: string;
  description: string;
  ageGroup: CourseAgeGroup;
  course_img: string;
  subject_id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema = new Schema<ICourse>(
  {
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Course description is required'],
      trim: true,
    },
    ageGroup: {
      type: String,
      enum: ['1-3', '4-9', '10-12'],
      required: [true, 'Age group is required'],
      index: true,
    },
    course_img: {
      type: String,
      required: [true, 'Course image is required'],
      trim: true,
    },
    subject_id: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject is required'],
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const CourseModel: Model<ICourse> =
  (mongoose.models.Course as Model<ICourse>) || mongoose.model<ICourse>('Course', CourseSchema);

export const Course = CourseModel;
