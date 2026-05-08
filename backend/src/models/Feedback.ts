import mongoose, { Schema, Document, Model } from 'mongoose';

export type FeedbackType = 'Error' | 'Wish';

export interface IFeedback extends Document {
  feedbackType: FeedbackType;
  data: string;
  user_id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackSchema = new Schema<IFeedback>(
  {
    feedbackType: {
        type: String,
        enum: ['Error', 'Wish'],
        default: null,
        index: true,
    },
    data: {
        type: String,
        required: [true, 'Feedback data is required'],
        trim: true,
    },
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const FeedbackModel: Model<IFeedback> =
  (mongoose.models.Feedback as Model<IFeedback>) || mongoose.model<IFeedback>('Feedback', FeedbackSchema);

export const Feedback = FeedbackModel;
