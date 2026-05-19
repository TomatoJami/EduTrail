"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/common/Header";
import { MarkdownContent } from "@/components/MarkdownContent";
import { Course, Module, UserProgress, Question } from "@/types";

/** Defines the TypeScript shape for nav item. */
type NavItem = {
  id: string;
  title: string;
  type: "chapter" | "quiz" | "finish";
  moduleId?: string;
  moduleTitle?: string;
  questionIds?: string[];
};

/** Renders the check icon interface. */
function CheckIcon({ done }: { done: boolean }) {
  if (done) {
    // Returns the JSX layout for this render state.
    return (
      <span className="mt-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white text-[10px]"></span>
    );
  }

  // Returns the JSX layout for this render state.
  return (
    <span className="mt-0.5 h-4 w-4 rounded-full border border-slate-300 bg-white" />
  );
}

/** Renders the chevron icon interface. */
function ChevronIcon({ open }: { open: boolean }) {
  // Returns the JSX layout for this render state.
  return (
    <svg
      viewBox="0 0 20 20"
      className={`h-4 w-4 transition-transform ${open ? "rotate-90" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M7 4l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Renders the chapter page interface. */
export default function ChapterPage() {
  const params = useParams();
  const router = useRouter();

  const courseId = params.id as string;
  const chapterId = params.chapterId as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress>({
    // Renders the chapters UI.
    chapters: {},
    // Renders the questions UI.
    questions: {},
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [finishError, setFinishError] = useState<string | null>(null);

  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});

  const [shouldComplete, setShouldComplete] = useState(true);
  const [shouldCompleteQuiz, setShouldCompleteQuiz] = useState(true);

  const [courseProgress, setCourseProgress] = useState<any>(null);

  // Quiz states
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, any>>({});
  const [isQuizSubmitted, setIsQuizSubmitted] = useState(false);

  // Synchronizes browser state or side effects after render.
  useEffect(() => {
    setShouldComplete(true);
    setShouldCompleteQuiz(true);
  }, [chapterId]);

  // Load quiz questions when quiz item is selected
  useEffect(() => {
    if (!chapterId?.startsWith("quiz-")) {
      setQuizQuestions([]);
      setSelectedAnswers({});
      setIsQuizSubmitted(false);
      return;
    }

    // Extract moduleId from quiz-{moduleId}
    const moduleId = chapterId.substring(5);
    const courseModule = modules.find((m) => m._id === moduleId);

    if (courseModule?.questions) {
      setQuizQuestions(courseModule.questions);
      setSelectedAnswers({});
      setIsQuizSubmitted(false);
    }
  }, [chapterId, modules]);

  // Synchronizes browser state or side effects after render.
  useEffect(() => {
    if (!courseId) return;

    // Create abort controller for this request
    const abortController = new AbortController();

    /** Renders the fetch data interface. */
    const fetchData = async () => {
      try {
        setLoading(true);

        const storedUser = localStorage.getItem("user");
        if (!storedUser) {
          router.push("/login");
          return;
        }
        

        // Load the course shell through the Next.js API proxy.
        const courseRes = await fetch(`/api/courses/${courseId}`, {
          signal: abortController.signal,
        });
        if (!courseRes.ok) throw new Error("Failed to fetch course");
        const courseData = await courseRes.json();
        if (!abortController.signal.aborted) setCourse(courseData.data || courseData);

        // Load modules, chapters, and questions as one content payload.
        const contentRes = await fetch(`/api/courses/${courseId}/content`, {
          signal: abortController.signal,
        });
        if (!contentRes.ok) throw new Error("Failed to fetch content");
        const contentData = await contentRes.json();
        const fetchedModules: Module[] = contentData.data || [];
        if (!abortController.signal.aborted) setModules(fetchedModules);

        // Open all modules by default
        const initialOpen: Record<string, boolean> = {};
        fetchedModules.forEach((m) => {
            initialOpen[m._id] = true;
        });
        if (!abortController.signal.aborted) setOpenModules(initialOpen);

        const user = JSON.parse(storedUser);

        // Load learner progress so completed chapters/questions render correctly.
        const progressRes = await fetch(`/api/courses/${courseId}/progress`, {
          headers: {
            "x-user-id": user._id || user.id || "",
          },
          signal: abortController.signal,
        });

        if (progressRes.ok) {
          const progressData = await progressRes.json();

          const chaptersMap: Record<string, boolean> = {};
          const questionsMap: Record<string, boolean> = {};

          const progress = progressData.data || {};

          // Handle both possible formats:
          // 1. { "chapterId": true }
          // 2. { "chapterId": { is_completed: true } }

          if (progress.chapters && typeof progress.chapters === "object") {
            for (const [id, value] of Object.entries(progress.chapters)) {
              if (typeof value === "boolean") {
                chaptersMap[id] = value;
              } else if (
                value &&
                typeof value === "object" &&
                "is_completed" in value
              ) {
                chaptersMap[id] = Boolean(
                  (value as { is_completed: boolean }).is_completed
                );
              }
            }
          }

          if (progress.questions && typeof progress.questions === "object") {
            for (const [id, value] of Object.entries(progress.questions)) {
              if (typeof value === "boolean") {
                questionsMap[id] = value;
              } else if (
                value &&
                typeof value === "object" &&
                "is_completed" in value
              ) {
                questionsMap[id] = Boolean(
                  (value as { is_completed: boolean }).is_completed
                );
              }
            }
          }

          const courseProgressRes = await fetch(`/api/progress/courses/${courseId}`, {
            headers: {
              "x-user-id": user._id || user.id || "",
            },
            signal: abortController.signal,
          });

          if (courseProgressRes.ok) {
            const courseProgressData = await courseProgressRes.json();

            if (!abortController.signal.aborted) {
              setCourseProgress(courseProgressData.data || null);
            }
          }

          // Only update state if request wasn't aborted
          if (!abortController.signal.aborted) {
            setUserProgress({
              chapters: chaptersMap,
              questions: questionsMap,
            });
          }
        }

        if (!abortController.signal.aborted) {
          setError(null);
        }
        } catch (err) {
            // Don't show error if request was aborted
            if (err instanceof Error && err.name === 'AbortError') {
              return;
            }
            setError(
            err instanceof Error ? err.message : "An unexpected error occurred"
            );
        } finally {
            if (!abortController.signal.aborted) {
              setLoading(false);
            }
        }
        };

        fetchData();

        // Cleanup: Abort fetch if component unmounts or dependencies change
        return () => {
          abortController.abort();
        };
    }, [courseId, router]);

    // Check if user has access to this course
    useEffect(() => {
      if (!loading && courseProgress === null) {
        // No courseProgress found or not started
        router.push("/courses");
        return;
      }

      if (!loading && courseProgress && !courseProgress.status) {
        // Course status doesn't exist
        router.push("/courses");
        return;
      }

      if (!loading && courseProgress && courseProgress.status !== 'in_progress' && courseProgress.status !== 'completed') {
        router.push("/courses");
        return;
      }
    }, [loading, courseProgress, router]);

    /** Renders the handle next click interface. */
    const handleNextClick = async () => {
      const chapterKey = String(chapterId);
      const isCompleted = !!userProgress.chapters[chapterKey];

      if (!currentItem) return;

      // save only if not saved yet
      if (
        currentItem?.type === "chapter" &&
        shouldComplete &&
        !isCompleted
      ) {
        try {
          const storedUser = localStorage.getItem("user");
          const user = storedUser ? JSON.parse(storedUser) : null;
          const userId = user?._id || user?.id || "";

          // Persist automatic chapter completion before moving to the next item.
          const response = await fetch(`/api/progress/chapters/${chapterId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "x-user-id": userId,
            },
            body: JSON.stringify({
              is_completed: true,
            }),
          });

          if (!response.ok) {
            throw new Error(`Failed to save progress: ${response.statusText}`);
          }

          await response.json();

          setUserProgress((prev) => ({
            ...prev,
            // Renders the chapters UI.
            chapters: {
              ...prev.chapters,
              [chapterKey]: true
            },
          }));
        } catch (e) {
          setError(e instanceof Error ? e.message : "Failed to save progress");
        }
      }

      if (nextItem) {
        router.push(`/courses/${courseId}/${nextItem.id}`);
      }
    };

  // Handle quiz answer selection
  const handleAnswerSelect = (questionId: string, answer: any) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  // Submit quiz - show results locally only
  const handleSubmitQuiz = () => {
    setIsQuizSubmitted(true);
  };


  /** Renders the handle try again interface. */
  const handleTryAgain = () => {
    setSelectedAnswers({});
    setIsQuizSubmitted(false);
  };

  // Flat navigation list
  const navItems = useMemo<NavItem[]>(() => {
    const items: NavItem[] = [];

    modules.forEach((module) => {
      // Chapters
      module.chapters.forEach((chapter) => {
        items.push({
          id: chapter._id,
          title: chapter.title,
          type: "chapter",
          moduleId: module._id,
          moduleTitle: module.title,
        });
      });

      // Quiz (always at end of module)
      if (module.questions?.length > 0) {
        items.push({
          id: `quiz-${module._id}`,
          title: `Quiz: ${module.title}`,
          type: "quiz",
          moduleId: module._id,
          moduleTitle: module.title,
          questionIds: module.questions.filter(q => q).map((q) => q._id),
        });
      }
    });

    // Add Finish item at the end
    items.push({
      id: "finish",
      title: "Finish",
      type: "finish",
    });

    return items;
  }, [modules]);

  const currentItem = navItems.find((item) => item.id === chapterId);

  const currentChapter = useMemo(() => {
    for (const courseModule of modules) {
      const chapter = courseModule.chapters.find((c) => c._id === chapterId);
      if (chapter) return chapter;
    }
    return null;
  }, [modules, chapterId]);

  const currentIndex = navItems.findIndex((item) => item.id === chapterId);
  const prevItem = currentIndex > 0 ? navItems[currentIndex - 1] : null;
  const nextItem =
    currentIndex >= 0 && currentIndex < navItems.length - 1
      ? navItems[currentIndex + 1]
      : null;

  const totalItems = navItems.length;

  const isCourseFinished =
    courseProgress?.status === "completed" ||
    courseProgress?.status === "finished";

  const completedItems = navItems.reduce((count, item) => {
    if (item.id === "finish") {
      return userProgress.chapters["finish"] || isCourseFinished
        ? count + 1
        : count;
    }

    if (item.type === "chapter") {
      return userProgress.chapters[item.id] ? count + 1 : count;
    }

    if (item.type === "quiz") {
      const questionIds = item.questionIds || [];

      const isQuizCompleted = questionIds.every(
        (qId) => userProgress.questions[qId]
      );

      return isQuizCompleted ? count + 1 : count;
    }

    return count;
  }, 0);

  const progressPercent =
    totalItems > 0
      ? Math.round((completedItems / totalItems) * 100)
      : 0;

  const requiredItems = navItems.filter((item) => item.type !== "finish");
  const areAllModulesComplete =
    requiredItems.length > 0 &&
    requiredItems.every((item) => {
      if (item.type === "chapter") {
        return Boolean(userProgress.chapters[item.id]);
      }

      const questionIds = item.questionIds || [];
      return questionIds.every((questionId) => Boolean(userProgress.questions[questionId]));
    });
  const canOpenFinish = areAllModulesComplete || isCourseFinished;

  const firstIncompleteRequiredItem = requiredItems.find((item) => {
    if (item.type === "chapter") {
      return !userProgress.chapters[item.id];
    }

    const questionIds = item.questionIds || [];
    return questionIds.some((questionId) => !userProgress.questions[questionId]);
  });

  // Direct /finish visits are redirected until every required learning item is complete.
  useEffect(() => {
    if (loading || chapterId !== "finish") {
      return;
    }

    if (canOpenFinish) {
      return;
    }

    if (firstIncompleteRequiredItem) {
      router.replace(`/courses/${courseId}/${firstIncompleteRequiredItem.id}`);
      return;
    }

    router.replace(`/courses/${courseId}`);
  }, [
    canOpenFinish,
    chapterId,
    courseId,
    firstIncompleteRequiredItem,
    loading,
    router,
  ]);


  if (loading) {
    // Returns the JSX layout for this render state.
    return (
		<main className="flex-1">
			<section className="bg-white min-h-screen flex items-center justify-center">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
			</section>
		</main>
    );
  }

  if (error || !course) {
    // Returns the JSX layout for this render state.
    return (
      <main className="flex-1 min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center px-4">
          <div className="mb-8">
            <h1 className="text-6xl font-bold text-indigo-600 mb-2">404</h1>
            <h2 className="text-3xl font-bold text-slate-800 mb-4 break-words">Content Not Found</h2>
            <p className="text-lg text-slate-600 mb-8 break-words">
              {error || "Sorry, the content you're looking for doesn't exist or has been moved."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/courses/${courseId}`}
              className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Back to Course
            </Link>
            <Link
              href="/courses"
              className="px-6 py-3 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 transition-colors"
            >
              Browse All Courses
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Returns the JSX layout for this render state.
  return (
    <>
      <Header />

      <main className="flex min-h-screen bg-slate-50">

        <div className="flex flex-1">
          {/* Learning Sidebar */}
          <aside className="hidden w-80 shrink-0 border-r border-slate-200 bg-white lg:block">
            <div className="sticky top-0 h-screen overflow-y-auto">
              <div className="p-5">
                <Link
                  href={`/courses/${courseId}`}
                  className="text-sm font-medium text-slate-500 hover:text-slate-700"
                >
                  ← Back to Skill Path
                </Link>

                <h1 className="mt-4 text-lg font-semibold text-slate-900 break-words">
                  {course.title}
                </h1>

                {/* Progress */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{progressPercent}% Completed</span>
                    <span>
                      {completedItems}/{totalItems}
                    </span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Modules */}
                <div className="mt-6 space-y-4">
                  {modules.map((module) => (
                    <div key={module._id}>
                      <button
                        type="button"
                        onClick={() =>
                          setOpenModules((prev) => ({
                            ...prev,
                            [module._id]: !prev[module._id],
                          }))
                        }
                        className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left hover:bg-slate-50"
                      >
                        <span className="text-sm font-semibold text-slate-900 break-words">
                          {module.title}
                        </span>
                        <ChevronIcon open={!!openModules[module._id]} />
                      </button>

                      {openModules[module._id] && (
                        <div className="mt-2 space-y-1 pl-2">
                          {/* Chapters */}
                          {module.chapters.map((chapter) => {
                            const isActive = chapter._id === chapterId;
                            const chapterKey = String(chapter._id);
                            const isDone = Boolean(userProgress.chapters?.[chapterKey]);

                            // Returns the JSX layout for this render state.
                            return (
                            <Link
                                key={chapter._id}
                                href={`/courses/${courseId}/${chapter._id}`}
                                className={`flex items-start gap-3 rounded-lg px-3 py-2 text-sm transition ${
                                isActive
                                    ? "bg-indigo-50 text-indigo-700"
                                    : "text-slate-700 hover:bg-slate-50"
                                }`}
                            >
                                <CheckIcon done={isDone} />
                                <span className="leading-5 break-words">{chapter.title}</span>
                            </Link>
                            );
                          })}

                          {/* Quiz */}
                          {module.questions?.length > 0 && (() => {
                            const quizId = `quiz-${module._id}`;
                            // Check if all questions in this module are completed
                            const isQuizDone = module.questions.filter(q => q).every(
                              (q) => userProgress.questions?.[q._id] === true
                            );
                            
                            // Returns the JSX layout for this render state.
                            return (
                              <Link
                                href={`/courses/${courseId}/${quizId}`}
                                className={`flex items-start gap-3 rounded-lg px-3 py-2 text-sm transition ${
                                  chapterId === quizId
                                    ? "bg-indigo-50 text-indigo-700"
                                    : "text-slate-700 hover:bg-slate-50"
                                }`}
                              >
                                <CheckIcon done={isQuizDone} />
                                <span className="break-words">Quiz: {module.title}</span>
                              </Link>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Finish stays disabled until all required chapters and quizzes are complete. */}
                {canOpenFinish ? (
                  <Link
                    href={`/courses/${courseId}/finish`}
                    className={`flex items-start gap-3 rounded-lg px-3 py-2 text-sm transition ${
                      chapterId === "finish"
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <CheckIcon
                      done={
                        userProgress.chapters["finish"] === true ||
                        courseProgress?.status === "completed" ||
                        courseProgress?.status === "finished"
                      }
                    />
                    <span className="leading-5 font-semibold break-words">Finish</span>
                  </Link>
                ) : (
                  <div
                    aria-disabled="true"
                    className="flex cursor-not-allowed items-start gap-3 rounded-lg px-3 py-2 text-sm text-slate-400"
                  >
                    <CheckIcon done={false} />
                    <span className="leading-5 font-semibold break-words">Finish</span>
                  </div>
                )}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <section className="min-w-0 flex-1 bg-white">
            <div className="mx-auto max-w-4xl px-6 py-8 lg:px-12">
              {/* Breadcrumb */}
              <div className="mb-6 text-sm text-slate-500 break-words">
                {currentItem?.moduleTitle}
              </div>

              {/* Chapter Content */}
              {currentItem?.type === "chapter" && currentChapter ? (
                <>
                  <h1 className="text-3xl font-bold tracking-tight text-slate-900 break-words">
                    {currentChapter.title}
                  </h1>

                  <MarkdownContent content={currentChapter.content || ""} />
                </>
              ) : currentItem?.type === "quiz" ? (
                <>
                  <h1 className="text-3xl font-bold tracking-tight text-slate-900 break-words">
                    {currentItem.title}
                  </h1>

              {/* Quiz Questions */}
                  <div className="mt-8 space-y-8">
                    {quizQuestions.length === 0 ? (
                      <p className="text-slate-600 break-words">No questions available for this quiz.</p>
                    ) : (
                      quizQuestions.map((question, idx) => {
                        const questionType = (question as any).type || 'test';

                        // Returns the JSX layout for this render state.
                        return (
                          <div
                            key={question._id}
                            className="rounded-lg border border-slate-200 p-6"
                          >
                            <div className="flex items-start gap-3">
                              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
                                {idx + 1}
                              </span>
                              <div className="flex-1">
                                {/* Test Question */}
                                {questionType === 'test' && (
                                  <>
                                    <h3 className="text-lg font-medium text-slate-900 break-words">
                                      {(question as any).question}
                                    </h3>
                                    {(question as any).question_img && (
                                      <img
                                        src={(question as any).question_img}
                                        alt="Question illustration"
                                        className="mx-auto mt-4 block max-h-64 w-auto max-w-full sm:max-w-md object-contain"
                                      />
                                    )}

                                    <div className="mt-4 space-y-3">
                                      {(question as any).options?.map((option: string, optIdx: number) => {
                                        const selectedIdx = selectedAnswers[question._id];
                                        const isSelected = selectedIdx === optIdx;
                                        const isCorrectAnswer = optIdx === (question as any).correctAnswer;
                                        const isCorrect = selectedIdx === (question as any).correctAnswer;

                                        let buttonClass = "w-full text-left rounded-lg border-2 p-3 transition break-words";

                                        if (isQuizSubmitted) {
                                          if (isCorrectAnswer) {
                                            buttonClass += "border-emerald-500 bg-emerald-100 text-emerald-900";
                                          } else if (isSelected && !isCorrect) {
                                            buttonClass += "border-red-500 bg-red-100 text-red-900";
                                          } else {
                                            buttonClass += "border-slate-300 bg-slate-100 text-slate-600";
                                          }
                                        } else {
                                          if (isSelected) {
                                            buttonClass += "border-indigo-500 bg-indigo-100 text-indigo-900";
                                          } else {
                                            buttonClass += "border-slate-300 bg-white text-slate-700 hover:border-indigo-300 hover:bg-slate-50";
                                          }
                                        }

                                        // Returns the JSX layout for this render state.
                                        return (
                                          <button
                                            key={optIdx}
                                            type="button"
                                            onClick={() =>
                                              !isQuizSubmitted &&
                                              handleAnswerSelect(question._id, optIdx)
                                            }
                                            disabled={isQuizSubmitted}
                                            className={buttonClass}
                                          >
                                            <span className="font-medium">
                                              {String.fromCharCode(65 + optIdx)}.
                                            </span>{" "}
                                            {option}
                                            {isQuizSubmitted && isCorrectAnswer && (
                                              <span className="ml-2 text-emerald-600">
                                                ✓
                                              </span>
                                            )}
                                            {isQuizSubmitted && isSelected && !isCorrect && (
                                              <span className="ml-2 text-red-600">
                                                ✗
                                              </span>
                                            )}
                                          </button>
                                        );
                                      })}
                                    </div>

                                    {isQuizSubmitted && (question as any).explanation && (
                                      <div className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-900 break-words">
                                        <strong>Explanation:</strong> {(question as any).explanation}
                                      </div>
                                    )}
                                  </>
                                )}

                                {/* Short Answer Question */}
                                {questionType === 'short-answer' && (
                                  <>
                                    <h3 className="text-lg font-medium text-slate-900 break-words">
                                      {(question as any).question}
                                    </h3>
                                    {(question as any).question_img && (
                                      <img
                                        src={(question as any).question_img}
                                        alt="Question illustration"
                                        className="mx-auto mt-4 block max-h-64 w-auto max-w-full sm:max-w-md object-contain"
                                      />
                                    )}

                                    <div className="mt-4">
                                      <input
                                        type="text"
                                        value={selectedAnswers[question._id] || ''}
                                        onChange={(e) =>
                                          !isQuizSubmitted &&
                                          handleAnswerSelect(question._id, e.target.value)
                                        }
                                        placeholder="Enter your answer..."
                                        disabled={isQuizSubmitted}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-indigo-500 disabled:bg-slate-100"
                                      />
                                    </div>

                                    {isQuizSubmitted && (
                                      <div className={`mt-4 rounded-lg p-3 text-sm break-words ${
                                        (question as any).correctAnswers.some((ans: string) =>
                                          (question as any).caseSensitive
                                            ? ans === selectedAnswers[question._id]
                                            : ans.toLowerCase() === (selectedAnswers[question._id] || '').toLowerCase()
                                        )
                                          ? 'bg-emerald-50 text-emerald-900'
                                          : 'bg-red-50 text-red-900'
                                      }`}>
                                        {(question as any).correctAnswers.some((ans: string) =>
                                          (question as any).caseSensitive
                                            ? ans === selectedAnswers[question._id]
                                            : ans.toLowerCase() === (selectedAnswers[question._id] || '').toLowerCase()
                                        ) ? (
                                          <div>
                                            <strong className="text-emerald-600">✓ Correct!</strong>
                                            {(question as any).explanation && (
                                              <p className="mt-2 break-words">{(question as any).explanation}</p>
                                            )}
                                          </div>
                                        ) : (
                                          <div>
                                            <strong className="text-red-600">✗ Incorrect</strong>
                                            <p className="mt-2 break-words">Correct answer(s): {(question as any).correctAnswers.join(', ')}</p>
                                            {(question as any).explanation && (
                                              <p className="mt-2 break-words">{(question as any).explanation}</p>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </>
                                )}

                                {/* Fill in the Blank Question */}
                                {questionType === 'fill-blank' && (
                                  <>
                                    <h3 className="text-lg font-medium text-slate-900 break-words">
                                      {(question as any).questionText}
                                    </h3>
                                    {(question as any).question_img && (
                                      <img
                                        src={(question as any).question_img}
                                        alt="Question illustration"
                                        className="mx-auto mt-4 block max-h-64 w-auto max-w-full sm:max-w-md object-contain"
                                      />
                                    )}

                                    <div className="mt-4 space-y-3">
                                      {(question as any).blanks?.map((blank: any, blankIdx: number) => (
                                        <div key={blankIdx}>
                                          <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Blank {blankIdx + 1}:
                                          </label>
                                          <input
                                            type="text"
                                            value={selectedAnswers[question._id]?.[blankIdx] || ''}
                                            onChange={(e) => {
                                              if (!isQuizSubmitted) {
                                                const current = selectedAnswers[question._id] || [];
                                                const newAnswers = [...current];
                                                newAnswers[blankIdx] = e.target.value;
                                                handleAnswerSelect(question._id, newAnswers);
                                              }
                                            }}
                                            placeholder={`Answer for blank ${blankIdx + 1}...`}
                                            disabled={isQuizSubmitted}
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-indigo-500 disabled:bg-slate-100"
                                          />
                                        </div>
                                      ))}
                                    </div>

                                    {isQuizSubmitted && (
                                      <div className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-900 break-words">
                                        {(question as any).blanks?.map((blank: any, blankIdx: number) => {
                                          const userAnswer = selectedAnswers[question._id]?.[blankIdx] || '';
                                          const isCorrect = blank.correctAnswers.some((ans: string) =>
                                            blank.caseSensitive
                                              ? ans === userAnswer
                                              : ans.toLowerCase() === userAnswer.toLowerCase()
                                          );
                                          // Returns the JSX layout for this render state.
                                          return (
                                            <div key={blankIdx} className="mb-2 break-words">
                                              <strong>Blank {blankIdx + 1}:</strong> {userAnswer || '(not answered)'}{' '}
                                              {isCorrect ? (
                                                <span className="text-emerald-600">✓</span>
                                              ) : (
                                                <span className="text-red-600">✗ (correct: {blank.correctAnswers.join(', ')})</span>
                                              )}
                                            </div>
                                          );
                                        })}
                                        {(question as any).explanation && (
                                          <p className="mt-3 border-t border-blue-200 pt-2 break-words">{(question as any).explanation}</p>
                                        )}
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Submit Button */}
                  {quizQuestions.length > 0 && !isQuizSubmitted && (
                    <button
                      type="button"
                      onClick={handleSubmitQuiz}
                      className="mt-8 rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white hover:bg-indigo-700"
                    >
                      Submit Quiz
                    </button>
                  )}

                  {/* Results Summary */}
                  {isQuizSubmitted && (() => {
                    let correctCount = 0;

                    quizQuestions.forEach((q) => {
                      const questionType = (q as any).type || 'test';
                      const userAnswer = selectedAnswers[q._id];

                      if (questionType === 'test') {
                        if (userAnswer === (q as any).correctAnswer) {
                          correctCount++;
                        }
                      } else if (questionType === 'short-answer') {
                        if ((q as any).correctAnswers.some((ans: string) =>
                          (q as any).caseSensitive
                            ? ans === userAnswer
                            : ans.toLowerCase() === (userAnswer || '').toLowerCase()
                        )) {
                          correctCount++;
                        }
                      } else if (questionType === 'fill-blank') {
                        const allCorrect = (q as any).blanks?.every((blank: any, idx: number) => {
                          const blankAnswer = userAnswer?.[idx] || '';
                          return blank.correctAnswers.some((ans: string) =>
                            blank.caseSensitive
                              ? ans === blankAnswer
                              : ans.toLowerCase() === blankAnswer.toLowerCase()
                          );
                        });
                        if (allCorrect) {
                          correctCount++;
                        }
                      }
                    });

                    const totalCount = quizQuestions.length;

                    // Returns the JSX layout for this render state.
                    return (
                      <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-6">
                        <h3 className="text-xl font-semibold text-gray-900 break-words">
                          Quiz Results
                        </h3>

                        <p className="mt-2 text-gray-700 break-words">
                          You scored {correctCount} out of {totalCount}.
                        </p>

                        <button
                          type="button"
                          onClick={handleTryAgain}
                          className="mt-4 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Try Again
                        </button>
                      </div>
                    );
                  })()}
                </>
              ) : currentItem?.type === "finish" ? (
                !areAllModulesComplete ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
                      <svg className="h-10 w-10 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                      </svg>
                    </div>

                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-3 break-words">
                      Course is not ready to finish
                    </h1>

                    <p className="max-w-2xl text-lg text-slate-600 break-words">
                      Complete all chapters and questions before opening the finish step.
                    </p>
                  </div>
                ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  {/* Success Icon */}
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 mb-6">
                    <svg className="h-12 w-12 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>

                  <h1 className="text-4xl font-bold tracking-tight text-slate-900 text-center mb-3 break-words">
                    Congratulations!
                  </h1>

                  <p className="text-xl text-slate-600 text-center mb-4 max-w-2xl break-words">
                    You have successfully completed the entire course. Great work!
                  </p>

                  <p className="text-lg text-slate-500 text-center mb-8 max-w-2xl break-words">
                    Now click the button below to finish the course and return to the main page.
                  </p>
                </div>
                )
              ) : (
                <div className="text-slate-500 break-words">Content not found.</div>
              )}

              {/* Bottom Navigation */}
              <div className="mt-12 border-t border-slate-200 pt-6">
                <div className="flex items-center justify-between gap-4">
                  {prevItem ? (
                    <Link
                      href={`/courses/${courseId}/${prevItem.id}`}
                      className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      ← Previous
                    </Link>
                  ) : (
                    <div />
                  )}

                  <div className="flex items-center gap-3">
                    {currentItem?.type === "chapter" && (
                      <button
                        type="button"
                        onClick={() => setShouldComplete((prev) => !prev)}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                          shouldComplete
                            ? "bg-emerald-600 text-white"
                            : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {shouldComplete ? "✓ Will Complete" : "Mark as Complete"}
                      </button>
                    )}

                    {currentItem?.type === "quiz" && (
                      <button
                        type="button"
                        onClick={() => setShouldCompleteQuiz((prev) => !prev)}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                          shouldCompleteQuiz
                            ? "bg-emerald-600 text-white"
                            : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {shouldCompleteQuiz ? "✓ Will Complete" : "Mark as Complete"}
                      </button>
                    )}

                    {nextItem && (
                      <button
                        type="button"
                        onClick={async () => {
                          if (
                            currentItem?.type === "quiz" &&
                            shouldCompleteQuiz &&
                            isQuizSubmitted
                          ) {
                            // Save quiz as completed by marking all questions as completed
                            try {
                              const storedUser = localStorage.getItem("user");
                              const user = storedUser ? JSON.parse(storedUser) : null;
                              const userId = user?._id || user?.id || "";

                              // Save each question as completed on the backend.
                              for (const question of quizQuestions) {
                                await fetch(`/api/progress/questions/${question._id}`, {
                                  method: "PUT",
                                  headers: {
                                    "Content-Type": "application/json",
                                    "x-user-id": userId,
                                  },
                                  body: JSON.stringify({
                                    is_completed: true,
                                  }),
                                });
                              }

                              setUserProgress((prev) => ({
                                ...prev,
                                // Renders the questions UI.
                                questions: {
                                  ...prev.questions,
                                  ...Object.fromEntries(
                                    quizQuestions.map(q => [q._id, true])
                                  ),
                                },
                              }));
                            } catch {
                            }
                          }

                          await handleNextClick();
                        }}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                      >
                        {currentItem?.type === "quiz" ? "Finish Module" : "Next →"}
                      </button>
                    )}

                    {currentItem?.type === "finish" && (
                      <button
                        type="button"
                        onClick={async () => {
                          if (!areAllModulesComplete) {
                            setFinishError("Complete all modules first.");
                            return;
                          }

                          try {
                            setFinishError(null);
                            const storedUser = localStorage.getItem("user");
                            const user = storedUser ? JSON.parse(storedUser) : null;
                            const userId = user?._id || user?.id || "";

                            // Mark the course as completed after all required items are done.
                            const response = await fetch(`/api/progress/courses/${courseId}/status`, {
                              method: "PUT",
                              headers: {
                                "Content-Type": "application/json",
                                "x-user-id": userId,
                              },
                              body: JSON.stringify({
                                status: "completed",
                              }),
                            });

                            if (!response.ok) {
                              const data = await response.json().catch(() => null);
                              throw new Error(data?.message || "Complete all modules first.");
                            }

                            // Mark finish page as completed
                            setUserProgress((prev) => ({
                              ...prev,
                              // Renders the chapters UI.
                              chapters: {
                                ...prev.chapters,
                                ["finish"]: true,
                              },
                            }));

                            // Navigate back to course
                            router.push(`/courses/${courseId}`);
                          } catch (e) {
                            setFinishError(e instanceof Error ? e.message : "Complete all modules first.");
                          }
                        }}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                      >
                        Finish Course
                      </button>
                    )}
                  </div>
                </div>
                {currentItem?.type === "finish" && finishError && (
                  <p className="mt-4 text-right text-sm font-medium text-rose-600 break-words">
                    {finishError}
                  </p>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

    </>
  );
}
