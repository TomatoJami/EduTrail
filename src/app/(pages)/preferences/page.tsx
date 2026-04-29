'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Subject {
  _id: string;
  name?: string;
  subject_name?: string;
}

interface NewUserData {
  id: string;
  email: string;
  name: string;
}

export default function PreferencesPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<NewUserData | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [ageGroup, setAgeGroup] = useState<'1-3' | '4-9' | '10-12' | ''>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is newly registered
    const newUserData = sessionStorage.getItem('newUserData');
    if (!newUserData) {
      // Not a new user - redirect to login
      router.push('/login');
      return;
    }

    try {
      const user = JSON.parse(newUserData);
      setUserData(user);
    } catch (err) {
      router.push('/login');
      return;
    }

    // Fetch all subjects
    fetchSubjects();
  }, [router]);

  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/subjects');
      const data = await response.json();

      if (data.success) {
        setSubjects(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch subjects:', err);
      setError('Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleSavePreferences = async () => {
    if (!ageGroup) {
      setError('Please select an age group');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await fetch(`/api/users/${userData?.id}/preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preferredSubjects: selectedSubjects,
          ageGroup,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to save preferences');
        return;
      }

      // Success - clear sessionStorage and redirect to home
      sessionStorage.removeItem('newUserData');
      router.push('/');
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    setSaving(true);
    setError('');

    try {
      const response = await fetch(`/api/users/${userData?.id}/preferences/skip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to skip preferences');
        return;
      }

      // Success - clear sessionStorage and redirect to home
      sessionStorage.removeItem('newUserData');
      router.push('/');
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 px-4 py-12">
      <div className="max-w-3xl mx-auto">
        {/* Logo */}
        <div className="flex justify-center mb-12">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logoblack.png"
              alt="EduTrail Logo"
              width={200}
              height={100}
            />
          </Link>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Select what you would like to learn
            </h1>
            <p className="text-gray-600">
              Help us personalize your learning experience. Choose your interests and education level.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Two Column Layout */}
          <div className="grid md:grid-cols-2 gap-12 mb-8">
            {/* Subjects */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Subjects</h2>
              <div className="space-y-3">
                {subjects.length > 0 ? (
                  subjects.map((subject) => (
                    <label
                      key={subject._id}
                      className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSubjects.includes(subject._id)}
                        onChange={() => handleSubjectChange(subject._id)}
                        className="w-5 h-5 text-indigo-600 border-gray-300 rounded cursor-pointer"
                      />
                      <span className="text-gray-700 font-medium">{subject.subject_name || subject.name}</span>
                    </label>
                  ))
                ) : (
                  <p className="text-gray-500">No subjects available</p>
                )}
              </div>
            </div>

            {/* Age Groups */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Level of education</h2>
              <div className="space-y-3">
                {['1-3', '4-9', '10-12'].map((group) => (
                  <label
                    key={group}
                    className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition"
                  >
                    <input
                      type="radio"
                      name="ageGroup"
                      value={group}
                      checked={ageGroup === group}
                      onChange={(e) => setAgeGroup(e.target.value as '1-3' | '4-9' | '10-12')}
                      className="w-5 h-5 text-indigo-600 border-gray-300 cursor-pointer"
                    />
                    <span className="text-gray-700 font-medium">
                      {group === '1-3' && 'Primary general education (Grades 1-3)'}
                      {group === '4-9' && 'Basic general education (Grades 4-9)'}
                      {group === '10-12' && 'Secondary general education (Grades 10-12)'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 justify-end pt-8 border-t border-gray-200">
            <button
              onClick={handleSkip}
              disabled={saving}
              className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Skip
            </button>
            <button
              onClick={handleSavePreferences}
              disabled={saving || !ageGroup}
              className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Continue
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
