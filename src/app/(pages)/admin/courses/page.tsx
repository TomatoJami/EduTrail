"use client";

import { useEffect, useRef, useState } from "react";
import { ImageUploader } from "@/components/ImageUploader";

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

type FillBlank = {
  blankId: string;
  correctAnswers: string[];
  caseSensitive?: boolean;
};

type Question = {
  _id: string;
  question?: string;
  questionText?: string;
  question_img?: string;
  options?: string[];
  correctAnswer?: number;
  correctAnswers?: string[];
  blanks?: FillBlank[];
  explanation?: string;
  module_id: string;
  type?: string;
  caseSensitive?: boolean;
};

type QuestionType = "test" | "short-answer" | "fill-blank";

type QuestionCreatePayload =
  | {
      type: "test";
      question: string;
      question_img?: string;
      options: string[];
      correctAnswer: number;
      explanation: string;
      module_id: string;
    }
  | {
      type: "short-answer";
      question: string;
      question_img?: string;
      correctAnswers: string[];
      explanation: string;
      caseSensitive: boolean;
      module_id: string;
    }
  | {
      type: "fill-blank";
      questionText: string;
      question_img?: string;
      blanks: FillBlank[];
      explanation: string;
      module_id: string;
    };

type StoredUser = {
  id?: string;
  _id?: string;
};

const COURSE_TEXT_LIMIT = 120;

const truncateText = (value: string, limit = COURSE_TEXT_LIMIT) => {
  if (!value || value.length <= limit) return value;
  return `${value.slice(0, limit).trimEnd()}...`;
};

const normalizeGoals = (goals: string[]) =>
  goals.map((goal) => goal.trim()).filter(Boolean);

const findCourseTextLimitError = (title: string, description: string, goals: string[]) => {
  if (title.trim().length > COURSE_TEXT_LIMIT) {
    return `Course title cannot exceed ${COURSE_TEXT_LIMIT} characters`;
  }

  if (description.trim().length > COURSE_TEXT_LIMIT) {
    return `Course description cannot exceed ${COURSE_TEXT_LIMIT} characters`;
  }

  if (goals.some((goal) => goal.trim().length > COURSE_TEXT_LIMIT)) {
    return `Each goal cannot exceed ${COURSE_TEXT_LIMIT} characters`;
  }

  return null;
};

const getEntityId = (value: string | { _id?: string } | null | undefined): string => {
  if (!value) return "";
  return typeof value === "string" ? value : value._id || "";
};

const normalizeChapter = (chapter: Chapter): Chapter => ({
  ...chapter,
  module_id: getEntityId(chapter.module_id as unknown as string | { _id?: string }),
});

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
  const [loadingModuleContent, setLoadingModuleContent] = useState<Record<string, boolean>>({});
  const [modules, setModules] = useState<Record<string, Module[]>>({});
  const [chapters, setChapters] = useState<Record<string, Chapter[]>>({});
  const [questions, setQuestions] = useState<Record<string, Question[]>>({});
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [saving, setSaving] = useState(false);
  const [showCreateCourseUploader, setShowCreateCourseUploader] = useState(false);
  const [showEditCourseUploader, setShowEditCourseUploader] = useState(false);
  const chapterFormContentRef = useRef<HTMLTextAreaElement | null>(null);
  const editingChapterContentRef = useRef<HTMLTextAreaElement | null>(null);

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
    question_img: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
    explanation: "",
  });
  const [shortAnswerForm, setShortAnswerForm] = useState({
    question: "",
    question_img: "",
    correctAnswers: [""],
    explanation: "",
    caseSensitive: false,
  });
  const [fillBlankForm, setFillBlankForm] = useState({
    questionText: "",
    question_img: "",
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

      // Load admin course data and subject options in parallel for the editor.
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
    } finally {
      setLoading(false);
    }
  };

  const loadModules = async (courseId: string) => {
    try {
      const userId = getUserId();
      if (!userId) return;

      // Fetch modules only when an admin expands a course.
      const res = await fetch(`/api/modules?course_id=${courseId}`, {
        headers: { "x-user-id": userId },
      });

      if (res.ok) {
        const data = await res.json();
        const courseModules: Module[] = Array.isArray(data.data) ? data.data : [];
        setModules((prev) => ({ ...prev, [courseId]: courseModules }));
        await Promise.all(courseModules.map((module) => loadModuleContent(module._id)));
      }
    } catch (err) {
    }
  };

  const loadChapters = async (moduleId: string) => {
    try {
      const userId = getUserId();
      if (!userId) return;

      // Load chapters for the selected module before rendering nested editors.
      const res = await fetch(`/api/chapters?module_id=${moduleId}`, {
        headers: { "x-user-id": userId },
      });

      if (res.ok) {
        const data = await res.json();
        setChapters((prev) => ({
          ...prev,
          [moduleId]: Array.isArray(data.data) ? data.data.map(normalizeChapter) : [],
        }));
      }
    } catch (err) {
    }
  };

  const loadQuestions = async (moduleId: string) => {
    try {
      const userId = getUserId();
      if (!userId) return;

      // Load quiz questions for the selected module before rendering nested editors.
      const res = await fetch(`/api/questions?module_id=${moduleId}`, {
        headers: { "x-user-id": userId },
      });

      if (res.ok) {
        const data = await res.json();
        setQuestions((prev) => ({ ...prev, [moduleId]: Array.isArray(data.data) ? data.data : [] }));
      }
    } catch (err) {
    }
  };

  const loadModuleContent = async (moduleId: string) => {
    setLoadingModuleContent((prev) => ({ ...prev, [moduleId]: true }));
    try {
      await Promise.all([loadChapters(moduleId), loadQuestions(moduleId)]);
    } finally {
      setLoadingModuleContent((prev) => ({ ...prev, [moduleId]: false }));
    }
  };

  const handleCourseCreate = async () => {
    if (!courseForm.title || !courseForm.description || !courseForm.subject_id) {
      setError("Please fill all required fields");
      return;
    }

    const goals = normalizeGoals(courseForm.goals);
    const textLimitError = findCourseTextLimitError(courseForm.title, courseForm.description, goals);
    if (textLimitError) {
      setError(textLimitError);
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

      // Create the course through the admin API proxy.
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({
          ...courseForm,
          title: courseForm.title.trim(),
          description: courseForm.description.trim(),
          goals,
        }),
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
      setShowCreateCourseUploader(false);
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

    const goals = normalizeGoals(editingCourse.goals || []);
    const textLimitError = findCourseTextLimitError(editingCourse.title, editingCourse.description, goals);
    if (textLimitError) {
      setError(textLimitError);
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

      // Update course metadata and image URL on the backend.
      const res = await fetch(`/api/courses/${editingCourse._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({
          title: editingCourse.title.trim(),
          description: editingCourse.description.trim(),
          ageGroup: editingCourse.ageGroup,
          subject_id: typeof editingCourse.subject_id === "string" ? editingCourse.subject_id : editingCourse.subject_id._id,
          course_img: editingCourse.course_img,
          goals,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update course");
      }

      const updatedCourse = data.data || editingCourse;
      setCourses((prev) =>
        prev.map((c) => (c._id === editingCourse._id ? updatedCourse : c))
      );
      setEditingCourse(null);
      setShowEditCourseUploader(false);
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

      // Delete the course and let the backend cascade related records/storage cleanup.
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

      // Create a module under the selected course.
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

      // Persist module title/order changes.
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
        [editingModule.course_id]: (prev[editingModule.course_id] || []).map((m) =>
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

      // Delete the module and its nested learning content.
      const res = await fetch(`/api/modules/${moduleId}`, {
        method: "DELETE",
        headers: { "x-user-id": userId },
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      setModules((prev) => ({
        ...prev,
        [courseId]: (prev[courseId] || []).filter((m) => m._id !== moduleId),
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

      // Create a chapter for the selected module.
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
        [moduleId]: [...(prev[moduleId] || []), normalizeChapter(data.data)],
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

      // Persist chapter text/content changes.
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

      const updatedChapter = normalizeChapter(data.data || editingChapter);

      setChapters((prev) => ({
        ...prev,
        [editingChapter.module_id]: (prev[editingChapter.module_id] || []).map((c) =>
          c._id === editingChapter._id ? updatedChapter : c
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

      // Delete the chapter and let backend cleanup remove related images.
      const res = await fetch(`/api/chapters/${chapterId}`, {
        method: "DELETE",
        headers: { "x-user-id": userId },
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      setChapters((prev) => ({
        ...prev,
        [moduleId]: (prev[moduleId] || []).filter((c) => c._id !== chapterId),
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
    let payload: QuestionCreatePayload;

    if (questionType === "test") {
      if (!testQuestionForm.question || testQuestionForm.options.some((o) => !o)) {
        setError("Question and all options are required");
        return;
      }
      payload = {
        type: "test",
        question: testQuestionForm.question,
        question_img: testQuestionForm.question_img,
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
        question_img: shortAnswerForm.question_img,
        correctAnswers: shortAnswerForm.correctAnswers,
        explanation: shortAnswerForm.explanation,
        caseSensitive: shortAnswerForm.caseSensitive,
        module_id: moduleId,
      };
    } else {
      if (!fillBlankForm.questionText || fillBlankForm.blanks.some((b) => !b.correctAnswers.some((a) => a))) {
        setError("Question text and at least one correct answer for each blank are required");
        return;
      }
      payload = {
        type: "fill-blank",
        questionText: fillBlankForm.questionText,
        question_img: fillBlankForm.question_img,
        blanks: fillBlankForm.blanks,
        explanation: fillBlankForm.explanation,
        module_id: moduleId,
      };
    }

    setSaving(true);
    try {
      const userId = getUserId();
      if (!userId) throw new Error("Unauthorized");

      // Create a question using the payload shape for the selected question type.
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
        question_img: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
        explanation: "",
      });
      setShortAnswerForm({
        question: "",
        question_img: "",
        correctAnswers: [""],
        explanation: "",
        caseSensitive: false,
      });
      setFillBlankForm({
        questionText: "",
        question_img: "",
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

  const buildQuestionPayload = (question: Question) => {
    if (question.type === "short-answer") {
      return {
        question: question.question?.trim(),
        question_img: question.question_img?.trim() || "",
        correctAnswers: (question.correctAnswers || []).filter((answer) => answer.trim()),
        explanation: question.explanation?.trim(),
        caseSensitive: question.caseSensitive || false,
      };
    }

    if (question.type === "fill-blank") {
      return {
        questionText: question.questionText?.trim(),
        question_img: question.question_img?.trim() || "",
        blanks: (question.blanks || []).map((blank, index) => ({
          blankId: blank.blankId || `blank${index + 1}`,
          correctAnswers: blank.correctAnswers.filter((answer) => answer.trim()),
          caseSensitive: blank.caseSensitive || false,
        })),
        explanation: question.explanation?.trim(),
      };
    }

    return {
      question: question.question?.trim(),
      question_img: question.question_img?.trim() || "",
      options: question.options || [],
      correctAnswer: question.correctAnswer || 0,
      explanation: question.explanation?.trim(),
    };
  };

  const handleQuestionUpdate = async () => {
    if (!editingQuestion) return;

    if (editingQuestion.type === "test" || !editingQuestion.type) {
      if (!editingQuestion.question || !editingQuestion.options?.every((option) => option.trim())) {
        setError("Question and all options are required");
        return;
      }
    } else if (editingQuestion.type === "short-answer") {
      if (!editingQuestion.question || !editingQuestion.correctAnswers?.some((answer) => answer.trim())) {
        setError("Question and at least one answer are required");
        return;
      }
    } else if (editingQuestion.type === "fill-blank") {
      if (!editingQuestion.questionText || !editingQuestion.blanks?.every((blank) => blank.correctAnswers.some((answer) => answer.trim()))) {
        setError("Question text and answers for every blank are required");
        return;
      }
    }

    setSaving(true);
    try {
      const userId = getUserId();
      if (!userId) throw new Error("Unauthorized");

      // Persist question edits, including replacement image URLs.
      const res = await fetch(`/api/questions/${editingQuestion._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify(buildQuestionPayload(editingQuestion)),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to update question");

      setQuestions((prev) => ({
        ...prev,
        [editingQuestion.module_id]: (prev[editingQuestion.module_id] || []).map((question) =>
          question._id === editingQuestion._id ? data.data : question
        ),
      }));
      setEditingQuestion(null);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update question");
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

      // Delete the question and allow backend storage cleanup to run.
      const res = await fetch(`/api/questions/${questionId}`, {
        method: "DELETE",
        headers: { "x-user-id": userId },
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      setQuestions((prev) => ({
        ...prev,
        [moduleId]: (prev[moduleId] || []).filter((q) => q._id !== questionId),
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

  const getQuestionTypeLabel = (type?: string) => {
    if (type === "short-answer") return "Short answer";
    if (type === "fill-blank") return "Fill in the blank";
    return "Multiple choice";
  };

  const startQuestionEdit = (question: Question) => {
    setEditingQuestion({
      ...question,
      type: question.type || "test",
      question_img: question.question_img || "",
      options: question.options && question.options.length > 0 ? question.options : ["", "", "", ""],
      correctAnswers: question.correctAnswers && question.correctAnswers.length > 0 ? question.correctAnswers : [""],
      blanks:
        question.blanks && question.blanks.length > 0
          ? question.blanks
          : [{ blankId: "blank1", correctAnswers: [""], caseSensitive: false }],
    });
  };

  const insertMarkdownImage = (content: string, imageUrl: string, position?: number, alt = "Chapter image") => {
    const trimmedUrl = imageUrl.trim();
    if (!trimmedUrl) return content;
    const imageMarkdown = `![${alt}](${trimmedUrl})`;
    if (position === undefined || position < 0 || position > content.length) {
      return content ? `${content.trimEnd()}\n\n${imageMarkdown}\n\n` : `${imageMarkdown}\n\n`;
    }

    const before = content.slice(0, position).trimEnd();
    const after = content.slice(position).trimStart();

    if (!before && !after) return `${imageMarkdown}\n\n`;
    if (!before) return `${imageMarkdown}\n\n${after}`;
    if (!after) return `${before}\n\n${imageMarkdown}\n\n`;
    return `${before}\n\n${imageMarkdown}\n\n${after}`;
  };

  const renderChapterImageInserter = (onInsert: (imageUrl: string) => void) => {
    const userId = getUserId() || undefined;

    return (
      <div className="space-y-2 rounded border border-slate-200 bg-white p-2">
        <p className="text-xs font-medium text-slate-700">Insert image into content</p>
        <input
          type="url"
          placeholder="Paste image URL and press Enter"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onInsert(e.currentTarget.value);
              e.currentTarget.value = "";
            }
          }}
          className="w-full rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 outline-none focus:border-indigo-500"
        />
        <ImageUploader
          folder="chapters"
          userId={userId}
          onImageUpload={onInsert}
          className="text-xs"
        />
      </div>
    );
  };

  const renderQuestionImageControls = (value: string | undefined, onChange: (imageUrl: string) => void) => {
    const userId = getUserId() || undefined;

    return (
      <div className="space-y-2 rounded border border-slate-200 bg-white p-2">
        <input
          type="url"
          placeholder="Question image URL (optional)"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 outline-none focus:border-indigo-500"
        />
        {value && (
          <div className="space-y-2">
            <img
              src={value}
              alt="Question preview"
              className="max-h-40 w-full rounded border border-slate-200 object-contain"
            />
            <button
              type="button"
              onClick={() => onChange("")}
              className="rounded border border-rose-200 px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50"
            >
              Remove image
            </button>
          </div>
        )}
        <ImageUploader
          folder="questions"
          userId={userId}
          onImageUpload={onChange}
          className="text-xs"
        />
      </div>
    );
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
              setShowCreateCourseUploader(false);
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
            maxLength={COURSE_TEXT_LIMIT}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
          />
          <div>
            <textarea
              placeholder="Course description"
              value={courseForm.description}
              onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
              maxLength={COURSE_TEXT_LIMIT}
              className="h-20 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
            />
            <p className="mt-1 text-right text-xs text-slate-500">
              {courseForm.description.length}/{COURSE_TEXT_LIMIT}
            </p>
          </div>
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
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">Course image</label>
            {!showCreateCourseUploader ? (
              <div className="space-y-2">
                {courseForm.course_img ? (
                  <div className="space-y-2">
                    <img
                      src={courseForm.course_img}
                      alt="Course preview"
                      className="h-24 w-24 object-cover rounded-lg border border-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setCourseForm({ ...courseForm, course_img: "" });
                        setShowCreateCourseUploader(true);
                      }}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      Change image
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowCreateCourseUploader(true)}
                    className="rounded-lg border border-dashed border-slate-300 w-full p-4 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition"
                  >
                    Click to upload image
                  </button>
                )}
              </div>
            ) : (
              <ImageUploader
                folder="courses"
                userId={getUserId() || undefined}
                onImageUpload={(imageUrl) => {
                  setCourseForm({ ...courseForm, course_img: imageUrl });
                  setShowCreateCourseUploader(false);
                }}
              />
            )}
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-xs font-medium text-slate-700">Goals</label>
              <button
                type="button"
                onClick={() => setCourseForm({ ...courseForm, goals: [...courseForm.goals, ""] })}
                className="rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Add goal
              </button>
            </div>
            <div className="space-y-2">
              {courseForm.goals.length === 0 ? (
                <p className="rounded border border-dashed border-slate-300 bg-white p-3 text-xs text-slate-500">
                  No goals added yet.
                </p>
              ) : (
                courseForm.goals.map((goal, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={goal}
                      onChange={(e) => {
                        const nextGoals = [...courseForm.goals];
                        nextGoals[index] = e.target.value;
                        setCourseForm({ ...courseForm, goals: nextGoals });
                      }}
                      maxLength={COURSE_TEXT_LIMIT}
                      placeholder={`Goal ${index + 1}`}
                      className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setCourseForm({
                          ...courseForm,
                          goals: courseForm.goals.filter((_, goalIndex) => goalIndex !== index),
                        })
                      }
                      className="shrink-0 rounded-lg border border-rose-200 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50"
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
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
              onClick={() => {
                setIsCreatingNew(false);
                setShowCreateCourseUploader(false);
              }}
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
            maxLength={COURSE_TEXT_LIMIT}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
          />
          <div>
            <textarea
              value={editingCourse.description}
              onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })}
              maxLength={COURSE_TEXT_LIMIT}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 h-20"
            />
            <p className="mt-1 text-right text-xs text-slate-500">
              {editingCourse.description.length}/{COURSE_TEXT_LIMIT}
            </p>
          </div>
          <select
            value={editingCourse.ageGroup}
            onChange={(e) => setEditingCourse({ ...editingCourse, ageGroup: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
          >
            <option value="1-3">Age 1-3</option>
            <option value="4-9">Age 4-9</option>
            <option value="10-12">Age 10-12</option>
          </select>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">Course image</label>
            {!showEditCourseUploader ? (
              <div className="space-y-2">
                {editingCourse.course_img ? (
                  <img
                    src={editingCourse.course_img}
                    alt="Course preview"
                    className="h-24 w-24 object-cover rounded-lg border border-slate-200"
                  />
                ) : null}
                <button
                  type="button"
                  onClick={() => setShowEditCourseUploader(true)}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                >
                  {editingCourse.course_img ? "Change image" : "Click to upload image"}
                </button>
              </div>
            ) : (
              <ImageUploader
                folder="courses"
                userId={getUserId() || undefined}
                onImageUpload={(imageUrl) => {
                  setEditingCourse((prev) =>
                    prev ? { ...prev, course_img: imageUrl } : prev
                  );
                  setShowEditCourseUploader(false);
                }}
              />
            )}
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-xs font-medium text-slate-700">Goals</label>
              <button
                type="button"
                onClick={() =>
                  setEditingCourse({
                    ...editingCourse,
                    goals: [...(editingCourse.goals || []), ""],
                  })
                }
                className="rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Add goal
              </button>
            </div>
            <div className="space-y-2">
              {!editingCourse.goals || editingCourse.goals.length === 0 ? (
                <p className="rounded border border-dashed border-slate-300 bg-white p-3 text-xs text-slate-500">
                  No goals added yet.
                </p>
              ) : (
                editingCourse.goals.map((goal, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={goal}
                      onChange={(e) => {
                        const nextGoals = [...(editingCourse.goals || [])];
                        nextGoals[index] = e.target.value;
                        setEditingCourse({ ...editingCourse, goals: nextGoals });
                      }}
                      maxLength={COURSE_TEXT_LIMIT}
                      placeholder={`Goal ${index + 1}`}
                      className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setEditingCourse({
                          ...editingCourse,
                          goals: (editingCourse.goals || []).filter((_, goalIndex) => goalIndex !== index),
                        })
                      }
                      className="shrink-0 rounded-lg border border-rose-200 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50"
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
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
              onClick={() => {
                setEditingCourse(null);
                setShowEditCourseUploader(false);
              }}
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
                <div className="min-w-0 flex-1">
                  <div className="flex gap-3 items-start">
                    {course.course_img && (
                      <img
                        src={course.course_img}
                        alt={course.title}
                        className="h-16 w-16 object-cover rounded-lg flex-shrink-0 border border-slate-200"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 title={course.title} className="break-words font-medium text-slate-900">
                        {truncateText(course.title)}
                      </h3>
                      <p title={course.description} className="break-words text-sm text-slate-600">
                        {truncateText(course.description)}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">Age: {course.ageGroup}</p>
                      {course.goals && course.goals.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-slate-700">Goals:</p>
                          <ul className="text-xs text-slate-600 mt-1 list-disc list-inside">
                            {course.goals.map((goal, idx) => (
                              <li key={idx} title={goal} className="break-words">
                                {truncateText(goal)}
                              </li>
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
                      setShowEditCourseUploader(false);
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
                <div className="mt-4 space-y-4 rounded-lg border border-indigo-100 bg-indigo-50/40 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">Course structure</h4>
                      <p className="text-xs text-slate-500">Modules, chapters and quiz questions are loaded here for editing.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => loadModules(course._id)}
                      className="rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
                    >
                      Refresh
                    </button>
                  </div>
                  {modules[course._id]?.length === 0 || !modules[course._id] ? (
                    <p className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">No modules yet</p>
                  ) : (
                    modules[course._id].map((module) => (
                      <div key={module._id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
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
                          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{module.title}</p>
                              <p className="text-xs text-slate-500">
                                Order {module.order} · {chapters[module._id]?.length || 0} chapters · {questions[module._id]?.length || 0} questions
                              </p>
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
                                  loadModuleContent(module._id);
                                }}
                                className="rounded bg-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-300"
                              >
                                Refresh content
                              </button>
                            </div>
                          </div>
                        )}

                        {loadingModuleContent[module._id] && (
                          <p className="mt-3 rounded bg-slate-50 px-3 py-2 text-xs text-slate-500">Loading module content...</p>
                        )}

                        {/* Chapters */}
                        <div className="mt-4 grid gap-4 lg:grid-cols-2">
                          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                            <div className="mb-3 flex items-center justify-between">
                              <p className="text-sm font-semibold text-slate-800">Chapters</p>
                              <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-500">{chapters[module._id]?.length || 0}</span>
                            </div>
                            {chapters[module._id] && chapters[module._id].length > 0 ? (
                              <div className="space-y-2">
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
                                      ref={editingChapterContentRef}
                                      value={editingChapter.content}
                                      onChange={(e) => setEditingChapter({ ...editingChapter, content: e.target.value })}
                                      placeholder={"# Heading\n\nWrite **Markdown** content here.\n\n- List item\n- Another item"}
                                      className="h-40 w-full rounded border border-slate-300 px-2 py-2 font-mono text-xs leading-5 text-slate-900 outline-none focus:border-indigo-500"
                                    />
                                    {renderChapterImageInserter((imageUrl) =>
                                      setEditingChapter({
                                        ...editingChapter,
                                        content: insertMarkdownImage(
                                          editingChapter.content,
                                          imageUrl,
                                          editingChapterContentRef.current?.selectionStart
                                        ),
                                      })
                                    )}
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
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs font-medium text-slate-900">{chapter.title}</p>
                                      <p className="mt-1 max-h-10 overflow-hidden break-words text-xs leading-5 text-slate-500">
                                        {chapter.content}
                                      </p>
                                    </div>
                                    <div className="ml-2 flex shrink-0 gap-1">
                                      <button
                                        onClick={() => setEditingChapter(normalizeChapter(chapter))}
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
                            ) : (
                              <p className="rounded border border-dashed border-slate-300 bg-white p-3 text-xs text-slate-500">No chapters yet</p>
                            )}
                          </div>

                        {/* Add chapter form */}
                        {!editingChapter && (
                          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
                            <p className="text-sm font-semibold text-slate-800">Add chapter</p>
                            <input
                              type="text"
                              placeholder="New chapter title..."
                              value={chapterForm.title}
                              onChange={(e) => setChapterForm({ ...chapterForm, title: e.target.value })}
                              className="w-full rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 outline-none focus:border-indigo-500"
                            />
                            <textarea
                              ref={chapterFormContentRef}
                              placeholder={"# Heading\n\nWrite **Markdown** content here.\n\n- List item\n- Another item"}
                              value={chapterForm.content}
                              onChange={(e) => setChapterForm({ ...chapterForm, content: e.target.value })}
                              className="h-40 w-full rounded border border-slate-300 px-2 py-2 font-mono text-xs leading-5 text-slate-900 outline-none focus:border-indigo-500"
                            />
                            {renderChapterImageInserter((imageUrl) =>
                              setChapterForm({
                                ...chapterForm,
                                content: insertMarkdownImage(
                                  chapterForm.content,
                                  imageUrl,
                                  chapterFormContentRef.current?.selectionStart
                                ),
                              })
                            )}
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
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                          <div className="mb-3 flex items-center justify-between">
                            <p className="text-sm font-semibold text-amber-900">Quiz questions</p>
                            <span className="rounded-full bg-white px-2 py-0.5 text-xs text-amber-700">{questions[module._id]?.length || 0}</span>
                          </div>
                          {questions[module._id] && questions[module._id].length > 0 ? (
                            <div className="space-y-2">
                              {questions[module._id].map((question) => (
                                <div key={question._id} className="rounded border border-amber-200 bg-white p-3">
                                  {editingQuestion?._id === question._id ? (
                                    <div className="space-y-2">
                                      <p className="text-xs font-semibold text-amber-900">Editing {getQuestionTypeLabel(editingQuestion.type)}</p>
                                      {(editingQuestion.type === "test" || !editingQuestion.type) && (
                                        <div className="space-y-2">
                                          <input
                                            type="text"
                                            value={editingQuestion.question || ""}
                                            onChange={(e) => setEditingQuestion({ ...editingQuestion, question: e.target.value })}
                                            className="w-full rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 outline-none focus:border-indigo-500"
                                          />
                                          {renderQuestionImageControls(editingQuestion.question_img, (imageUrl) =>
                                            setEditingQuestion({ ...editingQuestion, question_img: imageUrl })
                                          )}
                                          <div className="flex items-center justify-between">
                                            <p className="text-xs font-medium text-slate-700">
                                              Options: {(editingQuestion.options || []).length}
                                            </p>
                                            <div className="flex gap-1">
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  setEditingQuestion({
                                                    ...editingQuestion,
                                                    options: [...(editingQuestion.options || []), ""],
                                                  })
                                                }
                                                className="rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                              >
                                                Add option
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const nextOptions = (editingQuestion.options || []).slice(0, -1);
                                                  setEditingQuestion({
                                                    ...editingQuestion,
                                                    options: nextOptions,
                                                    correctAnswer: Math.min(
                                                      editingQuestion.correctAnswer || 0,
                                                      Math.max(nextOptions.length - 1, 0)
                                                    ),
                                                  });
                                                }}
                                                disabled={(editingQuestion.options || []).length <= 2}
                                                className="rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                                              >
                                                Remove option
                                              </button>
                                            </div>
                                          </div>
                                          {(editingQuestion.options || ["", "", "", ""]).map((option, optionIndex) => (
                                            <input
                                              key={optionIndex}
                                              type="text"
                                              value={option}
                                              onChange={(e) => {
                                                const nextOptions = [...(editingQuestion.options || ["", "", "", ""])];
                                                nextOptions[optionIndex] = e.target.value;
                                                setEditingQuestion({ ...editingQuestion, options: nextOptions });
                                              }}
                                              placeholder={`Option ${optionIndex + 1}`}
                                              className="w-full rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 outline-none focus:border-indigo-500"
                                            />
                                          ))}
                                          <select
                                            value={editingQuestion.correctAnswer || 0}
                                            onChange={(e) => setEditingQuestion({ ...editingQuestion, correctAnswer: Number(e.target.value) })}
                                            className="w-full rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 outline-none focus:border-indigo-500"
                                          >
                                            {(editingQuestion.options || ["", "", "", ""]).map((_, optionIndex) => (
                                              <option key={optionIndex} value={optionIndex}>
                                                Correct option {optionIndex + 1}
                                              </option>
                                            ))}
                                          </select>
                                        </div>
                                      )}
                                      {editingQuestion.type === "short-answer" && (
                                        <div className="space-y-2">
                                          <input
                                            type="text"
                                            value={editingQuestion.question || ""}
                                            onChange={(e) => setEditingQuestion({ ...editingQuestion, question: e.target.value })}
                                            className="w-full rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 outline-none focus:border-indigo-500"
                                          />
                                          {renderQuestionImageControls(editingQuestion.question_img, (imageUrl) =>
                                            setEditingQuestion({ ...editingQuestion, question_img: imageUrl })
                                          )}
                                          {(editingQuestion.correctAnswers || [""]).map((answer, answerIndex) => (
                                            <div key={answerIndex} className="flex gap-1">
                                              <input
                                                type="text"
                                                value={answer}
                                                onChange={(e) => {
                                                  const nextAnswers = [...(editingQuestion.correctAnswers || [""])];
                                                  nextAnswers[answerIndex] = e.target.value;
                                                  setEditingQuestion({ ...editingQuestion, correctAnswers: nextAnswers });
                                                }}
                                                placeholder={`Answer ${answerIndex + 1}`}
                                                className="flex-1 rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 outline-none focus:border-indigo-500"
                                              />
                                              {answerIndex === (editingQuestion.correctAnswers || [""]).length - 1 && (
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    setEditingQuestion({
                                                      ...editingQuestion,
                                                      correctAnswers: [...(editingQuestion.correctAnswers || []), ""],
                                                    })
                                                  }
                                                  className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700"
                                                >
                                                  +
                                                </button>
                                              )}
                                            </div>
                                          ))}
                                          <label className="flex items-center gap-2 text-xs text-slate-700">
                                            <input
                                              type="checkbox"
                                              checked={editingQuestion.caseSensitive || false}
                                              onChange={(e) => setEditingQuestion({ ...editingQuestion, caseSensitive: e.target.checked })}
                                            />
                                            Case sensitive
                                          </label>
                                        </div>
                                      )}
                                      {editingQuestion.type === "fill-blank" && (
                                        <div className="space-y-2">
                                          <input
                                            type="text"
                                            value={editingQuestion.questionText || ""}
                                            onChange={(e) => setEditingQuestion({ ...editingQuestion, questionText: e.target.value })}
                                            className="w-full rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 outline-none focus:border-indigo-500"
                                          />
                                          {renderQuestionImageControls(editingQuestion.question_img, (imageUrl) =>
                                            setEditingQuestion({ ...editingQuestion, question_img: imageUrl })
                                          )}
                                          <div className="flex items-center justify-between">
                                            <p className="text-xs font-medium text-slate-700">
                                              Blanks: {(editingQuestion.blanks || []).length}
                                            </p>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                setEditingQuestion({
                                                  ...editingQuestion,
                                                  blanks: [
                                                    ...(editingQuestion.blanks || []),
                                                    {
                                                      blankId: `blank${(editingQuestion.blanks || []).length + 1}`,
                                                      correctAnswers: [""],
                                                      caseSensitive: false,
                                                    },
                                                  ],
                                                })
                                              }
                                              className="rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                            >
                                              Add blank
                                            </button>
                                          </div>
                                          {(editingQuestion.blanks || []).map((blank, blankIndex) => (
                                            <div key={blankIndex} className="rounded border border-slate-200 bg-slate-50 p-2 space-y-1">
                                              <div className="flex items-center justify-between">
                                                <p className="text-xs font-medium text-slate-600">Blank {blankIndex + 1}</p>
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    setEditingQuestion({
                                                      ...editingQuestion,
                                                      blanks: (editingQuestion.blanks || []).filter((_, index) => index !== blankIndex),
                                                    })
                                                  }
                                                  disabled={(editingQuestion.blanks || []).length <= 1}
                                                  className="text-xs font-medium text-rose-600 hover:text-rose-700 disabled:opacity-50"
                                                >
                                                  Remove
                                                </button>
                                              </div>
                                              <input
                                                type="text"
                                                value={blank.blankId}
                                                onChange={(e) => {
                                                  const nextBlanks = [...(editingQuestion.blanks || [])];
                                                  nextBlanks[blankIndex] = { ...blank, blankId: e.target.value };
                                                  setEditingQuestion({ ...editingQuestion, blanks: nextBlanks });
                                                }}
                                                className="w-full rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 outline-none focus:border-indigo-500"
                                              />
                                              <input
                                                type="text"
                                                value={blank.correctAnswers.join(", ")}
                                                onChange={(e) => {
                                                  const nextBlanks = [...(editingQuestion.blanks || [])];
                                                  nextBlanks[blankIndex] = {
                                                    ...blank,
                                                    correctAnswers: e.target.value.split(",").map((answer) => answer.trim()),
                                                  };
                                                  setEditingQuestion({ ...editingQuestion, blanks: nextBlanks });
                                                }}
                                                placeholder="Correct answers, comma-separated"
                                                className="w-full rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 outline-none focus:border-indigo-500"
                                              />
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                      <textarea
                                        placeholder="Explanation..."
                                        value={editingQuestion.explanation || ""}
                                        onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                                        className="w-full rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 outline-none focus:border-indigo-500 h-16"
                                      />
                                      <div className="flex gap-2">
                                        <button
                                          type="button"
                                          onClick={handleQuestionUpdate}
                                          disabled={saving}
                                          className="rounded bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                                        >
                                          Save question
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setEditingQuestion(null)}
                                          className="rounded border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs font-medium text-slate-900">{getQuestionDisplay(question)}</p>
                                        <p className="text-xs text-amber-700">{getQuestionTypeLabel(question.type)}</p>
                                        {question.question_img && (
                                          <img
                                            src={question.question_img}
                                            alt="Question"
                                            className="mt-2 max-h-24 w-full rounded border border-amber-100 object-contain"
                                          />
                                        )}
                                      </div>
                                      <div className="flex gap-1">
                                        <button
                                          type="button"
                                          onClick={() => startQuestionEdit(question)}
                                          className="rounded bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-700"
                                        >
                                          Edit
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleQuestionDelete(question._id, module._id)}
                                          className="rounded bg-rose-600 px-2 py-1 text-xs font-medium text-white hover:bg-rose-700"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="rounded border border-dashed border-amber-300 bg-white p-3 text-xs text-amber-700">No quiz questions yet</p>
                          )}
                        </div>

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
                                {renderQuestionImageControls(testQuestionForm.question_img, (imageUrl) =>
                                  setTestQuestionForm({ ...testQuestionForm, question_img: imageUrl })
                                )}
                                <div className="flex items-center justify-between">
                                  <p className="text-xs font-medium text-slate-700">Options: {testQuestionForm.options.length}</p>
                                  <div className="flex gap-1">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setTestQuestionForm({
                                          ...testQuestionForm,
                                          options: [...testQuestionForm.options, ""],
                                        })
                                      }
                                      className="rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                    >
                                      Add option
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setTestQuestionForm({
                                          ...testQuestionForm,
                                          options: testQuestionForm.options.slice(0, -1),
                                          correctAnswer: Math.min(
                                            testQuestionForm.correctAnswer,
                                            Math.max(testQuestionForm.options.length - 2, 0)
                                          ),
                                        })
                                      }
                                      disabled={testQuestionForm.options.length <= 2}
                                      className="rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                                    >
                                      Remove option
                                    </button>
                                  </div>
                                </div>
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
                                {renderQuestionImageControls(shortAnswerForm.question_img, (imageUrl) =>
                                  setShortAnswerForm({ ...shortAnswerForm, question_img: imageUrl })
                                )}
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
                                {renderQuestionImageControls(fillBlankForm.question_img, (imageUrl) =>
                                  setFillBlankForm({ ...fillBlankForm, question_img: imageUrl })
                                )}
                                <div className="flex items-center justify-between">
                                  <p className="text-xs font-medium text-slate-700">Blanks: {fillBlankForm.blanks.length}</p>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setFillBlankForm({
                                        ...fillBlankForm,
                                        blanks: [
                                          ...fillBlankForm.blanks,
                                          {
                                            blankId: `blank${fillBlankForm.blanks.length + 1}`,
                                            correctAnswers: [""],
                                            caseSensitive: false,
                                          },
                                        ],
                                      })
                                    }
                                    className="rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                  >
                                    Add blank
                                  </button>
                                </div>
                                {fillBlankForm.blanks.map((blank, i) => (
                                  <div key={i} className="bg-white p-2 rounded border border-slate-200 space-y-1">
                                    <div className="flex items-center justify-between">
                                      <p className="text-xs font-medium text-slate-600">Blank {i + 1}</p>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setFillBlankForm({
                                            ...fillBlankForm,
                                            blanks: fillBlankForm.blanks.filter((_, blankIndex) => blankIndex !== i),
                                          })
                                        }
                                        disabled={fillBlankForm.blanks.length <= 1}
                                        className="text-xs font-medium text-rose-600 hover:text-rose-700 disabled:opacity-50"
                                      >
                                        Remove
                                      </button>
                                    </div>
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
