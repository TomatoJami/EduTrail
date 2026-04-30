'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { ProtectedPage } from '@/components/common/ProtectedPage';
import { AccountSidebar } from '@/components/common/AccountSidebar';
import { useAuth } from '@/hooks/useAuth';

interface Subject {
  _id: string;
  name?: string;
  subject_name?: string;
}

export default function PreferencesPage() {
  const { user, loadUser } = useAuth();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [ageGroup, setAgeGroup] = useState<'1-3' | '4-9' | '10-12' | ''>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchSubjects();
      if (user?.id) {
        await fetchUserPreferences();
      }
      setLoading(false);
    };
    loadData();
  }, [user?.id]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/subjects');
      const data = await response.json();

      if (data.success) {
        setSubjects(data.data || []);
      }
    } catch (err) {
      setError('Failed to load subjects');
    }
  };

  const fetchUserPreferences = async () => {
    try {
      const response = await fetch(`/api/users/${user?.id}`);
      const data = await response.json();

      if (data.success && data.data) {
        console.log('User preferences loaded:', data.data);
        
        if (data.data.preferredSubjects && Array.isArray(data.data.preferredSubjects)) {
          const subjectIds = data.data.preferredSubjects.map((subj: any) => {
            if (typeof subj === 'string') return subj;
            if (subj && typeof subj === 'object' && '_id' in subj) return subj._id;
            return null;
          }).filter((id: string | null) => id !== null);
          
          setSelectedSubjects(subjectIds);
        }
        
        if (data.data.ageGroup) {
          setAgeGroup(data.data.ageGroup);
        }
      }
    } catch (err) {
      console.error('Failed to fetch user preferences:', err);
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
    setSaveMessage(null);

    try {
      const response = await fetch(`/api/users/${user?.id}/preferences`, {
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

      setSaveMessage({ type: 'success', text: 'Preferences saved successfully!' });
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

//    if (loading) {
//      return (
//        <ProtectedPage>
//          <Header />
//          <div className="flex-1 flex items-center justify-center">
//            <div className="text-center">
//              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
//              <p className="mt-4 text-gray-600">Loading preferences...</p>
//            </div>
//          </div>
//          <Footer />
//        </ProtectedPage>
//      );
//  }

  return (
    <ProtectedPage>
      <Header />
      <main className="flex flex-1">
        <AccountSidebar />

        {/* Main Content */}
        <div className="flex-1 bg-white">
          <div className="min-h-[calc(100vh-4rem)] flex items-start justify-center pt-12 px-4">
            <div className="w-full max-w-2xl">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Your Preferences
                </h1>
                <p className="text-gray-600">
                  Manage your learning preferences and education level.
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  {error}
                </div>
              )}

              {/* Success Message */}
              {saveMessage && (
                <div className={`mb-6 p-4 rounded-lg ${
                  saveMessage.type === 'success'
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {saveMessage.text}
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
                        type="checkbox"
                        checked={ageGroup === group}
                        onChange={() =>
                            setAgeGroup(ageGroup === group ? '' : (group as '1-3' | '4-9' | '10-12'))
                        }
                        className="w-5 h-5 text-indigo-600 border-gray-300 rounded cursor-pointer"
                        />
                        <span className="text-gray-700 font-medium">
                          {group === '1-3' && 'Grades 1-3'}
                          {group === '4-9' && 'Grades 4-9'}
                          {group === '10-12' && 'Grades 10-12'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-4 justify-end pt-8 border-t border-gray-200">
                <button
                  onClick={handleSavePreferences}
                  disabled={saving || !ageGroup}
                  className="px-6 py-2 bg-white border border-gray-300 text-gray-800 font-semibold rounded hover:bg-gray-50 disabled:bg-gray-100 transition"
                >
                  {saving ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </ProtectedPage>
  );
}
