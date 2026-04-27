import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISubject extends Document {
  subject_name: string;
  subject_img: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubjectSchema = new Schema<ISubject>(
  {
    subject_name: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true,
      unique: true,
      index: true,
    },
    subject_img: {
      type: String,
      required: [true, 'Subject image is required'],
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

SubjectSchema.index({ subject_name: 1 }, { unique: true });

const SubjectModel: Model<ISubject> =
  (mongoose.models.Subject as Model<ISubject>) || mongoose.model<ISubject>('Subject', SubjectSchema);

export const Subject = SubjectModel;
