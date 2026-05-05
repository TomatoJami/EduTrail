"use client";

// app/(pages)/page.tsx
import Link from "next/link";
import { useEffect, useState } from "react";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { Sidebar } from "@/components/common/Sidebar";
import { Course } from "@/types";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeTab, setActiveTab] = useState("In Progress");
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const syncAuthState = () => {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) {
        setIsLoggedIn(false);
        setIsAdmin(false);
        return;
      }

      setIsLoggedIn(true);

      try {
        const parsedUser = JSON.parse(storedUser) as { role?: 'student' | 'admin' };
        setIsAdmin(parsedUser.role === 'admin');
      } catch {
        setIsAdmin(false);
      }
    };

    const fetchCourses = async () => {
      try {
        const res = await fetch("/api/courses");
        if (!res.ok) throw new Error("Failed to fetch courses");
  
        const data = await res.json();
        setCourses(data.data || []);
      } catch (err) {
        console.error(err);
        setCourses([]);
      }
    };
  
    syncAuthState();
    fetchCourses();
    setIsInitialized(true);

    window.addEventListener("storage", syncAuthState);
    window.addEventListener("auth-state-changed", syncAuthState);

    return () => {
      window.removeEventListener("storage", syncAuthState);
      window.removeEventListener("auth-state-changed", syncAuthState);
    };
  }, []);

  const CourseCard = ({ course }: { course: Course }) => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
      {/* Image Container */}
      <div className="relative h-56 bg-white p-3 flex items-center justify-center">
        {course.course_img ? (
          <img
            src={course.course_img}
            alt={course.title}
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              className="w-20 h-20 text-slate-300"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Course
          </p>
        </div>
        <h3 className="text-base font-bold text-slate-900 mb-3 overflow-hidden break-words line-clamp-2">
          <span className="truncate overflow-hidden whitespace-nowrap block">{course.title}</span>
        </h3>
        <div className="flex items-end justify-between gap-2 mt-auto">
          <span className="text-xs font-medium text-slate-600 whitespace-nowrap">
            Ages {course.ageGroup}
          </span>
          <Link
            href={`/courses/${course._id}`}
            className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-semibold text-sm transition-colors"
          >
            Get Started
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <main className="flex-1">
        {!isInitialized ? (
          <section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 pt-32 pb-40 min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </section>
        ) : isLoggedIn ? (
          <>
            <Header />
            <section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 min-h-[calc(100vh-4rem)]">
            <div className="flex min-h-[calc(100vh-4rem)] flex-col md:flex-row">
              <Sidebar />

              <div className="min-w-0 flex-1 py-8 sm:py-10">
                <div className="mx-auto justify-center max-w-6xl px-4 sm:px-6 lg:px-8">

                  {/* Tabs */}
                  <div className="flex justify-center gap-50 mb-10 text-sm font-medium text-gray-500">
                    {["In Progress", "Saved", "Completed"].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`text-lg pb-2 transition ${
                          activeTab === tab
                            ? "text-indigo-600 border-b-2 border-indigo-600"
                            : "hover:text-gray-900"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  {/* Title */}
                  <h2 className="text-lg text-center font-semibold text-gray-700 mb-6">
                    {activeTab}
                  </h2>

                  {/* Courses grid */}
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course, i) => (
                      <CourseCard key={i} course={course} />
                    ))}
                  </div>

                </div>
              </div>
            </div>
            </section>
          </>
        ) : (
          <>
            <Header />
            <section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 pt-32 pb-40 min-h-screen flex items-center">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="text-center">
                  <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                    Master Your Skills with{" "}
                    <span className="text-indigo-600">EduTrail</span>
                  </h1>

                  <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10">
                    Learn the courses you need without any hassle. Track your
                    progress, build your skills, and achieve your learning goals.
                  </p>

                  <Link
                    href="/signup"
                    className="inline-block px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition text-lg"
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            </section>

            <section id="why" className="py-24 bg-white">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-4xl font-bold text-center mb-16 text-gray-900">
                  Why Choose EduTrail?
                </h2>

                <div className="grid md:grid-cols-3 gap-8">
                  <div className="p-8 bg-purple-50 rounded-xl hover:shadow-lg transition">
                    <div className="w-12 h-12 bg-purple-200 rounded-lg flex items-center justify-center mb-6 text-lg">
                      📊
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      Track Progress
                    </h3>
                    <p className="text-gray-600">
                      Monitor your learning journey with detailed progress tracking
                      and insights.
                    </p>
                  </div>

                  <div className="p-8 bg-blue-50 rounded-xl hover:shadow-lg transition">
                    <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center mb-6 text-lg">
                      📚
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      Skill Paths
                    </h3>
                    <p className="text-gray-600">
                      Follow structured learning paths designed by experts in the
                      field.
                    </p>
                  </div>

                  <div className="p-8 bg-pink-50 rounded-xl hover:shadow-lg transition">
                    <div className="w-12 h-12 bg-pink-200 rounded-lg flex items-center justify-center mb-6 text-lg">
                      ⚡
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      Fast Learning
                    </h3>
                    <p className="text-gray-600">
                      Accelerate your learning with our optimized course structure.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      <Footer />
    </>
  );
}