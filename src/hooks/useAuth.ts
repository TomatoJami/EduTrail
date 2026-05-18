'use client';

import { useState, useCallback } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'admin';
}

function saveAuthSession(data: any) {
  // Stores only safe user/session metadata in browser storage.
  const { token: _token, expiresAt, ...userData } = data || {};

  localStorage.setItem('user', JSON.stringify(userData));
  if (expiresAt) {
    localStorage.setItem('authExpiresAt', expiresAt);
  }
  localStorage.setItem('authLastActivity', String(Date.now()));
  window.dispatchEvent(new Event('auth-state-changed'));
}

function clearAuthSession() {
  // Removes local auth state and asks the backend proxy to clear auth cookies.
  localStorage.removeItem('user');
  localStorage.removeItem('authToken');
  localStorage.removeItem('authExpiresAt');
  localStorage.removeItem('authLastActivity');
  // Tell the auth proxy to clear the HTTP-only session cookie as well.
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
  // Centralizes auth state and profile actions for client components.
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tracks whether the initial auth state has been loaded.
  const [initialized, setInitialized] = useState(false);

  const normalizeUser = useCallback((input: any): User | null => {
    // Converts backend user shapes into the frontend User contract.
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
    // Authenticates the user and stores the normalized session on success.
    setIsLoading(true);
    setError(null);
    try {
      // Login goes through the Next.js API route so token cookies stay server-managed.
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
  }, [normalizeUser]);

  const signup = useCallback(async (email: string, password: string, name: string) => {
    // Creates a user account and stores the normalized session on success.
    setIsLoading(true);
    setError(null);
    try {
      // Signup uses the auth proxy and stores the normalized user after success.
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
  }, [normalizeUser]);

  const logout = useCallback(() => {
    // Clears React state and all persisted auth state.
    setUser(null);
    clearAuthSession();
  }, []);

  const updateProfile = useCallback(async (name?: string, email?: string, newPassword?: string) => {
    // Sends only changed profile fields to the backend.
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

      // Persist profile changes through the user proxy with only changed fields.
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

  // Restores the current user from local storage and validates it with the API.
  const loadUser = useCallback(async () => {
    // Restores the local session and refreshes it from the backend when possible.
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

        // Refresh the stored user from the backend so role/profile changes are reflected.
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
