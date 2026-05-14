'use client';

import { useState, useCallback, useEffect } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'admin';
}

function saveAuthSession(data: any) {
  const { token, expiresAt, ...userData } = data || {};

  localStorage.setItem('user', JSON.stringify(userData));
  if (expiresAt) {
    localStorage.setItem('authExpiresAt', expiresAt);
  }
  localStorage.setItem('authLastActivity', String(Date.now()));
  window.dispatchEvent(new Event('auth-state-changed'));
}

function clearAuthSession() {
  localStorage.removeItem('user');
  localStorage.removeItem('authToken');
  localStorage.removeItem('authExpiresAt');
  localStorage.removeItem('authLastActivity');
  void fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'logout' }),
  });
  window.dispatchEvent(new Event('auth-state-changed'));
}

interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  initialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateProfile: (name?: string, email?: string, newPassword?: string) => Promise<void>;
  loadUser: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 👇 НОВОЕ СОСТОЯНИЕ
  const [initialized, setInitialized] = useState(false);

  const normalizeUser = useCallback((input: any): User | null => {
    if (!input) {
      return null;
    }

    const id = input.id || input._id;
    if (!id || !input.email || !input.name) {
      return null;
    }

    return {
      id: String(id),
      email: String(input.email),
      name: String(input.name),
      role: input.role === 'admin' ? 'admin' : 'student',
    };
  }, []);

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
        const normalizedUser = normalizeUser(data.data);
        setUser(normalizedUser);
        saveAuthSession(data.data);
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
        const normalizedUser = normalizeUser(data.data);
        setUser(normalizedUser);
        saveAuthSession(data.data);
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
    clearAuthSession();
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
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();
      if (data.success) {
        const updatedUser = normalizeUser(data.data) || {
          ...user,
          ...(name && { name }),
          ...(email && { email }),
        };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        localStorage.setItem('authLastActivity', String(Date.now()));
        window.dispatchEvent(new Event('auth-state-changed'));
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [user, normalizeUser]);

  // 👇 ИЗМЕНЁННЫЙ loadUser
  const loadUser = useCallback(async () => {
    try {
      const storedUser = localStorage.getItem('user');

      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        const normalizedStoredUser = normalizeUser(parsedUser);

        if (!normalizedStoredUser) {
          setUser(null);
          clearAuthSession();
          return;
        }

        const response = await fetch(`/api/users/${normalizedStoredUser.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': normalizedStoredUser.id,
          },
        });

        if (!response.ok) {
          setUser(normalizedStoredUser);
          return;
        }

        const data = await response.json();
        const freshUser = normalizeUser(data?.data);

        if (!freshUser) {
          setUser(normalizedStoredUser);
          return;
        }

        setUser(freshUser);
        localStorage.setItem('user', JSON.stringify(freshUser));
        localStorage.setItem('authLastActivity', String(Date.now()));
      } else {
        setUser(null);
        clearAuthSession();
      }
    } catch (err) {
      console.error('Failed to parse stored user:', err);
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        setUser(null);
        return;
      }

      try {
        const parsed = JSON.parse(storedUser);
        const normalized = normalizeUser(parsed);
        setUser(normalized);
      } catch {
        setUser(null);
      }
    } finally {
      setInitialized(true);
    }
  }, [normalizeUser]);

  return {
    user,
    isLoading,
    error,
    initialized,
    login,
    signup,
    logout,
    updateProfile,
    loadUser,
  };
};
