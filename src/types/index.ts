export interface User {
  _id?: string;
  email: string;
  password: string;
  name: string;
  role: 'student' | 'admin';
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

export interface UserCourse {
  _id?: string;
  user_id: string;
  course_id: string;
  is_completed: boolean;
  is_saved: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
