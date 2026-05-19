"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { Sidebar } from "@/components/common/Sidebar";
import { Course, Module, UserProgress } from "@/types";

const pageContainer = "mx-auto max-w-5xl px-4 sm:px-6 lg:px-8";

/** Renders the bookmark icon interface. */
function BookmarkIcon() {
	// Returns the JSX layout for this render state.
	return (
		<svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
			<path
				d="M7 4.75A1.75 1.75 0 0 1 8.75 3h6.5A1.75 1.75 0 0 1 17 4.75v15.19a.75.75 0 0 1-1.18.61L12 17.76l-3.82 2.79A.75.75 0 0 1 7 19.94V4.75Z"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.6"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

/** Renders the lesson icon interface. */
function LessonIcon({ status }: { status: string }) {
	if (status === "done") {
		// Returns the JSX layout for this render state.
		return <span className="mt-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500" />;
	}

	// Returns the JSX layout for this render state.
	return <span className="mt-0.5 h-3.5 w-3.5 rounded-full border border-slate-400 bg-white" />;
}

/** Renders the feature icon interface. */
function FeatureIcon({ type }: { type: "folder" | "quiz" }) {
	// Returns the JSX layout for this render state.
	return type === "folder" ? (
		<svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
			<path
				d="M3.75 7.5A2.25 2.25 0 0 1 6 5.25h3.5c.6 0 1.17.24 1.59.66l1.06 1.09c.42.42.99.66 1.59.66H18A2.25 2.25 0 0 1 20.25 9.9v6.35A2.25 2.25 0 0 1 18 18.5H6a2.25 2.25 0 0 1-2.25-2.25V7.5Z"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinejoin="round"
			/>
		</svg>
	) : (
		<svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
			<path
				d="M7 4.5h10A2.5 2.5 0 0 1 19.5 7v10A2.5 2.5 0 0 1 17 19.5H7A2.5 2.5 0 0 1 4.5 17V7A2.5 2.5 0 0 1 7 4.5Z"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.5"
			/>
			<path d="M9 10.2h6M9 13.1h4.2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
		</svg>
	);
}

/** Renders the stat pill interface. */
function StatPill({ icon, label }: { icon: "folder" | "quiz"; label: string }) {
	// Returns the JSX layout for this render state.
	return (
		<div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm">
			<span className="text-indigo-500">
				<FeatureIcon type={icon} />
			</span>
			<span>{label}</span>
		</div>
	);
}

/** Renders the course detail page interface. */
export default function CourseDetailPage() {
	const params = useParams();
	const router = useRouter();
	const courseId = params.id as string;
	const [course, setCourse] = useState<Course | null>(null);
	const [modules, setModules] = useState<Module[]>([]);
		const [userProgress, setUserProgress] = useState<UserProgress>({
		// Renders the chapters UI.
		chapters: {},
		// Renders the questions UI.
		questions: {},
	});
	const [isInitialized, setIsInitialized] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isBookmarked, setIsBookmarked] = useState(false);
	const [courseProgress, setCourseProgress] = useState<any>(null);

	// Synchronizes browser state or side effects after render.
	useEffect(() => {
		if (!courseId) return;

		/** Renders the fetch course data interface. */
		const fetchCourseData = async () => {
			try {
				const storedUser = localStorage.getItem("user");
				if (!storedUser) {
					router.push("/login");
					return;
				}

				// Fetch course details
				const user = JSON.parse(storedUser);
				const userId = user._id || user.id;

				// Load the course shell from the Next.js API proxy.
				const courseResponse = await fetch(`/api/courses/${courseId}`);
				const courseData = await courseResponse.json();

				if (!courseResponse.ok || courseData?.success === false) {
					throw new Error(courseData?.message || "Course not found");
				}

				const fetchedCourse = courseData?.data || courseData;
				if (!fetchedCourse || typeof fetchedCourse !== "object" || !(fetchedCourse._id || fetchedCourse.id)) {
					throw new Error("Course not found");
				}

				setCourse(fetchedCourse as Course);

				// Load modules, chapters, and questions as one assembled content payload.
				const contentResponse = await fetch(`/api/courses/${courseId}/content`);
				const contentData = await contentResponse.json();
				setModules(contentData.data || []);

				// PROGRESS (✔ FIXED: x-user-id header added)
				// Load per-chapter and per-question completion for this learner.
				const progressResponse = await fetch(`/api/courses/${courseId}/progress`, {
					headers: {
						"x-user-id": userId,
					},
				});

				// Load course-level status and bookmark metadata.
				const courseProgressResponse = await fetch(`/api/progress/courses/${courseId}`, {
					headers: {
						'x-user-id': JSON.parse(storedUser)._id || JSON.parse(storedUser).id,
					},
				});

				if (progressResponse.ok) {
					const courseProgressData = await courseProgressResponse.json();

					setCourseProgress(courseProgressData.data || null);
					setIsBookmarked(courseProgressData.data?.is_bookmarked || false);
					const progressData = await progressResponse.json();
					const progress = progressData.data || {};

					// ✔ NORMALIZATION FIX (same as working file)
					const chaptersMap: Record<string, boolean> = {};
					const questionsMap: Record<string, boolean> = {};

					if (progress.chapters && typeof progress.chapters === "object") {
						for (const [id, value] of Object.entries(progress.chapters)) {
							if (typeof value === "boolean") {
								chaptersMap[id] = value;
							} else if (
								value &&
								typeof value === "object" &&
								"is_completed" in value
							) {
								chaptersMap[id] = Boolean((value as any).is_completed);
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
								questionsMap[id] = Boolean((value as any).is_completed);
							}
						}
					}

					setUserProgress({
						chapters: chaptersMap,
						questions: questionsMap,
					});
				}
				// if (courseProgressResponse.ok) {
				// 	const courseProgressData = await courseProgressResponse.json();
				// 	setCourseProgress(courseProgressData.data || null);
				// 	setIsBookmarked(courseProgressData.data?.is_bookmarked || false);
				// }

				setError(null);
				setIsInitialized(true);
			} catch (err) {
				setError(err instanceof Error ? err.message : "An error occurred");
				setCourse(null);
				setModules([]);
				setIsInitialized(true);
			}
		};

		fetchCourseData();
	}, [courseId, router]);

	if (!isInitialized) {
		// Returns the JSX layout for this render state.
		return (
			<main className="flex-1">
				<section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 min-h-screen flex items-center justify-center">
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
						<h2 className="text-3xl font-bold text-slate-800 mb-4">Course Not Found</h2>
						<p className="text-lg text-slate-600 mb-8">
							{error || "Sorry, the course you're looking for doesn't exist or has been moved."}
						</p>
					</div>

					<div className="flex flex-col sm:flex-row gap-4 justify-center">
						<Link
							href="/courses"
							className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
						>
							Browse All Courses
						</Link>
						<Link
							href="/"
							className="px-6 py-3 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 transition-colors"
						>
							Go Home
						</Link>
					</div>
				</div>
			</main>
		);
	}

	/** Renders the is chapter done interface. */
	const isChapterDone = (id: string) =>
		Boolean(userProgress.chapters?.[String(id)]);

		/** Renders the is quiz done interface. */
		const isQuizDone = (module: Module) =>
		module.questions.length > 0 &&
		module.questions.filter(q => q).every(q =>
			userProgress.questions?.[String(q._id)]
		);

	// Find first chapter
	const getFirstChapter = () => {
		if (modules.length > 0 && modules[0].chapters.length > 0) {
			return modules[0].chapters[0]._id;
		}
		return null;
	};

	/** Renders the get first uncompleted step interface. */
	const getFirstUncompletedStep = () => {
		for (const courseModule of modules) {
			// 1. chapters
			for (const chapter of courseModule.chapters) {
				if (!userProgress.chapters[chapter._id]) {
					return { type: "chapter", id: chapter._id };
				}
			}

			// 2. quiz
			if (courseModule.questions.length > 0) {
				const allDone = courseModule.questions.every(
					q => userProgress.questions?.[q._id]
				);

				if (!allDone) {
					return { type: "quiz", moduleId: courseModule._id };
				}
			}
		}

		// fallback
		const firstChapter = modules?.[0]?.chapters?.[0]?._id;
		return firstChapter ? { type: "chapter", id: firstChapter } : null;
	};

	/** Renders the handle start course interface. */
	const handleStartCourse = async () => {
		try {
			setIsLoading(true);
			const storedUser = localStorage.getItem('user');

			if (!storedUser) {
				router.push('/login');
				return;
			}

			const user = JSON.parse(storedUser);
			const userId = user._id || user.id;

			// Ask the backend to create or update this learner's course progress.
			const response = await fetch(`/api/progress/courses/${courseId}/start`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-user-id': userId,
				},
			});

			if (!response.ok) {
				const contentType = response.headers.get('content-type');
				let errorMessage = 'Failed to start course';

				if (contentType?.includes('application/json')) {
					try {
						const errorData = await response.json();
						errorMessage = errorData.message || errorMessage;
					} catch {
						errorMessage = `Server error: ${response.status}`;
					}
				} else {
					errorMessage = `Server error: ${response.status} ${response.statusText}`;
				}

				throw new Error(errorMessage);
			}

			const data = await response.json();

			// Update course progress state and redirect to first chapter
			setCourseProgress(data.data);
			const firstChapterId = getFirstChapter();
			if (firstChapterId) {
				router.push(`/courses/${courseId}/${firstChapterId}`);
			}
		} catch (err) {
			alert(err instanceof Error ? err.message : 'Failed to start course');
		} finally {
			setIsLoading(false);
		}
	};

	/** Renders the handle bookmark interface. */
	const handleBookmark = async () => {
		try {
			const storedUser = localStorage.getItem('user');

			if (!storedUser) {
				router.push('/login');
				return;
			}

			const user = JSON.parse(storedUser);
			const userId = user._id || user.id;

			// Toggle the bookmark record on the backend, then mirror it in local state.
			const response = await fetch(`/api/progress/courses/${courseId}/bookmark`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-user-id': userId,
				},
			});

			if (!response.ok) {
				const contentType = response.headers.get('content-type');
				let errorMessage = 'Failed to bookmark course';

				if (contentType?.includes('application/json')) {
					try {
						const errorData = await response.json();
						errorMessage = errorData.message || errorMessage;
					} catch {
						errorMessage = `Server error: ${response.status}`;
					}
				} else {
					errorMessage = `Server error: ${response.status} ${response.statusText}`;
				}

				throw new Error(errorMessage);
			}

			const data = await response.json();
			setCourseProgress(data.data);
			setIsBookmarked(data.data?.is_bookmarked || false);
		} catch (err) {
			alert(err instanceof Error ? err.message : 'Failed to bookmark course');
		}
	};

	// Extract learning goals from course
	const displayGoals = course?.goals || [];

	// Calculate statistics
	const totalChapters = modules.reduce((sum, mod) => sum + mod.chapters.length, 0);
	const completedChapters = Object.values(userProgress.chapters).filter(Boolean).length;
	const totalQuizzes = modules.filter(mod => mod.questions.length > 0).length;
	const completedQuizzes = modules.filter(mod => {
		// Check if all questions in this module are completed
		return mod.questions.length > 0 && 
		       mod.questions.filter(q => q).every(q => userProgress.questions[q._id] === true);
	}).length;
	const isFinishCompleted = courseProgress?.status === 'completed';

	// Total items: chapters + quizzes + finish
	const totalItems = totalChapters + totalQuizzes + 1;
	const completedItems = completedChapters + completedQuizzes + (isFinishCompleted ? 1 : 0);

	// Returns the JSX layout for this render state.
	return (
		<>	
			<main className="flex-1">
				<Header />
				<section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 min-h-screen">
					<div className="flex min-h-screen flex-col md:flex-row">
						<Sidebar />
						<div className="min-w-0 flex-1" >
							{/* Hero Section */}
                            <div className="overflow-hidden bg-white/75 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur mb-8">
								<div className="relative overflow-hidden bg-[#111827] px-5 py-5 text-white sm:px-8 sm:py-7 lg:px-10 lg:py-8">
									<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.32),_transparent_34%),radial-gradient(circle_at_bottom_left,_rgba(56,189,248,0.18),_transparent_30%)] pointer-events-none" />
										<div className={pageContainer}>
											<div className="mb-3 text-sm text-white/70">
												<Link href="/" className="hover:text-white">Home </Link> &gt; 
                                                <Link href="/courses" className="hover:text-white"> Learning Path </Link> &gt; <span className="font-semibold text-white">{course.title}</span>
											</div>
											<div className="flex flex-wrap items-start gap-3">
												<h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{course.title}</h1>
												<button
													type="button"
													aria-label="Bookmark course"
													onClick={handleBookmark}
													className={`mt-1 rounded-full border transition p-2 ${
														isBookmarked
															? 'border-indigo-600 bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30'
															: 'border-white/15 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
													}`}
												>
													<BookmarkIcon />
												</button>
										</div>
										<p className="mt-4 max-w-3xl text-sm leading-7 text-white/70 sm:text-[15px] break-words">
											{course.description}
										</p>
									</div>
								</div>
							</div>

							{/* Content centered */}
                            <div className={pageContainer + " py-6"}>
                                <div className="mx-auto max-w-5xl grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
                                    <div className="space-y-6">
                                        <section>
                                            <div className="mb-4 flex items-end justify-between gap-4">
                                                <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Learning Goals</h2>
                                                <div className="hidden h-px flex-1 bg-slate-200 sm:block" aria-hidden="true" />
                                            </div>
                                            <div className="max-w-2xl">
                                                {displayGoals.length > 0 ? (
                                                    <div className="space-y-3">
                                                        <div className="space-y-3 text-sm leading-6 text-slate-700">
                                                            {displayGoals.map((goal, idx) => (
                                                                <p key={idx} className="flex gap-3">
                                                                <span className="mt-1 text-indigo-500">✓</span>
                                                                <span>{goal}</span>
                                                                </p>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-slate-500">Data not found</p>
                                                )}
                                            </div>
                                        </section>

                                        <section>
                                            <div className="mb-3 flex items-end justify-between gap-4">
                                                <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Path Content</h2>
                                                <div className="hidden h-px flex-1 bg-slate-200 sm:block" aria-hidden="true" />
                                            </div>
                                            <div className="max-w-2xl">
                                                <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm">
                                                    <div className="h-1.5 bg-indigo-500" />
                                                    <div className="space-y-6 px-4 py-4 sm:px-5 sm:py-5">
                                                        {modules.length > 0 ? (
                                                            modules.map((module, moduleIdx) => (
                                                                <article key={module._id} className="space-y-3">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-600 ring-1 ring-indigo-200">
                                                                            {moduleIdx + 1}
                                                                        </div>
                                                                        <h3 className="text-[15px] font-semibold text-slate-900">{module.title}</h3>
                                                                    </div>

                                                                    <div className="space-y-2.5 pl-0.5">
                                                                        {module.chapters.map((chapter) => (
                                                                            <div key={chapter._id} className="flex items-start gap-3 text-sm text-slate-700">
                                                                                <LessonIcon status={isChapterDone(chapter._id) ? "done" : "todo"} />
                                                                                <span>{chapter.title}</span>
                                                                            </div>
                                                                        ))}
                                                                        {module.questions.length > 0 && (
                                                                            <div className="flex items-start gap-3 text-sm text-slate-700">
																				<LessonIcon status={isQuizDone(module) ? "done" : "todo"} />
                                                                                <span>Quiz: {module.title}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </article>
                                                            ))
                                                        ) : (
                                                            <p className="text-sm text-slate-500">Data not found</p>
                                                        )}
                                                        {/* Finish Item */}
                                                        <article className="space-y-3">
                                                            <div className="flex items-center gap-3">
                                                                <LessonIcon status={isFinishCompleted ? "done" : "todo"} />
                                                                <h3 className="text-[15px] font-semibold text-slate-900">Finish</h3>
                                                            </div>
                                                        </article>
                                                    </div>
                                                </div>
                                            </div>
                                        </section>
                                    </div>

                                    <div className="space-y-4">
										{courseProgress?.status === 'completed' ? (
											<button
												onClick={() => {
													const firstChapterId = getFirstChapter();
													if (firstChapterId) {
														router.push(`/courses/${courseId}/${firstChapterId}`);
													}
												}}
												className="block rounded-xl bg-indigo-500 px-5 py-3 text-center text-sm font-semibold text-white shadow-[0_12px_24px_rgba(79,70,229,0.28)] transition hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
											>
												Visit Again
											</button>
										) : courseProgress?.status === 'in_progress' ? (
											<button
												onClick={() => {
													const next = getFirstUncompletedStep();

													if (!next) return;

													if (next.type === "chapter") {
														router.push(`/courses/${courseId}/${next.id}`);
													}

													if (next.type === "quiz") {
														router.push(`/courses/${courseId}/quiz-${next.moduleId}`);
													}
												}}
												className="block rounded-xl bg-indigo-500 px-5 py-3 text-center text-sm font-semibold text-white shadow-[0_12px_24px_rgba(79,70,229,0.28)] transition hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
											>
												Continue Learning
											</button>
										) : (
											<button
												onClick={handleStartCourse}
												disabled={isLoading}
												className="block rounded-xl bg-indigo-500 px-5 py-3 text-center text-sm font-semibold text-white shadow-[0_12px_24px_rgba(79,70,229,0.28)] transition hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
											>
												{isLoading ? 'Starting...' : 'Start Learning'}
											</button>
										)}

                                        <div className="flex flex-wrap gap-2">
                                            <StatPill icon="folder" label={`${totalChapters} Lessons`} />
                                            <StatPill icon="quiz" label={`${totalQuizzes} Quizzes`} />
                                        </div>

                                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                            <p className="text-sm font-semibold text-slate-500">Progress</p>
                                            <div className="mt-3 space-y-3 text-sm text-slate-700">
                                                <div className="flex items-center justify-between gap-3">
                                                    <span>Completed</span>
                                                    <span className="font-semibold text-slate-900">{completedItems} of {totalItems}</span>
                                                </div>
                                                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                                                    <div 
                                                        className="h-2 bg-emerald-500 transition-all"
                                                        style={{ 
                                                            width: totalItems > 0 
                                                                ? `${(completedItems / totalItems) * 100}%` 
                                                                : '0%' 
                                                        }} 
                                                    />
                                                </div>
                                                <p className="text-xs leading-5 text-slate-500">
                                                    {completedItems === 0 
                                                        ? "Start the course to track your progress." 
                                                        : `You've completed ${Math.round((completedItems / totalItems) * 100)}% of the course!`}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
						</div>
					</div>
				</section>
				<Footer />
			</main>
		</>
	);
}
