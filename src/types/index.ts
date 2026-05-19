/** Defines the TypeScript shape for user. */
export interface User {
  _id?: string;
  email: string;
  name: string;
  role: 'student' | 'admin';
  ageGroup?: '1-3' | '4-9' | '10-12';
  preferredSubjects?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

/** Defines the TypeScript shape for api response. */
export interface ApiResponse<T> {
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

/** Defines the TypeScript shape for subject. */
export interface Subject {
  _id?: string;
  subject_name: string;
  subject_img: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/** Defines the TypeScript shape for course age group. */
export type CourseAgeGroup = '1-3' | '4-9' | '10-12';

/** Defines the TypeScript shape for course. */
export interface Course {
  _id?: string;
  title: string;
  description: string;
  goals?: string[];
  ageGroup: CourseAgeGroup;
  course_img: string;
  subject_id: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/** Defines the TypeScript shape for course card props. */
export interface CourseCardProps {
  course: Course;
  userId?: string;
  courseProgress?: CourseProgress | null;
  onBookmarkChange?: (courseId: string, isBookmarked: boolean) => void;
}

// export interface UserCourse {
//   _id?: string;
//   user_id: string;
//   course_id: string;
//   is_completed: boolean;
//   is_saved: boolean;
//   createdAt?: Date;
//   updatedAt?: Date;
// }

export interface CourseProgress {
  _id: string;
  user_id: string;
  course_id: string;
  status: "in_progress" | "completed";
  is_bookmarked: boolean;
  created_at: string;
  updated_at: string;
}

/** Defines the TypeScript shape for question. */
export interface Question {
  _id: string;
  question: string;
  question_img?: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

/** Defines the TypeScript shape for chapter. */
export interface Chapter {
  _id: string;
  title: string;
  content: string;
  order: number;
}

/** Defines the TypeScript shape for module. */
export interface Module {
  _id: string;
  title: string;
  order: number;
  chapters: Chapter[];
  questions: Question[];
}

/** Defines the TypeScript shape for user progress. */
export interface UserProgress {
  chapters: Record<string, boolean>;
  questions: Record<string, boolean>;
}

/** Defines the TypeScript shape for new user data. */
export interface NewUserData {
  id: string;
  email: string;
  name: string;
}

/** Defines the TypeScript shape for subject preference. */
export interface SubjectPreference {
  _id: string;
  name?: string;
  subject_name?: string;
}

/** Defines the TypeScript shape for feedback type. */
export type FeedbackType = 'Error' | 'Wish';

/** Defines the TypeScript shape for feedback. */
export interface Feedback {
  id: string;
  user_id: string;
  text: string;
  feedbackType: FeedbackType;
  created_at: string;
}
