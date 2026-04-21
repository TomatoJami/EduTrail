// API Constants
export const API_ROUTES = {
  AUTH: {
    LOGIN: '/api/auth/login',
    SIGNUP: '/api/auth/signup',
    LOGOUT: '/api/auth/logout',
  },
  USERS: {
    GET_ALL: '/api/users',
    GET_ONE: '/api/users/:id',
    UPDATE: '/api/users/:id',
    DELETE: '/api/users/:id',
  },
} as const;

// User Roles
export const USER_ROLES = {
  STUDENT: 'student',
  ADMIN: 'admin',
} as const;

// Messages
export const MESSAGES = {
  SUCCESS: {
    LOGIN: 'Login successful',
    SIGNUP: 'Account created successfully',
    UPDATE: 'Updated successfully',
    DELETE: 'Deleted successfully',
  },
  ERROR: {
    INVALID_CREDENTIALS: 'Invalid email or password',
    USER_EXISTS: 'User with this email already exists',
    NOT_FOUND: 'Resource not found',
    UNAUTHORIZED: 'Unauthorized access',
    SERVER_ERROR: 'Internal server error',
  },
} as const;
