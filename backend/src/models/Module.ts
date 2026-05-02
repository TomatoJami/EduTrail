import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IModule extends Document {
  title: string;
  order: number;
  course_id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ModuleSchema = new Schema<IModule>(
  {
    title: {
      type: String,
      required: [true, 'Module title is required'],
      trim: true,
      index: true,
    },
    order: {
      type: Number,
      required: [true, 'Module order is required'],
      index: true,
    },
    course_id: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course is required'],
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const ModuleModel: Model<IModule> =
  (mongoose.models.Module as Model<IModule>) || mongoose.model<IModule>('Module', ModuleSchema);

export const Module = ModuleModel;
