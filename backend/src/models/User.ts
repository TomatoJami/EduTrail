import mongoose, { Schema, Document } from 'mongoose';
import crypto from 'crypto';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  ageGroup?: '1-3' | '4-9' | '10-12';
  role: 'student' | 'admin';
  preferredSubjects: mongoose.Types.ObjectId[];
  hasCompletedOnboarding: boolean;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  loginAttempts: number;
  lockUntil?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      index: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false,
    },
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
    },
    role: {
      type: String,
      enum: ['student', 'admin'],
      default: 'student',
    },
    preferredSubjects: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Subject',
      default: [],
    },
    ageGroup: {
      type: String,
      enum: ['1-3', '4-9', '10-12'],
      default: null,
    },
    hasCompletedOnboarding: {
      type: Boolean,
      default: false,
    },
    resetPasswordToken: {
      type: String,
      default: null,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
      select: false,
    },
    loginAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    lockUntil: {
      type: Date,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Pre-save middleware to hash password using PBKDF2
UserSchema.pre<IUser>('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  try {
    const salt = crypto.randomBytes(32).toString('hex');
    const hash = crypto.pbkdf2Sync(this.password, salt, 100000, 64, 'sha512').toString('hex');
    this.password = `${salt}$${hash}`;
  } catch (error) {
    throw error;
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  try {
    const [salt, hash] = this.password.split('$');
    const testHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return hash === testHash;
  } catch (error) {
    return false;
  }
};

UserSchema.set('toJSON', {
  transform: (_, returnedObject: any) => {
    delete returnedObject.password;
    return returnedObject;
  },
});

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
