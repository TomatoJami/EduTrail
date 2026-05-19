import axios, { AxiosInstance, AxiosError } from 'axios';
import { ApiResponse } from '@/types';

/** Centralizes the backend API base URL used by request helpers. */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/** Groups api client operations behind one class. */
class ApiClient {
  private client: AxiosInstance;

  /** Initializes this class with its shared dependencies. */
  constructor() {
    // Centralized backend client for browser-side helpers that call the API directly.
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Set user ID for authenticated requests
   */
  setUserId(userId: string | null) {
    // Adds or removes the x-user-id header used by protected backend routes.
    if (userId) {
      this.client.defaults.headers.common['x-user-id'] = userId;
    } else {
      delete this.client.defaults.headers.common['x-user-id'];
    }
  }

  /**
   * Get user ID from headers
   */
  getUserId(): string | undefined {
    // Reads the current x-user-id header for callers that need it.
    return this.client.defaults.headers.common['x-user-id'] as string;
  }

  /**
   * Auth endpoints
   */
  auth = {
    signup: async (email: string, password: string, name: string) => {
      try {
        // Send new account data to the backend auth endpoint.
        const response = await this.client.post('/auth/signup', {
          email,
          password,
          name,
        });
        return response.data as ApiResponse<any>;
      } catch (error) {
        return this.handleError(error);
      }
    },

    login: async (email: string, password: string) => {
      try {
        // Exchange email/password for the authenticated user payload.
        const response = await this.client.post('/auth/login', {
          email,
          password,
        });
        return response.data as ApiResponse<any>;
      } catch (error) {
        return this.handleError(error);
      }
    },

    // Retrieves user data.
    getUser: async (id: string) => {
      try {
        const response = await this.client.get(`/auth/${id}`);
        return response.data as ApiResponse<any>;
      } catch (error) {
        return this.handleError(error);
      }
    },

    // Retrieves all users data.
    getAllUsers: async () => {
      try {
        const response = await this.client.get('/auth');
        return response.data as ApiResponse<any>;
      } catch (error) {
        return this.handleError(error);
      }
    },
  };

  /**
   * Courses endpoints
   */
  courses = {
    // Retrieves all data.
    getAll: async () => {
      try {
        // Load the public course list from the backend.
        const response = await this.client.get('/courses');
        return response.data as ApiResponse<any>;
      } catch (error) {
        return this.handleError(error);
      }
    },

    // Retrieves by id data.
    getById: async (id: string) => {
      try {
        const response = await this.client.get(`/courses/${id}`);
        return response.data as ApiResponse<any>;
      } catch (error) {
        return this.handleError(error);
      }
    },

    // Creates a new record.
    create: async (data: any) => {
      try {
        const response = await this.client.post('/courses', data);
        return response.data as ApiResponse<any>;
      } catch (error) {
        return this.handleError(error);
      }
    },

    // Updates an existing record.
    update: async (id: string, data: any) => {
      try {
        const response = await this.client.put(`/courses/${id}`, data);
        return response.data as ApiResponse<any>;
      } catch (error) {
        return this.handleError(error);
      }
    },

    // Deletes an existing record.
    delete: async (id: string) => {
      try {
        const response = await this.client.delete(`/courses/${id}`);
        return response.data as ApiResponse<any>;
      } catch (error) {
        return this.handleError(error);
      }
    },
  };

  /**
   * Subjects endpoints
   */
  subjects = {
    // Retrieves all data.
    getAll: async () => {
      try {
        // Load subjects from the backend for course filtering and admin forms.
        const response = await this.client.get('/subjects');
        return response.data as ApiResponse<any>;
      } catch (error) {
        return this.handleError(error);
      }
    },

    // Retrieves by id data.
    getById: async (id: string) => {
      try {
        const response = await this.client.get(`/subjects/${id}`);
        return response.data as ApiResponse<any>;
      } catch (error) {
        return this.handleError(error);
      }
    },

    // Creates a new record.
    create: async (data: any) => {
      try {
        const response = await this.client.post('/subjects', data);
        return response.data as ApiResponse<any>;
      } catch (error) {
        return this.handleError(error);
      }
    },

    // Updates an existing record.
    update: async (id: string, data: any) => {
      try {
        const response = await this.client.put(`/subjects/${id}`, data);
        return response.data as ApiResponse<any>;
      } catch (error) {
        return this.handleError(error);
      }
    },

    // Deletes an existing record.
    delete: async (id: string) => {
      try {
        const response = await this.client.delete(`/subjects/${id}`);
        return response.data as ApiResponse<any>;
      } catch (error) {
        return this.handleError(error);
      }
    },
  };

  /**
   * Upload endpoints
   */
  upload = {
    image: async (file: File, folder: 'subjects' | 'courses' | 'questions' | 'chapters' = 'subjects') => {
      try {
        const formData = new FormData();
        formData.append('image', file);

        // Use the Next.js upload proxy so files go through backend validation before Supabase.
        const response = await axios.post(`/api/upload?folder=${folder}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'x-user-id': this.client.defaults.headers.common['x-user-id'] || '',
          },
        });

        return response.data as ApiResponse<{
          imageUrl: string;
          fileName: string;
          size: number;
        }>;
      } catch (error) {
        return this.handleError(error);
      }
    },
  };

  /**
   * Error handling
   */
  private handleError(error: any): ApiResponse<any> {
    if (error instanceof AxiosError) {
      const data = error.response?.data as ApiResponse<any>;
      return data || {
        success: false,
        message: error.message || 'An error occurred',
        error: error.message,
      };
    }

    return {
      success: false,
      message: 'An error occurred',
      error: String(error),
    };
  }
}

export const apiClient = new ApiClient();
