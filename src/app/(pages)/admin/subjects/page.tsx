"use client";

import { useEffect, useMemo, useState } from "react";
import { ImageUploader } from "@/components/ImageUploader";

/** Defines the TypeScript shape for subject item. */
type SubjectItem = {
  _id: string;
  subject_name: string;
  subject_img: string;
};

/** Defines the TypeScript shape for course item. */
type CourseItem = {
  _id: string;
  subject_id: string | { _id: string };
};

/** Defines the TypeScript shape for stored user. */
type StoredUser = {
  id?: string;
  _id?: string;
};

/** Renders the get user id interface. */
const getUserId = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = localStorage.getItem("user");
  if (!raw) {
    return null;
  }

  try {
    const user = JSON.parse(raw) as StoredUser;
    return user._id || user.id || null;
  } catch {
    return null;
  }
};

/** Renders the admin subjects page interface. */
export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [editingSubject, setEditingSubject] = useState<SubjectItem | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectImage, setNewSubjectImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showEditUploader, setShowEditUploader] = useState(false);
  const [showCreateUploader, setShowCreateUploader] = useState(false);

  const courseCountBySubject = useMemo(() => {
    const counts: Record<string, number> = {};

    courses.forEach((course) => {
      const subjectId = typeof course.subject_id === "string" ? course.subject_id : course.subject_id?._id;
      if (!subjectId) return;
      counts[subjectId] = (counts[subjectId] || 0) + 1;
    });

    return counts;
  }, [courses]);

  /** Renders the load data interface. */
  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      // Load subjects and courses together so the admin view can show course counts.
      const [subjectsRes, coursesRes] = await Promise.all([fetch("/api/subjects"), fetch("/api/courses")]);

      if (!subjectsRes.ok) {
        const errorText = await subjectsRes.text();
        throw new Error(`Failed to fetch subjects (${subjectsRes.status}): ${errorText}`);
      }

      const subjectsJson = await subjectsRes.json();

      if (subjectsJson?.success === false) {
        throw new Error(subjectsJson?.message || "API returned error for subjects");
      }

      if (!coursesRes.ok) {
        const errorText = await coursesRes.text();
        throw new Error(`Failed to fetch courses (${coursesRes.status}): ${errorText}`);
      }

      const coursesJson = await coursesRes.json();

      if (coursesJson?.success === false) {
        throw new Error(coursesJson?.message || "API returned error for courses");
      }

      setSubjects(subjectsJson.data || []);
      setCourses(coursesJson.data || []);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to load admin subjects";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Synchronizes browser state or side effects after render.
  useEffect(() => {
    void loadData();
  }, []);

  /** Renders the handle create interface. */
  const handleCreate = async () => {
    if (!newSubjectName.trim()) {
      setError("Subject name is required");
      return;
    }

    if (!newSubjectImage.trim()) {
      setError("Subject image is required");
      return;
    }

    const userId = getUserId();
    if (!userId) {
      setError("Unauthorized: user id not found");
      return;
    }

    setSaving(true);
    setError("");

    try {
      // Create the subject through the admin API proxy.
      const response = await fetch("/api/subjects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({
          subject_name: newSubjectName.trim(),
          subject_img: newSubjectImage.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok || data?.success === false) {
        throw new Error(data?.message || "Failed to create subject");
      }

      setIsCreatingNew(false);
      setNewSubjectName("");
      setNewSubjectImage("");
      setShowCreateUploader(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create subject");
    } finally {
      setSaving(false);
    }
  };

  /** Renders the handle delete interface. */
  const handleDelete = async (subject: SubjectItem) => {
    const userId = getUserId();
    if (!userId) {
      setError("Unauthorized: user id not found");
      return;
    }

    const attachedCourses = courseCountBySubject[subject._id] || 0;
    const message =
      attachedCourses > 0
        ? `Delete '${subject.subject_name}' and ${attachedCourses} related course(s)?`
        : `Delete '${subject.subject_name}'?`;

    const confirmed = window.confirm(message);
    if (!confirmed) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/subjects", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({ id: subject._id }),
      });

      const data = await response.json();
      if (!response.ok || data?.success === false) {
        throw new Error(data?.message || "Failed to delete subject");
      }

      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete subject");
    } finally {
      setSaving(false);
    }
  };

  /** Renders the handle update interface. */
  const handleUpdate = async () => {
    if (!editingSubject) {
      return;
    }

    const userId = getUserId();
    if (!userId) {
      setError("Unauthorized: user id not found");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/subjects", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({
          id: editingSubject._id,
          subject_name: editingSubject.subject_name,
          subject_img: editingSubject.subject_img,
        }),
      });

      const data = await response.json();
      if (!response.ok || data?.success === false) {
        throw new Error(data?.message || "Failed to update subject");
      }

      setEditingSubject(null);
      setShowEditUploader(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update subject");
    } finally {
      setSaving(false);
    }
  };

  if (isCreatingNew) {
    // Returns the JSX layout for this render state.
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-xl font-semibold text-slate-900">Create New Subject</h2>

        {error ? (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700">
              Subject Name
            </label>
            <input
              id="name"
              type="text"
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              placeholder="e.g., Mathematics, Biology"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Subject Image</label>
            {!showCreateUploader ? (
              <div className="space-y-2">
                {newSubjectImage ? (
                  <div className="space-y-2">
                    <img
                      src={newSubjectImage}
                      alt="Subject preview"
                      className="h-24 w-24 rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setNewSubjectImage("");
                        setShowCreateUploader(true);
                      }}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      Change image
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowCreateUploader(true)}
                    className="rounded-lg border border-dashed border-slate-300 w-full p-4 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition"
                  >
                    Click to upload image
                  </button>
                )}
              </div>
            ) : (
              <ImageUploader
                folder="subjects"
                userId={getUserId() || undefined}
                onImageUpload={(imageUrl) => {
                  setNewSubjectImage(imageUrl);
                  setShowCreateUploader(false);
                }}
              />
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={() => void handleCreate()}
              disabled={saving || !newSubjectName.trim() || !newSubjectImage.trim()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 transition"
            >
              {saving ? "Creating..." : "Create Subject"}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCreatingNew(false);
                setNewSubjectName("");
                setNewSubjectImage("");
                setShowCreateUploader(false);
              }}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </section>
    );
  }

  // Returns the JSX layout for this render state.
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-slate-900">Subjects</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsCreatingNew(true)}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700"
          >
            Add new subject
          </button>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-600">Loading subjects...</p>
      ) : subjects.length === 0 ? (
        <p className="text-sm text-slate-600">No subjects yet.</p>
      ) : (
        <div className="space-y-3">
          {subjects.map((subject) => {
            const count = courseCountBySubject[subject._id] || 0;
            const isEditing = editingSubject?._id === subject._id;

            // Returns the JSX layout for this render state.
            return (
              <article key={subject._id} className="rounded-lg border border-slate-200 p-4">
                {!isEditing ? (
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      {subject.subject_img ? (
                        <img
                          src={subject.subject_img}
                          alt={subject.subject_name}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-slate-100" />
                      )}
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">{subject.subject_name}</h3>
                        <p className="text-xs text-slate-500">Courses in this subject: {count}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSubject(subject);
                          setShowEditUploader(false);
                        }}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(subject)}
                        disabled={saving}
                        className="rounded-lg border border-rose-300 px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editingSubject.subject_name}
                      onChange={(e) =>
                        setEditingSubject((prev) =>
                          prev ? { ...prev, subject_name: e.target.value } : prev
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
                    />

                    {!showEditUploader ? (
                      <div className="space-y-2">
                        {editingSubject.subject_img ? (
                          <img
                            src={editingSubject.subject_img}
                            alt="Subject preview"
                            className="h-20 w-20 rounded-lg object-cover"
                          />
                        ) : null}
                        <button
                          type="button"
                          onClick={() => setShowEditUploader(true)}
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                        >
                          Change image
                        </button>
                      </div>
                    ) : (
                      <ImageUploader
                        folder="subjects"
                        userId={getUserId() || undefined}
                        onImageUpload={(imageUrl) => {
                          setEditingSubject((prev) =>
                            prev ? { ...prev, subject_img: imageUrl } : prev
                          );
                          setShowEditUploader(false);
                        }}
                      />
                    )}

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => void handleUpdate()}
                        disabled={saving || !editingSubject.subject_name.trim()}
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSubject(null);
                          setShowEditUploader(false);
                        }}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
