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
