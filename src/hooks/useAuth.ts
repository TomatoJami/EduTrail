/**
 * Custom Hook для работы с аутентификацией на фронтенде
 * Используется в React компонентах
 */

'use client';

import { useState, useCallback } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'admin';
}

interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateProfile: (name?: string, email?: string, newPassword?: string) => Promise<void>;
  loadUser: () => void;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password }),
      });

      const data = await response.json();
      if (data.success) {
        setUser(data.data);
        localStorage.setItem('user', JSON.stringify(data.data));
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'signup', email, password, name }),
      });

      const data = await response.json();
      if (data.success) {
        setUser(data.data);
        localStorage.setItem('user', JSON.stringify(data.data));
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('user');
  }, []);

  const updateProfile = useCallback(async (name?: string, email?: string, newPassword?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      if (!user) {
        setError('User not logged in');
        return;
      }

      const updateData: any = {};
      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (newPassword) updateData.password = newPassword;

      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();
      if (data.success) {
        const updatedUser = {
          ...user,
          ...(name && { name }),
          ...(email && { email }),
        };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const loadUser = useCallback(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Failed to parse stored user:', err);
      }
    }
  }, []);

  return { user, isLoading, error, login, signup, logout, updateProfile, loadUser };
};
