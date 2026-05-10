"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { Sidebar } from "@/components/common/Sidebar";
import { Course, Module, UserProgress } from "@/types";

type NavItem = {
  id: string;
  title: string;
  type: "chapter" | "quiz";
  moduleId: string;
  moduleTitle: string;
  questionIds?: string[];
};

function CheckIcon({ done }: { done: boolean }) {
  if (done) {
    return (
      <span className="mt-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white text-[10px]">
        ✓
      </span>
    );
  }

  return (
    <span className="mt-0.5 h-4 w-4 rounded-full border border-slate-300 bg-white" />
  );
}

function ChevronIcon({ open }: { open: boolean }) {
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

function FolderIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        d="M3.75 7.5A2.25 2.25 0 0 1 6 5.25h3.5c.6 0 1.17.24 1.59.66l1.06 1.09c.42.42.99.66 1.59.66H18A2.25 2.25 0 0 1 20.25 9.9v6.35A2.25 2.25 0 0 1 18 18.5H6a2.25 2.25 0 0 1-2.25-2.25V7.5Z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function QuizIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M7 4.5h10A2.5 2.5 0 0 1 19.5 7v10A2.5 2.5 0 0 1 17 19.5H7A2.5 2.5 0 0 1 4.5 17V7A2.5 2.5 0 0 1 7 4.5Z" />
      <path d="M9 10.2h6M9 13.1h4.2" strokeLinecap="round" />
    </svg>
  );
}

export default function ChapterPage() {
  const params = useParams();
  const router = useRouter();

  const courseId = params.id as string;
  const chapterId = params.chapterId as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress>({
    chapters: {},
    questions: {},
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});

  const [isChapterCompleted, setIsChapterCompleted] = useState(false);

  useEffect(() => {
    if (!courseId) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        const storedUser = localStorage.getItem("user");
        if (!storedUser) {
          router.push("/login");
          return;
        }

        // Course
        const courseRes = await fetch(`/api/courses/${courseId}`);
        if (!courseRes.ok) throw new Error("Failed to fetch course");
        const courseData = await courseRes.json();
        setCourse(courseData.data || courseData);

        // Modules + chapters + questions
        const contentRes = await fetch(`/api/courses/${courseId}/content`);
        if (!contentRes.ok) throw new Error("Failed to fetch content");
        const contentData = await contentRes.json();
        const fetchedModules: Module[] = contentData.data || [];
        setModules(fetchedModules);

        // Open all modules by default
        const initialOpen: Record<string, boolean> = {};
        fetchedModules.forEach((m) => {
            initialOpen[m._id] = true;
        });
        setOpenModules(initialOpen);

        // Progress
        const progressRes = await fetch(`/api/courses/${courseId}/progress`);

        if (progressRes.ok) {
            const progressData = await progressRes.json();

            const chaptersMap: Record<string, boolean> = {};

            const chapters = progressData.data?.chapters;

            if (Array.isArray(chapters)) {
                for (const item of chapters) {
                    chaptersMap[item.chapter_id] = item.is_completed;
                }
            } else if (chapters && typeof chapters === "object") {
                for (const [key, value] of Object.entries(chapters)) {
                    chaptersMap[key] = Boolean(value);
                }
            }

            setUserProgress({
                chapters: chaptersMap,
                questions: {},
            });
        }

            setError(null);
        } catch (err) {
            setError(
            err instanceof Error ? err.message : "An unexpected error occurred"
            );
        } finally {
            setLoading(false);
        }
        };

        fetchData();
    }, [courseId, router]);

    useEffect(() => {
        if (!chapterId) return;
        setIsChapterCompleted(!!userProgress.chapters[chapterId]);
    }, [chapterId, userProgress.chapters]);

  const toggleChapterComplete = () => {
        setIsChapterCompleted((prev) => !prev);
  };

  const handleNextClick = async () => {
    if (currentItem?.type === "chapter") {
        const alreadySaved = !!userProgress.chapters[chapterId];

        if (isChapterCompleted && !alreadySaved) {
            try {
                const storedUser = localStorage.getItem("user");
                const user = storedUser ? JSON.parse(storedUser) : null;

                await fetch(`/api/progress/chapters/${chapterId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "x-user-id": user?._id || user?.id || "",
                },
                body: JSON.stringify({
                    is_completed: true,
                }),
                });

                // Обновляем локальный progress
                setUserProgress((prev) => ({
                ...prev,
                chapters: {
                    ...prev.chapters,
                    [chapterId]: true,
                },
                }));
            } catch (error) {
                console.error("Failed to save chapter progress:", error);
            }
        }
    }

    if (nextItem) {
        router.push(`/courses/${courseId}/${nextItem.id}`);
    }
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
          questionIds: module.questions.map((q) => q._id),
        });
      }
    });

    return items;
  }, [modules]);

  const currentItem = navItems.find((item) => item.id === chapterId);

  const currentChapter = useMemo(() => {
    for (const module of modules) {
      const chapter = module.chapters.find((c) => c._id === chapterId);
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
  const completedItems =
    Object.values(userProgress.chapters).filter(Boolean).length +
    Object.values(userProgress.questions).filter(Boolean).length;

  const progressPercent =
    totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  const markChapterComplete = async () => {
    // Optional API call for completion
    // await fetch(`/api/chapters/${chapterId}/complete`, { method: "POST" });

    // Local optimistic update
    setUserProgress((prev) => ({
      ...prev,
      chapters: {
        ...prev.chapters,
        [chapterId]: true,
      },
    }));
  };

  if (loading) {
    return (
		<main className="flex-1">
			<section className="bg-white min-h-screen flex items-center justify-center">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
			</section>
		</main>
    );
  }

  if (error || !course) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-red-600">{error || "Course not found"}</p>
          <Link
            href={`/courses/${courseId}`}
            className="mt-4 inline-block text-indigo-600 hover:text-indigo-700"
          >
            Back to course
          </Link>
        </div>
      </main>
    );
  }

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

                <h1 className="mt-4 text-lg font-semibold text-slate-900">
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
                        <span className="text-sm font-semibold text-slate-900">
                          {module.title}
                        </span>
                        <ChevronIcon open={!!openModules[module._id]} />
                      </button>

                      {openModules[module._id] && (
                        <div className="mt-2 space-y-1 pl-2">
                          {/* Chapters */}
                          {module.chapters.map((chapter) => {
                            const isActive = chapter._id === chapterId;
                            const isDone = !!userProgress.chapters[chapter._id];

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
                                <span className="leading-5">{chapter.title}</span>
                            </Link>
                            );
                          })}

                          {/* Quiz */}
                          {module.questions?.length > 0 && (
                            <Link
                              href={`/courses/${courseId}/quiz-${module._id}`}
                              className={`flex items-start gap-3 rounded-lg px-3 py-2 text-sm transition ${
                                chapterId === `quiz-${module._id}`
                                  ? "bg-indigo-50 text-indigo-700"
                                  : "text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              <CheckIcon
                                done={module.questions.every(
                                  (q) => userProgress.questions[q._id]
                                )}
                              />
                              <span className="flex items-center gap-2">
                                <QuizIcon />
                                Quiz: {module.title}
                              </span>
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <section className="min-w-0 flex-1 bg-white">
            <div className="mx-auto max-w-4xl px-6 py-8 lg:px-12">
              {/* Breadcrumb */}
              <div className="mb-6 text-sm text-slate-500">
                {currentItem?.moduleTitle}
              </div>

              {/* Chapter Content */}
              {currentItem?.type === "chapter" && currentChapter ? (
                <>
                  <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                    {currentChapter.title}
                  </h1>

                  {currentChapter.content && (
                    <p className="mt-3 text-lg text-slate-600">
                      {currentChapter.content}
                    </p>
                  )}

                  <article className="prose prose-slate mt-8 max-w-none">
                    <div
                      dangerouslySetInnerHTML={{
                        __html:
                          currentChapter.content ||
                          "<p>No content available.</p>",
                      }}
                    />
                  </article>
                </>
              ) : currentItem?.type === "quiz" ? (
                <>
                  <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                    {currentItem.title}
                  </h1>
                  <p className="mt-4 text-slate-600">
                    Quiz page can be implemented here.
                  </p>
                </>
              ) : (
                <div className="text-slate-500">Content not found.</div>
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
                        onClick={toggleChapterComplete}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                            isChapterCompleted
                            ? "bg-emerald-600 text-white"
                            : "border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        }`}
                        >
                        {isChapterCompleted ? "✓ Completed" : "Complete"}
                        </button>
                    )}

                    {nextItem && (
                    <button
                        type="button"
                        onClick={handleNextClick}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                    >
                        Next →
                    </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}