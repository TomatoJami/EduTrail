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

export interface ApiResponse<T> {
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

export interface Subject {
  _id?: string;
  subject_name: string;
  subject_img: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type CourseAgeGroup = '1-3' | '4-9' | '10-12';

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

export interface Question {
  _id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface Chapter {
  _id: string;
  title: string;
  content: string;
  order: number;
}

export interface Module {
  _id: string;
  title: string;
  order: number;
  chapters: Chapter[];
  questions: Question[];
}

export interface UserProgress {
  chapters: Record<string, boolean>;
  questions: Record<string, string>; // "correct" | "incorrect" | "not_attempted"
}

export interface NewUserData {
  id: string;
  email: string;
  name: string;
}

export interface SubjectPreference {
  _id: string;
  name?: string;
  subject_name?: string;
}

export type FeedbackType = 'Error' | 'Wish';

export interface Feedback {
  id: string;
  user_id: string;
  text: string;
  feedbackType: FeedbackType;
  created_at: string;
}