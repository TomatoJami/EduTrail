/**
 * Helper functions for common operations
 */

export const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('ru-RU');
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { valid: boolean; message?: string } => {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  return { valid: true };
};

export const generateErrorMessage = (error: any): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unknown error occurred';
};
