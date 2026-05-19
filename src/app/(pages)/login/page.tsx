'use client';

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

/** Renders the login page interface. */
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  /** Renders the handle submit interface. */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Authenticate through the Next.js API route so cookies and token cleanup stay centralized.
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'login',
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Login failed');
        return;
      }

      if (data?.data) {
        const { token: _token, expiresAt, ...user } = data.data;
        localStorage.setItem('user', JSON.stringify(user));
        if (expiresAt) {
          localStorage.setItem('authExpiresAt', expiresAt);
        }
        localStorage.setItem('authLastActivity', String(Date.now()));
        window.dispatchEvent(new Event('auth-state-changed'));
      }

      router.push('/');
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Returns the JSX layout for this render state.
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logoblack.png"
              alt="EduTrail Logo"
              width={216}
              height={70}
              loading="eager"
              style={{ height: "auto" }}
            />
          </Link>
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Log In</h1>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              required
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              required
              disabled={loading}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition font-medium mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Continue'}
            {!loading && <span>→</span>}
          </button>
        </form>

        {/* Sign Up Link */}
        <div className="text-center mt-6 text-gray-600">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-indigo-600 hover:text-indigo-700 font-medium">
            Sign up
          </Link>
        </div>

        <div className="text-center mt-3 text-gray-600">
          <Link href="/forgot-password" className="text-indigo-600 hover:text-indigo-700 font-medium">
            Forgot password?
          </Link>
        </div>
      </div>
    </div>
  );
}
