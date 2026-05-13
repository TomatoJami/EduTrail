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

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface AuthPayload {
  email: string;
  password: string;
}

export interface SignupPayload extends AuthPayload {
  name: string;
  role?: 'student';
}

export type CourseAgeGroup = '1-3' | '4-9' | '10-12';

export interface Subject {
  _id?: string;
  subject_name: string;
  subject_img: string;
  createdAt?: Date;
  updatedAt?: Date;
}

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

export interface Module {
  _id?: string;
  title: string;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type QuestionType = 'test' | 'short-answer' | 'fill-blank';

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

export interface BlanksData {
  blankId: string;
  correctAnswers: string[];
  caseSensitive?: boolean;
}

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

export interface Question {
  _id?: string;
  module_id: string;
  type: QuestionType;
  typeId: string;
  createdAt?: Date;
  updatedAt?: Date;
}


export interface UserCourse {
  _id?: string;
  user_id: string;
  course_id: string;
  is_completed: boolean;
  is_saved: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserChapter {
  _id?: string;
  user_id: string;
  chapter_id: string;
  is_completed: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserQuestion {
  _id?: string;
  user_id: string;
  question_id: string;
  is_completed: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AuthResponse {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'admin';
}
