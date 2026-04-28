"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { Sidebar } from "@/components/common/Sidebar";
import { Course } from "@/types";
import { ProtectedPage } from "@/components/common/ProtectedPage";

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savedCourses, setSavedCourses] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch("/api/courses");
        const data = await response.json();
        if (data.success) {
          setCourses(data.data || []);
        } else {
          setError(data.message || "Failed to load courses");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load courses");
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();

    // Load saved courses from localStorage
    const saved = localStorage.getItem("savedCourses");
    if (saved) {
      try {
        setSavedCourses(new Set(JSON.parse(saved)));
      } catch {
        setSavedCourses(new Set());
      }
    }
  }, []);

  const toggleSaveCourse = (courseId: string | undefined) => {
    if (!courseId) return;

    const newSaved = new Set(savedCourses);
    if (newSaved.has(courseId)) {
      newSaved.delete(courseId);
    } else {
      newSaved.add(courseId);
    }
    setSavedCourses(newSaved);
    localStorage.setItem("savedCourses", JSON.stringify(Array.from(newSaved)));
  };

  return (
    <>
    <ProtectedPage>
    <Header />
      <main className="flex-1">
        <section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 min-h-[calc(100vh-4rem)]">
          <div className="flex min-h-[calc(100vh-4rem)] flex-col md:flex-row">
            <Sidebar />
            
            <div className="min-w-0 flex-1 py-8 sm:py-10">
              <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="mb-10">
                  <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                    Explore Courses
                  </h1>
                  <p className="text-slate-600">
                    Discover and learn from our wide range of educational courses
                  </p>
                </div>

                {error && (
                  <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700">
                    {error}
                  </div>
                )}

                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                  </div>
                ) : courses.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-600 text-lg">No courses available yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course) => (
                      <div
                        key={course._id}
                        className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col w-72 mx-auto h-full"
                      >
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
                            <button
                              onClick={() => toggleSaveCourse(course._id)}
                              className="p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
                            >
                              <svg
                                className={`w-5 h-5 ${
                                  savedCourses.has(course._id || "")
                                    ? "fill-indigo-600 text-indigo-600"
                                    : "text-slate-400"
                                }`}
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                              </svg>
                            </button>
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
                    ))}
                  </div>
                )}
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