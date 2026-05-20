/** Defines the TypeScript shape for user. */
export interface User {
  _id?: string;
  email: string;
  password: string;
  name: string;
  role: 'student' | 'admin';
  ageGroup?: '1-3' | '4-9' | '10-12';
  preferredSubjects?: string[];
  hasCompletedOnboarding?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/** Defines the TypeScript shape for api response. */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

/** Defines the TypeScript shape for auth payload. */
export interface AuthPayload {
  email: string;
  password: string;
}

/** Defines the TypeScript shape for signup payload. */
export interface SignupPayload extends AuthPayload {
  name: string;
  role?: 'student';
}

/** Defines the TypeScript shape for course age group. */
export type CourseAgeGroup = '1-3' | '4-9' | '10-12';

/** Defines the TypeScript shape for subject. */
export interface Subject {
  _id?: string;
  subject_name: string;
  subject_img: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/** Defines the TypeScript shape for course. */
export interface Course {
  _id?: string;
  title: string;
  description: string;
  ageGroup: CourseAgeGroup;
  course_img: string;
  subject_id: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/** Defines the TypeScript shape for module. */
export interface Module {
  _id?: string;
  title: string;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
}

/** Defines the TypeScript shape for question type. */
export type QuestionType = 'test' | 'short-answer' | 'fill-blank';

/** Defines the TypeScript shape for test question. */
export interface TestQuestion {
  _id?: string;
  module_id: string;
  question: string;
  question_img?: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/** Defines the TypeScript shape for short answer question. */
export interface ShortAnswerQuestion {
  _id?: string;
  module_id: string;
  question: string;
  question_img?: string;
  correctAnswers: string[];
  explanation?: string;
  caseSensitive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/** Defines the TypeScript shape for blanks data. */
export interface BlanksData {
  blankId: string;
  correctAnswers: string[];
  caseSensitive?: boolean;
}

/** Defines the TypeScript shape for fill in the blank question. */
export interface FillInTheBlankQuestion {
  _id?: string;
  module_id: string;
  questionText: string;
  question_img?: string;
  blanks: BlanksData[];
  explanation?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/** Defines the TypeScript shape for question. */
export interface Question {
  _id?: string;
  module_id: string;
  type: QuestionType;
  typeId: string;
  createdAt?: Date;
  updatedAt?: Date;
}


/** Defines the TypeScript shape for user course. */
export interface UserCourse {
  _id?: string;
  user_id: string;
  course_id: string;
  is_completed: boolean;
  is_saved: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/** Defines the TypeScript shape for user chapter. */
export interface UserChapter {
  _id?: string;
  user_id: string;
  chapter_id: string;
  is_completed: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/** Defines the TypeScript shape for user question. */
export interface UserQuestion {
  _id?: string;
  user_id: string;
  question_id: string;
  is_completed: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/** Defines the TypeScript shape for auth response. */
export interface AuthResponse {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'admin';
  hasCompletedOnboarding?: boolean;
  token?: string;
  expiresAt?: string;
}
