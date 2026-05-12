"use client";

import { useEffect, useState } from "react";

type Subject = {
  _id: string;
  subject_name: string;
};

type CourseItem = {
  _id: string;
  title: string;
  description: string;
  ageGroup: string;
  subject_id: string | { _id: string };
  course_img: string;
  goals?: string[];
};

type Module = {
  _id: string;
  title: string;
  order: number;
  course_id: string;
};

type Chapter = {
  _id: string;
  title: string;
  content: string;
  order: number;
  module_id: string;
};

type Question = {
  _id: string;
  question?: string;
  questionText?: string;
  options?: string[];
  correctAnswer?: number;
  correctAnswers?: string[];
  blanks?: any[];
  explanation?: string;
  module_id: string;
  type?: string;
};

type QuestionType = "test" | "short-answer" | "fill-blank";

type StoredUser = {
  id?: string;
  _id?: string;
};

const getUserId = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    const user = JSON.parse(raw) as StoredUser;
    return user._id || user.id || null;
  } catch {
    return null;
  }
};

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingCourse, setEditingCourse] = useState<CourseItem | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [modules, setModules] = useState<Record<string, Module[]>>({});
  const [chapters, setChapters] = useState<Record<string, Chapter[]>>({});
  const [questions, setQuestions] = useState<Record<string, Question[]>>({});
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [courseForm, setCourseForm] = useState({
    title: "",
    description: "",
    ageGroup: "1-3",
    subject_id: "",
    course_img: "",
    goals: [] as string[],
  });

  const [moduleForm, setModuleForm] = useState({ title: "", order: 0, course_id: "" });
  const [chapterForm, setChapterForm] = useState({ title: "", content: "", order: 0, module_id: "" });

  // Question form with type
  const [questionType, setQuestionType] = useState<QuestionType>("test");
  const [testQuestionForm, setTestQuestionForm] = useState({
    question: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
    explanation: "",
  });
  const [shortAnswerForm, setShortAnswerForm] = useState({
    question: "",
    correctAnswers: [""],
    explanation: "",
    caseSensitive: false,
  });
  const [fillBlankForm, setFillBlankForm] = useState({
    questionText: "",
    blanks: [{ blankId: "blank1", correctAnswers: [""], caseSensitive: false }],
    explanation: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const userId = getUserId();
      if (!userId) {
        setError("Unauthorized: user id not found");
        setLoading(false);
        return;
      }

      const [coursesRes, subjectsRes] = await Promise.all([
        fetch("/api/courses", { headers: { "x-user-id": userId } }),
        fetch("/api/subjects", { headers: { "x-user-id": userId } }),
      ]);

      if (!coursesRes.ok || !subjectsRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const coursesData = await coursesRes.json();
      const subjectsData = await subjectsRes.json();

      setCourses(Array.isArray(coursesData.data) ? coursesData.data : []);
      setSubjects(Array.isArray(subjectsData.data) ? subjectsData.data : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load courses";
      setError(message);
      console.error("Load courses error:", message);
    } finally {
      setLoading(false);
    }
  };

  const loadModules = async (courseId: string) => {
    try {
      const userId = getUserId();
      if (!userId) return;

      const res = await fetch(`/api/modules?course_id=${courseId}`, {
        headers: { "x-user-id": userId },
      });

      if (res.ok) {
        const data = await res.json();
        setModules((prev) => ({ ...prev, [courseId]: Array.isArray(data.data) ? data.data : [] }));
      }
    } catch (err) {
      console.error("Load modules error:", err);
    }
  };

  const loadChapters = async (moduleId: string) => {
    try {
      const userId = getUserId();
      if (!userId) return;

      const res = await fetch(`/api/chapters?module_id=${moduleId}`, {
        headers: { "x-user-id": userId },
      });

      if (res.ok) {
        const data = await res.json();
        setChapters((prev) => ({ ...prev, [moduleId]: Array.isArray(data.data) ? data.data : [] }));
      }
    } catch (err) {
      console.error("Load chapters error:", err);
    }
  };

  const loadQuestions = async (moduleId: string) => {
    try {
      const userId = getUserId();
      if (!userId) return;

      const res = await fetch(`/api/questions?module_id=${moduleId}`, {
        headers: { "x-user-id": userId },
      });

      if (res.ok) {
        const data = await res.json();
        setQuestions((prev) => ({ ...prev, [moduleId]: Array.isArray(data.data) ? data.data : [] }));
      }
    } catch (err) {
      console.error("Load questions error:", err);
    }
  };

  const handleCourseCreate = async () => {
    if (!courseForm.title || !courseForm.description || !courseForm.subject_id) {
      setError("Please fill all required fields");
      return;
    }

    setSaving(true);
    try {
      const userId = getUserId();
      if (!userId) {
        setError("Unauthorized");
        setSaving(false);
        return;
      }

      const res = await fetch("/api/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify(courseForm),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to create course");
      }

      setCourses((prev) => [...prev, data.data]);
      setCourseForm({
        title: "",
        description: "",
        ageGroup: "1-3",
        subject_id: "",
        course_img: "",
        goals: [],
      });
      setIsCreatingNew(false);
      setError("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create course";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleCourseUpdate = async () => {
    if (!editingCourse) return;

    setSaving(true);
    try {
      const userId = getUserId();
      if (!userId) {
        setError("Unauthorized");
        setSaving(false);
        return;
      }

      const res = await fetch(`/api/courses/${editingCourse._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({
          title: editingCourse.title,
          description: editingCourse.description,
          ageGroup: editingCourse.ageGroup,
          subject_id: typeof editingCourse.subject_id === "string" ? editingCourse.subject_id : editingCourse.subject_id._id,
          course_img: editingCourse.course_img,
          goals: editingCourse.goals || [],
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update course");
      }

      setCourses((prev) =>
        prev.map((c) => (c._id === editingCourse._id ? editingCourse : c))
      );
      setEditingCourse(null);
      setError("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update course";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleCourseDelete = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course and all its modules/chapters?")) return;

    setSaving(true);
    try {
      const userId = getUserId();
      if (!userId) {
        setError("Unauthorized");
        setSaving(false);
        return;
      }

      const res = await fetch(`/api/courses/${courseId}`, {
        method: "DELETE",
        headers: {
          "x-user-id": userId,
        },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to delete course");
      }

      setCourses((prev) => prev.filter((c) => c._id !== courseId));
      setError("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete course";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  // Module handlers
  const handleModuleCreate = async (courseId: string) => {
    if (!moduleForm.title) {
      setError("Module title is required");
      return;
    }

    setSaving(true);
    try {
      const userId = getUserId();
      if (!userId) throw new Error("Unauthorized");

      const res = await fetch("/api/modules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({
          title: moduleForm.title,
          order: moduleForm.order || (modules[courseId]?.length || 0) + 1,
          course_id: courseId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      setModules((prev) => ({
        ...prev,
        [courseId]: [...(prev[courseId] || []), data.data],
      }));
      setModuleForm({ title: "", order: 0, course_id: "" });
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create module");
    } finally {
      setSaving(false);
    }
  };

  const handleModuleUpdate = async () => {
    if (!editingModule) return;

    setSaving(true);
    try {
      const userId = getUserId();
      if (!userId) throw new Error("Unauthorized");

      const res = await fetch(`/api/modules/${editingModule._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({
          title: editingModule.title,
          order: editingModule.order,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      setModules((prev) => ({
        ...prev,
        [editingModule.course_id]: prev[editingModule.course_id].map((m) =>
          m._id === editingModule._id ? editingModule : m
        ),
      }));
      setEditingModule(null);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update module");
    } finally {
      setSaving(false);
    }
  };

  const handleModuleDelete = async (moduleId: string, courseId: string) => {
    if (!confirm("Delete this module and all its chapters/questions?")) return;

    setSaving(true);
    try {
      const userId = getUserId();
      if (!userId) throw new Error("Unauthorized");

      const res = await fetch(`/api/modules/${moduleId}`, {
        method: "DELETE",
        headers: { "x-user-id": userId },
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      setModules((prev) => ({
        ...prev,
        [courseId]: prev[courseId].filter((m) => m._id !== moduleId),
      }));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete module");
    } finally {
      setSaving(false);
    }
  };

  // Chapter handlers
  const handleChapterCreate = async (moduleId: string) => {
    if (!chapterForm.title || !chapterForm.content) {
      setError("Chapter title and content are required");
      return;
    }

    setSaving(true);
    try {
      const userId = getUserId();
      if (!userId) throw new Error("Unauthorized");

      const res = await fetch("/api/chapters", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({
          title: chapterForm.title,
          content: chapterForm.content,
          order: chapterForm.order || (chapters[moduleId]?.length || 0) + 1,
          module_id: moduleId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      setChapters((prev) => ({
        ...prev,
        [moduleId]: [...(prev[moduleId] || []), data.data],
      }));
      setChapterForm({ title: "", content: "", order: 0, module_id: "" });
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create chapter");
    } finally {
      setSaving(false);
    }
  };

  const handleChapterUpdate = async () => {
    if (!editingChapter) return;

    setSaving(true);
    try {
      const userId = getUserId();
      if (!userId) throw new Error("Unauthorized");

      const res = await fetch(`/api/chapters/${editingChapter._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({
          title: editingChapter.title,
          content: editingChapter.content,
          order: editingChapter.order,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      setChapters((prev) => ({
        ...prev,
        [editingChapter.module_id]: prev[editingChapter.module_id].map((c) =>
          c._id === editingChapter._id ? editingChapter : c
        ),
      }));
      setEditingChapter(null);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update chapter");
    } finally {
      setSaving(false);
    }
  };

  const handleChapterDelete = async (chapterId: string, moduleId: string) => {
    if (!confirm("Delete this chapter?")) return;

    setSaving(true);
    try {
      const userId = getUserId();
      if (!userId) throw new Error("Unauthorized");

      const res = await fetch(`/api/chapters/${chapterId}`, {
        method: "DELETE",
        headers: { "x-user-id": userId },
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      setChapters((prev) => ({
        ...prev,
        [moduleId]: prev[moduleId].filter((c) => c._id !== chapterId),
      }));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete chapter");
    } finally {
      setSaving(false);
    }
  };

  // Question handlers
  const handleQuestionCreate = async (moduleId: string) => {
    let payload: any;

    if (questionType === "test") {
      if (!testQuestionForm.question || testQuestionForm.options.some((o) => !o)) {
        setError("Question and all options are required");
        return;
      }
      payload = {
        type: "test",
        question: testQuestionForm.question,
        options: testQuestionForm.options,
        correctAnswer: testQuestionForm.correctAnswer,
        explanation: testQuestionForm.explanation,
        module_id: moduleId,
      };
    } else if (questionType === "short-answer") {
      if (!shortAnswerForm.question || shortAnswerForm.correctAnswers.some((a) => !a)) {
        setError("Question and at least one correct answer are required");
        return;
      }
      payload = {
        type: "short-answer",
        question: shortAnswerForm.question,
        correctAnswers: shortAnswerForm.correctAnswers,
        explanation: shortAnswerForm.explanation,
        caseSensitive: shortAnswerForm.caseSensitive,
        module_id: moduleId,
      };
    } else if (questionType === "fill-blank") {
      if (!fillBlankForm.questionText || fillBlankForm.blanks.some((b) => !b.correctAnswers.some((a) => a))) {
        setError("Question text and at least one correct answer for each blank are required");
        return;
      }
      payload = {
        type: "fill-blank",
        questionText: fillBlankForm.questionText,
        blanks: fillBlankForm.blanks,
        explanation: fillBlankForm.explanation,
        module_id: moduleId,
      };
    }

    setSaving(true);
    try {
      const userId = getUserId();
      if (!userId) throw new Error("Unauthorized");

      const res = await fetch("/api/questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      setQuestions((prev) => ({
        ...prev,
        [moduleId]: [...(prev[moduleId] || []), data.data],
      }));

      // Reset forms
      setQuestionType("test");
      setTestQuestionForm({
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
        explanation: "",
      });
      setShortAnswerForm({
        question: "",
        correctAnswers: [""],
        explanation: "",
        caseSensitive: false,
      });
      setFillBlankForm({
        questionText: "",
        blanks: [{ blankId: "blank1", correctAnswers: [""], caseSensitive: false }],
        explanation: "",
      });
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create question");
    } finally {
      setSaving(false);
    }
  };

  const handleQuestionDelete = async (questionId: string, moduleId: string) => {
    if (!confirm("Delete this question?")) return;

    setSaving(true);
    try {
      const userId = getUserId();
      if (!userId) throw new Error("Unauthorized");

      const res = await fetch(`/api/questions/${questionId}`, {
        method: "DELETE",
        headers: { "x-user-id": userId },
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      setQuestions((prev) => ({
        ...prev,
        [moduleId]: prev[moduleId].filter((q) => q._id !== questionId),
      }));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete question");
    } finally {
      setSaving(false);
    }
  };

  const getQuestionDisplay = (q: Question) => {
    if (q.question) return q.question;
    if (q.questionText) return q.questionText;
    return "Question";
  };

  if (loading) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-center text-slate-600">Loading courses...</p>
      </section>
    );
  }

  return (
    <section className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Courses Management</h2>
        {!isCreatingNew && !editingCourse && (
          <button
            onClick={() => {
              setIsCreatingNew(true);
              setCourseForm({
                title: "",
                description: "",
                ageGroup: "1-3",
                subject_id: "",
                course_img: "",
                goals: [],
              });
            }}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition"
          >
            + Add new course
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Create new course */}
      {isCreatingNew && (
        <div className="rounded-lg border border-slate-300 bg-slate-50 p-4 space-y-3">
          <h3 className="font-medium text-slate-900">Create new course</h3>
          <input
            type="text"
            placeholder="Course title"
            value={courseForm.title}
            onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
          />
          <textarea
            placeholder="Course description"
            value={courseForm.description}
            onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 h-20"
          />
          <select
            value={courseForm.ageGroup}
            onChange={(e) => setCourseForm({ ...courseForm, ageGroup: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
          >
            <option value="1-3">Age 1-3</option>
            <option value="4-9">Age 4-9</option>
            <option value="10-12">Age 10-12</option>
          </select>
          <select
            value={courseForm.subject_id}
            onChange={(e) => setCourseForm({ ...courseForm, subject_id: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
          >
            <option value="">Select subject</option>
            {subjects.map((s) => (
              <option key={s._id} value={s._id}>
                {s.subject_name}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Course image URL"
            value={courseForm.course_img}
            onChange={(e) => setCourseForm({ ...courseForm, course_img: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
          />
          {courseForm.course_img && (
            <div className="flex flex-col items-center gap-2">
              <img
                src={courseForm.course_img}
                alt="Course preview"
                className="h-24 w-24 object-cover rounded-lg border border-slate-200"
              />
              <p className="text-xs text-slate-500">Image preview</p>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">Goals (one per line):</label>
            <textarea
              placeholder="Enter course goals, one per line"
              value={courseForm.goals?.join("\n") || ""}
              onChange={(e) =>
                setCourseForm({
                  ...courseForm,
                  goals: e.target.value.split("\n").filter((g) => g.trim()),
                })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 h-20"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCourseCreate}
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 transition"
            >
              {saving ? "Creating..." : "Create"}
            </button>
            <button
              onClick={() => setIsCreatingNew(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Edit course */}
      {editingCourse && (
        <div className="rounded-lg border border-slate-300 bg-slate-50 p-4 space-y-3">
          <h3 className="font-medium text-slate-900">Edit course</h3>
          <input
            type="text"
            value={editingCourse.title}
            onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
          />
          <textarea
            value={editingCourse.description}
            onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 h-20"
          />
          <select
            value={editingCourse.ageGroup}
            onChange={(e) => setEditingCourse({ ...editingCourse, ageGroup: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
          >
            <option value="1-3">Age 1-3</option>
            <option value="4-9">Age 4-9</option>
            <option value="10-12">Age 10-12</option>
          </select>
          <input
            type="text"
            value={editingCourse.course_img}
            onChange={(e) => setEditingCourse({ ...editingCourse, course_img: e.target.value })}
            placeholder="Course image URL"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
          />
          {editingCourse.course_img && (
            <div className="flex flex-col items-center gap-2">
              <img
                src={editingCourse.course_img}
                alt="Course preview"
                className="h-24 w-24 object-cover rounded-lg border border-slate-200"
              />
              <p className="text-xs text-slate-500">Image preview</p>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">Goals (one per line):</label>
            <textarea
              placeholder="Enter course goals, one per line"
              value={editingCourse.goals?.join("\n") || ""}
              onChange={(e) =>
                setEditingCourse({
                  ...editingCourse,
                  goals: e.target.value.split("\n").filter((g) => g.trim()),
                })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 h-20"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCourseUpdate}
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 transition"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => setEditingCourse(null)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Courses list */}
      {courses.length === 0 ? (
        <p className="text-sm text-slate-600">No courses found.</p>
      ) : (
        <div className="space-y-3">
          {courses.map((course) => (
            <div key={course._id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex gap-3 items-start">
                    {course.course_img && (
                      <img
                        src={course.course_img}
                        alt={course.title}
                        className="h-16 w-16 object-cover rounded-lg flex-shrink-0 border border-slate-200"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium text-slate-900">{course.title}</h3>
                      <p className="text-sm text-slate-600">{course.description}</p>
                      <p className="text-xs text-slate-500 mt-1">Age: {course.ageGroup}</p>
                      {course.goals && course.goals.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-slate-700">Goals:</p>
                          <ul className="text-xs text-slate-600 mt-1 list-disc list-inside">
                            {course.goals.map((goal, idx) => (
                              <li key={idx}>{goal}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => {
                      setEditingCourse(course);
                      setExpandedCourse(null);
                    }}
                    className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleCourseDelete(course._id)}
                    className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-medium text-white hover:bg-rose-700 transition"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => {
                      if (expandedCourse === course._id) {
                        setExpandedCourse(null);
                      } else {
                        setExpandedCourse(course._id);
                        loadModules(course._id);
                      }
                    }}
                    className="rounded-lg bg-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-300 transition"
                  >
                    {expandedCourse === course._id ? "▼ Modules" : "▶ Modules"}
                  </button>
                </div>
              </div>

              {/* Modules section */}
              {expandedCourse === course._id && (
                <div className="mt-4 pl-4 border-l-2 border-indigo-200 space-y-3">
                  {modules[course._id]?.length === 0 || !modules[course._id] ? (
                    <p className="text-sm text-slate-500 italic">No modules yet</p>
                  ) : (
                    modules[course._id].map((module) => (
                      <div key={module._id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        {editingModule?._id === module._id ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editingModule.title}
                              onChange={(e) => setEditingModule({ ...editingModule, title: e.target.value })}
                              className="w-full rounded border border-slate-300 px-2 py-1 text-sm text-slate-900 outline-none focus:border-indigo-500"
                            />
                            <input
                              type="number"
                              value={editingModule.order}
                              onChange={(e) => setEditingModule({ ...editingModule, order: Number(e.target.value) })}
                              className="w-full rounded border border-slate-300 px-2 py-1 text-sm text-slate-900 outline-none focus:border-indigo-500"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={handleModuleUpdate}
                                disabled={saving}
                                className="rounded bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingModule(null)}
                                className="rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-slate-900">{module.title}</p>
                              <p className="text-xs text-slate-500">Order: {module.order}</p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setEditingModule(module)}
                                className="rounded bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-700"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleModuleDelete(module._id, course._id)}
                                className="rounded bg-rose-600 px-2 py-1 text-xs font-medium text-white hover:bg-rose-700"
                              >
                                Delete
                              </button>
                              <button
                                onClick={() => {
                                  loadChapters(module._id);
                                  loadQuestions(module._id);
                                }}
                                className="rounded bg-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-400"
                              >
                                ▶ Content
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Chapters */}
                        {chapters[module._id] && chapters[module._id].length > 0 && (
                          <div className="mt-2 pl-3 border-l border-slate-300 space-y-2">
                            <p className="text-xs font-medium text-slate-600">Chapters:</p>
                            {chapters[module._id].map((chapter) => (
                              <div key={chapter._id} className="bg-white p-2 rounded border border-slate-200">
                                {editingChapter?._id === chapter._id ? (
                                  <div className="space-y-1">
                                    <input
                                      type="text"
                                      value={editingChapter.title}
                                      onChange={(e) => setEditingChapter({ ...editingChapter, title: e.target.value })}
                                      className="w-full rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 outline-none focus:border-indigo-500"
                                    />
                                    <textarea
                                      value={editingChapter.content}
                                      onChange={(e) => setEditingChapter({ ...editingChapter, content: e.target.value })}
                                      className="w-full rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 outline-none focus:border-indigo-500 h-12"
                                    />
                                    <div className="flex gap-1">
                                      <button
                                        onClick={handleChapterUpdate}
                                        disabled={saving}
                                        className="rounded bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                                      >
                                        Save
                                      </button>
                                      <button
                                        onClick={() => setEditingChapter(null)}
                                        className="rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <p className="text-xs font-medium text-slate-900">{chapter.title}</p>
                                      <p className="text-xs text-slate-500 truncate">{chapter.content}</p>
                                    </div>
                                    <div className="flex gap-1 ml-2">
                                      <button
                                        onClick={() => setEditingChapter(chapter)}
                                        className="rounded bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-700"
                                      >
                                        E
                                      </button>
                                      <button
                                        onClick={() => handleChapterDelete(chapter._id, module._id)}
                                        className="rounded bg-rose-600 px-2 py-1 text-xs font-medium text-white hover:bg-rose-700"
                                      >
                                        D
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add chapter form */}
                        {!editingChapter && (
                          <div className="mt-2 pl-3 space-y-1">
                            <input
                              type="text"
                              placeholder="New chapter title..."
                              value={chapterForm.title}
                              onChange={(e) => setChapterForm({ ...chapterForm, title: e.target.value })}
                              className="w-full rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 outline-none focus:border-indigo-500"
                            />
                            <textarea
                              placeholder="Chapter content..."
                              value={chapterForm.content}
                              onChange={(e) => setChapterForm({ ...chapterForm, content: e.target.value })}
                              className="w-full rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 outline-none focus:border-indigo-500 h-12"
                            />
                            <button
                              onClick={() => handleChapterCreate(module._id)}
                              disabled={saving}
                              className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-60"
                            >
                              + Add chapter
                            </button>
                          </div>
                        )}

                        {/* Quiz Questions */}
                        {questions[module._id] && questions[module._id].length > 0 && (
                          <div className="mt-2 pl-3 border-l border-amber-300 space-y-2">
                            <p className="text-xs font-medium text-amber-700">📝 Quiz Questions:</p>
                            {questions[module._id].map((question) => (
                              <div key={question._id} className="bg-amber-50 p-2 rounded border border-amber-200">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="text-xs font-medium text-slate-900">{getQuestionDisplay(question)}</p>
                                    <p className="text-xs text-amber-700">Type: {question.type || "test"}</p>
                                  </div>
                                  <button
                                    onClick={() => handleQuestionDelete(question._id, module._id)}
                                    className="rounded bg-rose-600 px-2 py-1 text-xs font-medium text-white hover:bg-rose-700 ml-2"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add question form */}
                        {!editingQuestion && (
                          <div className="mt-3 pl-3 bg-amber-50 p-3 rounded border border-amber-200 space-y-2">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-medium text-amber-700">+ Add Quiz Question</p>
                              <select
                                value={questionType}
                                onChange={(e) => setQuestionType(e.target.value as QuestionType)}
                                className="rounded border border-amber-300 px-2 py-1 text-xs text-slate-900 bg-white outline-none focus:border-amber-500"
                              >
                                <option value="test">Multiple Choice Test</option>
                                <option value="short-answer">Short Answer</option>
                                <option value="fill-blank">Fill in the Blank</option>
                              </select>
                            </div>

                            {/* Test Question Form */}
                            {questionType === "test" && (
                              <div className="space-y-1">
                                <input
                                  type="text"
                                  placeholder="Question..."
                                  value={testQuestionForm.question}
                                  onChange={(e) => setTestQuestionForm({ ...testQuestionForm, question: e.target.value })}
                                  className="w-full rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 outline-none focus:border-indigo-500"
                                />
                                {testQuestionForm.options.map((opt, i) => (
                                  <input
                                    key={i}
                                    type="text"
                                    value={opt}
                                    onChange={(e) => {
                                      const newOpts = [...testQuestionForm.options];
                                      newOpts[i] = e.target.value;
                                      setTestQuestionForm({ ...testQuestionForm, options: newOpts });
                                    }}
                                    placeholder={`Option ${i + 1}`}
                                    className="w-full rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 outline-none focus:border-indigo-500"
                                  />
                                ))}
                                <div className="flex items-center gap-2">
                                  <label className="text-xs font-medium text-slate-700">Correct:</label>
                                  <select
                                    value={testQuestionForm.correctAnswer}
                                    onChange={(e) => setTestQuestionForm({ ...testQuestionForm, correctAnswer: Number(e.target.value) })}
                                    className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 outline-none focus:border-indigo-500"
                                  >
                                    {testQuestionForm.options.map((_, i) => (
                                      <option key={i} value={i}>
                                        Option {i + 1}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <textarea
                                  placeholder="Explanation..."
                                  value={testQuestionForm.explanation}
                                  onChange={(e) => setTestQuestionForm({ ...testQuestionForm, explanation: e.target.value })}
                                  className="w-full rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 outline-none focus:border-indigo-500 h-8"
                                />
                                <button
                                  onClick={() => handleQuestionCreate(module._id)}
                                  disabled={saving}
                                  className="w-full rounded bg-amber-600 px-2 py-1 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-60"
                                >
                                  + Add test question
                                </button>
                              </div>
                            )}

                            {/* Short Answer Form */}
                            {questionType === "short-answer" && (
                              <div className="space-y-1">
                                <input
                                  type="text"
                                  placeholder="Question..."
                                  value={shortAnswerForm.question}
                                  onChange={(e) => setShortAnswerForm({ ...shortAnswerForm, question: e.target.value })}
                                  className="w-full rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 outline-none focus:border-indigo-500"
                                />
                                <p className="text-xs font-medium text-slate-700">Correct Answers:</p>
                                {shortAnswerForm.correctAnswers.map((ans, i) => (
                                  <div key={i} className="flex gap-1">
                                    <input
                                      type="text"
                                      value={ans}
                                      onChange={(e) => {
                                        const newAnswers = [...shortAnswerForm.correctAnswers];
                                        newAnswers[i] = e.target.value;
                                        setShortAnswerForm({ ...shortAnswerForm, correctAnswers: newAnswers });
                                      }}
                                      placeholder={`Answer ${i + 1}`}
                                      className="flex-1 rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 outline-none focus:border-indigo-500"
                                    />
                                    {i === shortAnswerForm.correctAnswers.length - 1 && (
                                      <button
                                        onClick={() => setShortAnswerForm({ ...shortAnswerForm, correctAnswers: [...shortAnswerForm.correctAnswers, ""] })}
                                        className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700"
                                      >
                                        +
                                      </button>
                                    )}
                                  </div>
                                ))}
                                <label className="flex items-center gap-2 text-xs">
                                  <input
                                    type="checkbox"
                                    checked={shortAnswerForm.caseSensitive}
                                    onChange={(e) => setShortAnswerForm({ ...shortAnswerForm, caseSensitive: e.target.checked })}
                                  />
                                  <span>Case sensitive</span>
                                </label>
                                <textarea
                                  placeholder="Explanation..."
                                  value={shortAnswerForm.explanation}
                                  onChange={(e) => setShortAnswerForm({ ...shortAnswerForm, explanation: e.target.value })}
                                  className="w-full rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 outline-none focus:border-indigo-500 h-8"
                                />
                                <button
                                  onClick={() => handleQuestionCreate(module._id)}
                                  disabled={saving}
                                  className="w-full rounded bg-amber-600 px-2 py-1 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-60"
                                >
                                  + Add short answer
                                </button>
                              </div>
                            )}

                            {/* Fill in the Blank Form */}
                            {questionType === "fill-blank" && (
                              <div className="space-y-1">
                                <input
                                  type="text"
                                  placeholder="Question text (use [blank] for blanks)..."
                                  value={fillBlankForm.questionText}
                                  onChange={(e) => setFillBlankForm({ ...fillBlankForm, questionText: e.target.value })}
                                  className="w-full rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 outline-none focus:border-indigo-500"
                                />
                                <p className="text-xs font-medium text-slate-700">Blanks:</p>
                                {fillBlankForm.blanks.map((blank, i) => (
                                  <div key={i} className="bg-white p-2 rounded border border-slate-200 space-y-1">
                                    <p className="text-xs font-medium text-slate-600">Blank {i + 1}</p>
                                    {blank.correctAnswers.map((ans, j) => (
                                      <div key={j} className="flex gap-1">
                                        <input
                                          type="text"
                                          value={ans}
                                          onChange={(e) => {
                                            const newBlanks = JSON.parse(JSON.stringify(fillBlankForm.blanks));
                                            newBlanks[i].correctAnswers[j] = e.target.value;
                                            setFillBlankForm({ ...fillBlankForm, blanks: newBlanks });
                                          }}
                                          placeholder={`Answer ${j + 1}`}
                                          className="flex-1 rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 outline-none focus:border-indigo-500"
                                        />
                                        {j === blank.correctAnswers.length - 1 && (
                                          <button
                                            onClick={() => {
                                              const newBlanks = JSON.parse(JSON.stringify(fillBlankForm.blanks));
                                              newBlanks[i].correctAnswers.push("");
                                              setFillBlankForm({ ...fillBlankForm, blanks: newBlanks });
                                            }}
                                            className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700"
                                          >
                                            +
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ))}
                                <textarea
                                  placeholder="Explanation..."
                                  value={fillBlankForm.explanation}
                                  onChange={(e) => setFillBlankForm({ ...fillBlankForm, explanation: e.target.value })}
                                  className="w-full rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 outline-none focus:border-indigo-500 h-8"
                                />
                                <button
                                  onClick={() => handleQuestionCreate(module._id)}
                                  disabled={saving}
                                  className="w-full rounded bg-amber-600 px-2 py-1 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-60"
                                >
                                  + Add fill-blank question
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}

                  {/* Add module form */}
                  {!editingModule && (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
                      <p className="text-sm font-medium text-slate-700">+ Add new module</p>
                      <input
                        type="text"
                        placeholder="Module title..."
                        value={moduleForm.title}
                        onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
                      />
                      <input
                        type="number"
                        placeholder="Order"
                        value={moduleForm.order}
                        onChange={(e) => setModuleForm({ ...moduleForm, order: Number(e.target.value) })}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
                      />
                      <button
                        onClick={() => handleModuleCreate(course._id)}
                        disabled={saving}
                        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60 transition"
                      >
                        + Add module
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
