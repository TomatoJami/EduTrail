import axios, { AxiosInstance, AxiosError } from 'axios';
import { ApiResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
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
    return this.client.defaults.headers.common['x-user-id'] as string;
  }

  /**
   * Auth endpoints
   */
  auth = {
    signup: async (email: string, password: string, name: string) => {
      try {
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
        const response = await this.client.post('/auth/login', {
          email,
          password,
        });
        return response.data as ApiResponse<any>;
      } catch (error) {
        return this.handleError(error);
      }
    },

    getUser: async (id: string) => {
      try {
        const response = await this.client.get(`/auth/${id}`);
        return response.data as ApiResponse<any>;
      } catch (error) {
        return this.handleError(error);
      }
    },

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
    getAll: async () => {
      try {
        const response = await this.client.get('/courses');
        return response.data as ApiResponse<any>;
      } catch (error) {
        return this.handleError(error);
      }
    },

    getById: async (id: string) => {
      try {
        const response = await this.client.get(`/courses/${id}`);
        return response.data as ApiResponse<any>;
      } catch (error) {
        return this.handleError(error);
      }
    },

    create: async (data: any) => {
      try {
        const response = await this.client.post('/courses', data);
        return response.data as ApiResponse<any>;
      } catch (error) {
        return this.handleError(error);
      }
    },

    update: async (id: string, data: any) => {
      try {
        const response = await this.client.put(`/courses/${id}`, data);
        return response.data as ApiResponse<any>;
      } catch (error) {
        return this.handleError(error);
      }
    },

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
    getAll: async () => {
      try {
        const response = await this.client.get('/subjects');
        return response.data as ApiResponse<any>;
      } catch (error) {
        return this.handleError(error);
      }
    },

    getById: async (id: string) => {
      try {
        const response = await this.client.get(`/subjects/${id}`);
        return response.data as ApiResponse<any>;
      } catch (error) {
        return this.handleError(error);
      }
    },

    create: async (data: any) => {
      try {
        const response = await this.client.post('/subjects', data);
        return response.data as ApiResponse<any>;
      } catch (error) {
        return this.handleError(error);
      }
    },

    update: async (id: string, data: any) => {
      try {
        const response = await this.client.put(`/subjects/${id}`, data);
        return response.data as ApiResponse<any>;
      } catch (error) {
        return this.handleError(error);
      }
    },

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
    image: async (file: File, folder: 'subjects' | 'courses' = 'subjects') => {
      try {
        const formData = new FormData();
        formData.append('image', file);

        const response = await this.client.post(`/upload?folder=${folder}`, formData, {
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
