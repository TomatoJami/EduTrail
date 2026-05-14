'use client';

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { validatePassword } from "@/utils/helpers";

const getPasswordRequirements = (password: string) => [
  { label: '8+ characters', met: password.length >= 8 },
  { label: '1 letter', met: /[A-Za-z]/.test(password) },
  { label: '1 uppercase letter', met: /[A-Z]/.test(password) },
  { label: '1 digit', met: /\d/.test(password) },
  { label: '1 special character', met: /[^A-Za-z0-9]/.test(password) },
];

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedPersonalData, setAcceptedPersonalData] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validation = validatePassword(password);
    if (!validation.valid) {
      setError(validation.message || 'Invalid password');
      return;
    }

    if (!acceptedPersonalData) {
      setError('You must agree to personal data processing to register');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'signup',
          name,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.details || data.message || 'Registration failed';
        setError(errorMessage);
        return;
      }

      if (data.data?.id) {
        sessionStorage.setItem('newUserData', JSON.stringify({
          id: data.data.id,
          email: data.data.email,
          name: data.data.name,
        }));
        setShowSuccessModal(true);
        window.setTimeout(() => {
          router.push('/login');
        }, 1800);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logoblack.png"
              alt="EduTrail Logo"
              width={200}
              height={100}
            />
          </Link>
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Registration</h1>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name
            </label>
            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              // required
              disabled={loading}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="text"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              // required
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
              // required
              disabled={loading}
            />
            <div className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
              {getPasswordRequirements(password).map((requirement) => (
                <span
                  key={requirement.label}
                  className={`text-xs ${requirement.met ? 'text-green-600' : 'text-gray-600'}`}
                >
                  {requirement.met ? '✓' : '•'} {requirement.label}
                </span>
              ))}
            </div>
          </div>

          <label className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={acceptedPersonalData}
              onChange={(e) => setAcceptedPersonalData(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
              disabled={loading}
            />
            <span>I agree to the processing of my personal data</span>
          </label>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition font-medium mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Continue'}
            {!loading && <span>→</span>}
          </button>
        </form>

        {/* Log In Link */}
        <div className="text-center mt-6 text-gray-600">
          Already have an account?{" "}
          <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
            Log In
          </Link>
        </div>
      </div>

      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 text-center shadow-xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl font-bold text-green-600">
              OK
            </div>
            <h2 className="text-xl font-bold text-gray-900">Registration successful</h2>
            <p className="mt-2 text-sm text-gray-600">
              Your account has been created. Redirecting to login...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
