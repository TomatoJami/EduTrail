"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { Sidebar } from "@/components/common/Sidebar";

interface Course {
	_id: string;
	title: string;
	description: string;
	goals: string[];
	ageGroup: string;
	course_img: string;
	subject_id: string;
}

interface Question {
	_id: string;
	question: string;
	options: string[];
	correctAnswer: number;
	explanation?: string;
}

interface Chapter {
	_id: string;
	title: string;
	content: string;
	order: number;
}

interface Module {
	_id: string;
	title: string;
	order: number;
	chapters: Chapter[];
	questions: Question[];
}

interface UserProgress {
	chapters: Record<string, boolean>;
	questions: Record<string, boolean>;
}

const pageContainer = "mx-auto max-w-5xl px-4 sm:px-6 lg:px-8";

function BookmarkIcon() {
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

function LessonIcon({ status }: { status: string }) {
	if (status === "done") {
		return <span className="mt-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" />;
	}

	return <span className="mt-0.5 h-3.5 w-3.5 rounded-full border border-slate-400 bg-white" />;
}

function FeatureIcon({ type }: { type: "folder" | "quiz" }) {
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

function StatPill({ icon, label }: { icon: "folder" | "quiz"; label: string }) {
	return (
		<div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm">
			<span className="text-indigo-500">
				<FeatureIcon type={icon} />
			</span>
			<span>{label}</span>
		</div>
	);
}

export default function CourseDetailPage() {
	const params = useParams();
	const router = useRouter();
	const courseId = params.id as string;
	const [course, setCourse] = useState<Course | null>(null);
	const [modules, setModules] = useState<Module[]>([]);
	const [userProgress, setUserProgress] = useState<UserProgress>({ chapters: {}, questions: {} });
	const [isInitialized, setIsInitialized] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!courseId) return;

		const fetchCourseData = async () => {
			try {
				const storedUser = localStorage.getItem("user");
				if (!storedUser) {
					router.push("/login");
					return;
				}

				// Fetch course details
				const courseResponse = await fetch(`/api/courses/${courseId}`);
				if (!courseResponse.ok) {
					throw new Error("Failed to fetch course");
				}
				const courseData = await courseResponse.json();
				setCourse(courseData.data || courseData);

				// Fetch course content (modules, chapters, questions)
				const contentResponse = await fetch(`/api/courses/${courseId}/content`);
				if (!contentResponse.ok) {
					throw new Error("Failed to fetch course content");
				}
				const contentData = await contentResponse.json();
				setModules(contentData.data || []);

				// Fetch user progress
				const progressResponse = await fetch(`/api/courses/${courseId}/progress`);
				if (progressResponse.ok) {
					const progressData = await progressResponse.json();
					setUserProgress(progressData.data || { chapters: {}, questions: {} });
				}

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
		return (
			<main className="flex-1">
				<section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 min-h-screen flex items-center justify-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
				</section>
			</main>
		);
	}

	if (error || !course) {
		return (
			<main className="flex-1 min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 flex items-center justify-center">
				<div className="text-center">
					<p className="text-red-600">{error || "Course not found"}</p>
					<Link href="/courses" className="text-indigo-600 hover:text-indigo-700 mt-4 inline-block">
						Back to courses
					</Link>
				</div>
			</main>
		);
	}

	

	const goalsArray = Array.isArray(course.goals) ? course.goals : [];
	const displayGoals = goalsArray.filter(g => g && g.trim());

	// Calculate statistics
	const totalChapters = modules.reduce((sum, mod) => sum + mod.chapters.length, 0);
	const completedChapters = Object.values(userProgress.chapters).filter(Boolean).length;
	const totalQuestions = modules.reduce((sum, mod) => sum + mod.questions.length, 0);
	const completedQuestions = Object.values(userProgress.questions).filter(Boolean).length;

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
												<a href="/" className="hover:text-white">Home </a> &gt; 
                                                <a href="/courses" className="hover:text-white"> Learning Path </a> &gt; <span className="font-semibold text-white">{course.title}</span>
											</div>
											<div className="flex flex-wrap items-start gap-3">
												<h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{course.title}</h1>
												<button
													type="button"
													aria-label="Bookmark course"
													className="mt-1 rounded-full border border-white/15 bg-white/5 p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
												>
												<BookmarkIcon />
											</button>
										</div>
										<p className="mt-4 max-w-3xl text-sm leading-7 text-white/70 sm:text-[15px]">
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
                                                                                <LessonIcon status={userProgress.chapters[chapter._id] ? "done" : "todo"} />
                                                                                <span>{chapter.title}</span>
                                                                            </div>
                                                                        ))}
                                                                        {module.questions.length > 0 && (
                                                                            <div className="flex items-start gap-3 text-sm text-slate-700">
                                                                                <LessonIcon status={userProgress.questions[module.questions[0]?._id] ? "done" : "todo"} />
                                                                                <span>Quiz: {module.title}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </article>
                                                            ))
                                                        ) : (
                                                            <p className="text-sm text-slate-500">Data not found</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </section>
                                    </div>

                                    <div className="space-y-4">
                                        <Link
                                            href="/login"
                                            className="block rounded-xl bg-indigo-500 px-5 py-3 text-center text-sm font-semibold text-white shadow-[0_12px_24px_rgba(79,70,229,0.28)] transition hover:bg-indigo-600"
                                        >
                                            Start Learning
                                        </Link>

                                        <div className="flex flex-wrap gap-2">
                                            <StatPill icon="folder" label={`${totalChapters} Lessons`} />
                                            <StatPill icon="quiz" label={`${totalQuestions} Quizzes`} />
                                        </div>

                                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                            <p className="text-sm font-semibold text-slate-500">Course status</p>
                                            <div className="mt-3 space-y-3 text-sm text-slate-700">
                                                <div className="flex items-center justify-between gap-3">
                                                    <span>Completed</span>
                                                    <span className="font-semibold text-slate-900">{completedChapters + completedQuestions} of {totalChapters + totalQuestions}</span>
                                                </div>
                                                <div className="h-2 rounded-full bg-slate-100">
                                                    <div 
                                                        className="h-2 rounded-full bg-emerald-500 transition-all"
                                                        style={{ 
                                                            width: totalChapters + totalQuestions > 0 
                                                                ? `${((completedChapters + completedQuestions) / (totalChapters + totalQuestions)) * 100}%` 
                                                                : '0%' 
                                                        }} 
                                                    />
                                                </div>
                                                <p className="text-xs leading-5 text-slate-500">
                                                    {completedChapters + completedQuestions === 0 
                                                        ? "Start the course to track your progress." 
                                                        : `You've completed ${Math.round(((completedChapters + completedQuestions) / (totalChapters + totalQuestions)) * 100)}% of the course!`}
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
