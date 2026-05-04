import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { Sidebar } from "@/components/common/Sidebar";
import { ProtectedPage } from "@/components/common/ProtectedPage";

const learningGoals = [
	"Understand the relationship between exponents and logarithms and convert expressions between them.",
	"Apply logarithms to analyze real-world processes such as growth, decay, and working with very large numbers.",
	"Solve logarithmic and exponential equations using the main properties of logarithms.",
];

const sections = [
	{
		number: "1",
		title: "Introduction to Logarithms",
		lessons: [
			{ label: "Definition of logarithms", status: "done" },
			{ label: "Relation to exponents", status: "todo" },
			{ label: "Basic form: logb(a)", status: "todo" },
			{ label: "Quiz: Introduction to Logarithms", status: "todo" },
		],
	},
	{
		number: "2",
		title: "Properties of Logarithms",
		lessons: [
			{ label: "Product and quotient rules", status: "todo" },
			{ label: "Power rule", status: "todo" },
			{ label: "Simplification", status: "todo" },
			{ label: "Quiz: Properties of Logarithms", status: "todo" },
		],
	},
	{
		number: "3",
		title: "Solving Equations",
		lessons: [
			{ label: "Logarithmic equations", status: "todo" },
			{ label: "Exponential equations", status: "todo" },
			{ label: "Domain restrictions", status: "todo" },
			{ label: "Quiz: Solving Equations", status: "todo" },
		],
	},
	{
		number: "4",
		title: "Properties of Logarithms",
		lessons: [
			{ label: "Graphs of logarithmic functions", status: "todo" },
			{ label: "Growth and decay", status: "todo" },
			{ label: "Real-life applications", status: "todo" },
			{ label: "Quiz: Properties of Logarithms", status: "todo" },
		],
	},
];

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

export default function CoursePage() {
	return (
		<>
        <ProtectedPage>
		    <Header />    
			<main className="flex-1">
					<section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 min-h-screen">
						<div className="flex min-h-screen flex-col md:flex-row">
                            <Sidebar />	
                            <div className="min-w-0 flex-1" >
								{/* Hero Section */}
								<div className="overflow-hidden bg-white/75 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur mb-8">
									<div className="relative overflow-hidden bg-[#111827] px-5 py-5 text-white sm:px-8 sm:py-7 lg:px-10 lg:py-8">
										<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.32),_transparent_34%),radial-gradient(circle_at_bottom_left,_rgba(56,189,248,0.18),_transparent_30%)]" />
										<div className="relative max-w-4xl mx-auto">
											<div className="mb-3 text-sm text-white/70">
												Home &gt; Learning Path &gt; <span className="font-semibold text-white">Logarithms</span>
											</div>
											<div className="flex flex-wrap items-start gap-3">
												<h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Logarithms</h1>
												<button
													type="button"
													aria-label="Bookmark course"
													className="mt-1 rounded-full border border-white/15 bg-white/5 p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
												>
													<BookmarkIcon />
												</button>
											</div>
											<p className="mt-4 max-w-3xl text-sm leading-7 text-white/70 sm:text-[15px]">
												Logarithms are a mathematical concept that help express how many times one number must be multiplied to obtain another. They are the inverse of exponents and are widely used in algebra, science, and technology. Understanding logarithms allows students to solve exponential equations, analyze growth and decay, and work with large or small numbers more easily. This topic builds strong problem solving skills and supports further study in mathematics and beyond.
											</p>
										</div>
									</div>
								</div>
                                <div className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
								{/* Content centered */}
								<div className="mx-auto max-w-5xl grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
								<div className="space-y-6">
									<section>
										<div className="mb-4 flex items-end justify-between gap-4">
											<h2 className="text-2xl font-semibold tracking-tight text-slate-900">Learning Goals</h2>
											<div className="hidden h-px flex-1 bg-slate-200 sm:block" aria-hidden="true" />
										</div>
                                        <div className="max-w-2xl">
                                            <div className="grid gap-4 lg:grid-cols-2">
                                                <div className="space-y-3 text-sm leading-6 text-slate-700">
                                                    {learningGoals.slice(0, 2).map((goal) => (
                                                        <p key={goal} className="flex gap-3">
                                                            <span className="mt-1 text-indigo-500">✓</span>
                                                            <span>{goal}</span>
                                                        </p>
                                                    ))}
                                                </div>
                                                <div className="space-y-3 text-sm leading-6 text-slate-700">
                                                    <p className="flex gap-3">
                                                        <span className="mt-1 text-indigo-500">✓</span>
                                                        <span>{learningGoals[2]}</span>
                                                    </p>
                                                </div>
                                            </div>
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
                                                    {sections.map((section) => (
                                                        <article key={section.number} className="space-y-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-600 ring-1 ring-indigo-200">
                                                                    {section.number}
                                                                </div>
                                                                <h3 className="text-[15px] font-semibold text-slate-900">{section.title}</h3>
                                                            </div>

                                                            <div className="space-y-2.5 pl-0.5">
                                                                {section.lessons.map((lesson) => (
                                                                    <div key={lesson.label} className="flex items-start gap-3 text-sm text-slate-700">
                                                                        <LessonIcon status={lesson.status} />
                                                                        <span className={lesson.status === "done" ? "font-medium text-slate-900" : "text-slate-700"}>
                                                                            {lesson.label}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </article>
                                                    ))}
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
										<StatPill icon="folder" label="12 Lessons" />
										<StatPill icon="quiz" label="4 Quizzes" />
									</div>

									<div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
										<p className="text-sm font-semibold text-slate-500">Course status</p>
										<div className="mt-3 space-y-3 text-sm text-slate-700">
											<div className="flex items-center justify-between gap-3">
												<span>Completed</span>
												<span className="font-semibold text-slate-900">1 of 12</span>
											</div>
											<div className="h-2 rounded-full bg-slate-100">
												<div className="h-2 w-[8%] rounded-full bg-emerald-500" />
											</div>
											<p className="text-xs leading-5 text-slate-500">
												Continue from the current lesson to keep your path progress in sync.
											</p>
										</div>
									</div>
								</div>
								</div>
							</div>
						</div>
                        </div>
					</section>
			</main>

			<Footer />
        </ProtectedPage>
		</>
	);
}
