'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { CourseAgeGroup } from '@/types';
import { ImageUploader } from '@/components/ImageUploader';
import { apiClient } from '@/utils/apiClient';

type AuthUser = {
  id: string;
  role: 'student' | 'admin';
};

type SubjectItem = {
  _id: string;
  subject_name: string;
  subject_img: string;
};

type CourseSubject =
  | string
  | {
      _id: string;
      subject_name?: string;
    };

type CourseItem = {
  _id: string;
  title: string;
  description: string;
  ageGroup: CourseAgeGroup;
  course_img: string;
  subject_id: CourseSubject;
};

const ageGroups: CourseAgeGroup[] = ['1-3', '4-9', '10-12'];

const parseStoredUser = (): AuthUser | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = localStorage.getItem('user');
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AuthUser>;
    if (!parsed.id || !parsed.role) {
      return null;
    }

    return {
      id: parsed.id,
      role: parsed.role,
    };
  } catch {
    return null;
  }
};

export default function AdminPage() {
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);

  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectImage, setNewSubjectImage] = useState('');

  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseDescription, setNewCourseDescription] = useState('');
  const [newCourseAgeGroup, setNewCourseAgeGroup] = useState<CourseAgeGroup>('1-3');
  const [newCourseImage, setNewCourseImage] = useState('');
  const [newCourseSubjectId, setNewCourseSubjectId] = useState('');

  const [editingSubject, setEditingSubject] = useState<SubjectItem | null>(null);
  const [editingCourse, setEditingCourse] = useState<CourseItem | null>(null);

  const [showSubjectImageUploader, setShowSubjectImageUploader] = useState(false);
  const [showCourseImageUploader, setShowCourseImageUploader] = useState(false);
  const [showEditSubjectImageUploader, setShowEditSubjectImageUploader] = useState(false);
  const [showEditCourseImageUploader, setShowEditCourseImageUploader] = useState(false);

  const subjectNameById = useMemo(() => {
    return subjects.reduce<Record<string, string>>((acc, item) => {
      acc[item._id] = item.subject_name;
      return acc;
    }, {});
  }, [subjects]);

  const adminHeaders = useMemo(() => {
    if (!user) {
      return null;
    }

    return {
      'Content-Type': 'application/json',
      'x-user-id': user.id,
    };
  }, [user]);

  const loadData = async (headers: Record<string, string>) => {
    setLoading(true);
    setError('');

    try {
      const [subjectsRes, coursesRes] = await Promise.all([
        fetch('/api/subjects', { headers }),
        fetch('/api/courses', { headers }),
      ]);

      const subjectsJson = await subjectsRes.json();
      const coursesJson = await coursesRes.json();

      if (!subjectsRes.ok) {
        throw new Error(subjectsJson.message || 'Failed to load subjects');
      }

      if (!coursesRes.ok) {
        throw new Error(coursesJson.message || 'Failed to load courses');
      }

      setSubjects(subjectsJson.data || []);
      setCourses(coursesJson.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const currentUser = parseStoredUser();

    if (!currentUser || currentUser.role !== 'admin') {
      router.replace('/');
      return;
    }

    setUser(currentUser);
    apiClient.setUserId(currentUser.id);
    setCheckingAccess(false);
    void loadData({
      'Content-Type': 'application/json',
      'x-user-id': currentUser.id,
    });
  }, [router]);

  const handleCreateSubject = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!adminHeaders) {
      return;
    }

    setError('');

    try {
      const response = await fetch('/api/subjects', {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          subject_name: newSubjectName,
          subject_img: newSubjectImage,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create subject');
      }

      setNewSubjectName('');
      setNewSubjectImage('');
      setShowSubjectImageUploader(false);
      await loadData(adminHeaders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create subject');
    }
  };

  const handleUpdateSubject = async () => {
    if (!adminHeaders || !editingSubject) {
      return;
    }

    setError('');

    try {
      const response = await fetch('/api/subjects', {
        method: 'PUT',
        headers: adminHeaders,
        body: JSON.stringify(editingSubject),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update subject');
      }

      setEditingSubject(null);
      setShowEditSubjectImageUploader(false);
      await loadData(adminHeaders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update subject');
    }
  };

  const handleDeleteSubject = async (id: string) => {
    if (!adminHeaders) {
      return;
    }

    setError('');

    try {
      const response = await fetch('/api/subjects', {
        method: 'DELETE',
        headers: adminHeaders,
        body: JSON.stringify({ id }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete subject');
      }

      await loadData(adminHeaders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete subject');
    }
  };

  const handleCreateCourse = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!adminHeaders) {
      return;
    }

    setError('');

    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          title: newCourseTitle,
          description: newCourseDescription,
          ageGroup: newCourseAgeGroup,
          course_img: newCourseImage,
          subject_id: newCourseSubjectId,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create course');
      }

      setNewCourseTitle('');
      setNewCourseDescription('');
      setNewCourseAgeGroup('1-3');
      setNewCourseImage('');
      setNewCourseSubjectId('');
      setShowCourseImageUploader(false);
      await loadData(adminHeaders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create course');
    }
  };

  const handleUpdateCourse = async () => {
    if (!adminHeaders || !editingCourse) {
      return;
    }

    const subjectId =
      typeof editingCourse.subject_id === 'string'
        ? editingCourse.subject_id
        : editingCourse.subject_id?._id;

    setError('');

    try {
      const response = await fetch('/api/courses', {
        method: 'PUT',
        headers: adminHeaders,
        body: JSON.stringify({
          id: editingCourse._id,
          title: editingCourse.title,
          description: editingCourse.description,
          ageGroup: editingCourse.ageGroup,
          course_img: editingCourse.course_img,
          subject_id: subjectId,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update course');
      }

      setEditingCourse(null);
      setShowEditCourseImageUploader(false);
      await loadData(adminHeaders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update course');
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!adminHeaders) {
      return;
    }

    setError('');

    try {
      const response = await fetch('/api/courses', {
        method: 'DELETE',
        headers: adminHeaders,
        body: JSON.stringify({ id }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete course');
      }

      await loadData(adminHeaders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete course');
    }
  };

  if (checkingAccess) {
    return <section className="min-h-screen bg-slate-100" />;
  }

  return (
    <main className="min-h-screen bg-slate-100 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Admin panel</h1>
            <p className="text-sm text-slate-600">Manage subjects and courses</p>
          </div>
          <Link
            href="/"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Back to home
          </Link>
        </div>

        {error ? (
          <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">Subjects</h2>

            <form className="mb-6 space-y-3" onSubmit={handleCreateSubject}>
              <input
                type="text"
                placeholder="Subject name"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                required
              />
              {!showSubjectImageUploader ? (
                <div>
                  {newSubjectImage && (
                    <div className="mb-2 space-y-2">
                      <img
                        src={newSubjectImage}
                        alt="Subject preview"
                        className="h-20 w-20 rounded-lg object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setNewSubjectImage('');
                          setShowSubjectImageUploader(true);
                        }}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                      >
                        Change image
                      </button>
                    </div>
                  )}
                  {!newSubjectImage && (
                    <button
                      type="button"
                      onClick={() => setShowSubjectImageUploader(true)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Select image
                    </button>
                  )}
                </div>
              ) : (
                <ImageUploader
                  folder="subjects"
                  onImageUpload={(imageUrl) => {
                    setNewSubjectImage(imageUrl);
                    setShowSubjectImageUploader(false);
                  }}
                />
              )}
              <button
                type="submit"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Create subject
              </button>
            </form>

            <div className="space-y-3">
              {subjects.map((subject) => {
                const isEditing = editingSubject?._id === subject._id;

                return (
                  <article key={subject._id} className="rounded-lg border border-slate-200 p-3">
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editingSubject.subject_name}
                          onChange={(e) =>
                            setEditingSubject({ ...editingSubject, subject_name: e.target.value })
                          }
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                        {!showEditSubjectImageUploader ? (
                          <div>
                            {editingSubject.subject_img && (
                              <div className="mb-2 space-y-2">
                                <img
                                  src={editingSubject.subject_img}
                                  alt="Subject preview"
                                  className="h-20 w-20 rounded-lg object-cover"
                                />
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => setShowEditSubjectImageUploader(true)}
                              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              Update image
                            </button>
                          </div>
                        ) : (
                          <div>
                            <ImageUploader
                              folder="subjects"
                              onImageUpload={(imageUrl) => {
                                setEditingSubject({ ...editingSubject, subject_img: imageUrl });
                                setShowEditSubjectImageUploader(false);
                              }}
                            />
                          </div>
                        )}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleUpdateSubject}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSubject(null);
                              setShowEditSubjectImageUploader(false);
                            }}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-slate-900">{subject.subject_name}</p>
                          <p className="text-xs text-slate-500 break-all">{subject.subject_img}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingSubject(subject)}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSubject(subject._id)}
                            className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}

              {!subjects.length && !loading ? (
                <p className="text-sm text-slate-500">No subjects yet.</p>
              ) : null}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">Courses</h2>

            <form className="mb-6 space-y-3" onSubmit={handleCreateCourse}>
              <input
                type="text"
                placeholder="Course title"
                value={newCourseTitle}
                onChange={(e) => setNewCourseTitle(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                required
              />
              <textarea
                placeholder="Course description"
                value={newCourseDescription}
                onChange={(e) => setNewCourseDescription(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                rows={3}
                required
              />
              <select
                value={newCourseAgeGroup}
                onChange={(e) => setNewCourseAgeGroup(e.target.value as CourseAgeGroup)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
              >
                {ageGroups.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
              {!showCourseImageUploader ? (
                <div>
                  {newCourseImage && (
                    <div className="mb-2 space-y-2">
                      <img
                        src={newCourseImage}
                        alt="Course preview"
                        className="h-20 w-20 rounded-lg object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setNewCourseImage('');
                          setShowCourseImageUploader(true);
                        }}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                      >
                        Change image
                      </button>
                    </div>
                  )}
                  {!newCourseImage && (
                    <button
                      type="button"
                      onClick={() => setShowCourseImageUploader(true)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Select image
                    </button>
                  )}
                </div>
              ) : (
                <ImageUploader
                  folder="courses"
                  onImageUpload={(imageUrl) => {
                    setNewCourseImage(imageUrl);
                    setShowCourseImageUploader(false);
                  }}
                />
              )}
              <select
                value={newCourseSubjectId}
                onChange={(e) => setNewCourseSubjectId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                required
              >
                <option value="">Select subject</option>
                {subjects.map((subject) => (
                  <option key={subject._id} value={subject._id}>
                    {subject.subject_name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Create course
              </button>
            </form>

            <div className="space-y-3">
              {courses.map((course) => {
                const isEditing = editingCourse?._id === course._id;
                const currentSubjectId =
                  typeof course.subject_id === 'string' ? course.subject_id : course.subject_id?._id;
                const currentSubjectName =
                  typeof course.subject_id === 'string'
                    ? subjectNameById[course.subject_id] || 'Unknown subject'
                    : course.subject_id?.subject_name || subjectNameById[course.subject_id._id] || 'Unknown subject';

                return (
                  <article key={course._id} className="rounded-lg border border-slate-200 p-3">
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editingCourse.title}
                          onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                        <textarea
                          value={editingCourse.description}
                          onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          rows={2}
                        />
                        <select
                          value={editingCourse.ageGroup}
                          onChange={(e) =>
                            setEditingCourse({ ...editingCourse, ageGroup: e.target.value as CourseAgeGroup })
                          }
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        >
                          {ageGroups.map((group) => (
                            <option key={group} value={group}>
                              {group}
                            </option>
                          ))}
                        </select>
                        {!showEditCourseImageUploader ? (
                          <div>
                            {editingCourse.course_img && (
                              <div className="mb-2 space-y-2">
                                <img
                                  src={editingCourse.course_img}
                                  alt="Course preview"
                                  className="h-20 w-20 rounded-lg object-cover"
                                />
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => setShowEditCourseImageUploader(true)}
                              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              Update image
                            </button>
                          </div>
                        ) : (
                          <div>
                            <ImageUploader
                              folder="courses"
                              onImageUpload={(imageUrl) => {
                                setEditingCourse({ ...editingCourse, course_img: imageUrl });
                                setShowEditCourseImageUploader(false);
                              }}
                            />
                          </div>
                        )}
                        <select
                          value={
                            typeof editingCourse.subject_id === 'string'
                              ? editingCourse.subject_id
                              : editingCourse.subject_id?._id
                          }
                          onChange={(e) =>
                            setEditingCourse({
                              ...editingCourse,
                              subject_id: e.target.value,
                            })
                          }
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        >
                          {subjects.map((subject) => (
                            <option key={subject._id} value={subject._id}>
                              {subject.subject_name}
                            </option>
                          ))}
                        </select>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleUpdateCourse}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCourse(null);
                              setShowEditCourseImageUploader(false);
                            }}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-slate-900">{course.title}</p>
                          <p className="text-xs text-slate-600">{course.description}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            Age: {course.ageGroup} | Subject: {currentSubjectName}
                          </p>
                          <p className="text-xs text-slate-500 break-all">{course.course_img}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setEditingCourse({
                                ...course,
                                subject_id: currentSubjectId,
                              })
                            }
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCourse(course._id)}
                            className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}

              {!courses.length && !loading ? (
                <p className="text-sm text-slate-500">No courses yet.</p>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
