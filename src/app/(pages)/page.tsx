"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { Sidebar } from "@/components/common/Sidebar";
import { CourseCard } from "@/components/CourseCard";
import { Course, CourseProgress } from "@/types";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseProgressMap, setCourseProgressMap] = useState<
    Record<string, CourseProgress>
  >({});
  const [activeTab, setActiveTab] = useState("In Progress");
  const [isInitialized, setIsInitialized] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [isProgressLoaded, setIsProgressLoaded] = useState(false);

  useEffect(() => {
    const syncAuthState = () => {
      const storedUser = localStorage.getItem("user");

      if (!storedUser) {
        setIsLoggedIn(false);
        setIsAdmin(false);
        setUserId(null);
        return;
      }

      setIsLoggedIn(true);

      try {
        const parsedUser = JSON.parse(storedUser) as {
          role?: "student" | "admin";
          _id?: string;
          id?: string;
        };

        setIsAdmin(parsedUser.role === "admin");
        setUserId(parsedUser._id || parsedUser.id || null);
      } catch {
        setIsAdmin(false);
        setUserId(null);
      }
    };

    const fetchCourses = async () => {
      try {
        setIsLoadingCourses(true);

        const res = await fetch("/api/courses");

        if (!res.ok) {
          throw new Error("Failed to fetch courses");
        }

        const data = await res.json();
        setCourses(data.data || []);
      } catch (err) {
        setCourses([]);
      } finally {
        setIsLoadingCourses(false);
      }
    };

    const initialize = async () => {
      syncAuthState();
      await fetchCourses();
      setIsInitialized(true);
    };

    initialize();

    window.addEventListener("storage", syncAuthState);
    window.addEventListener("auth-state-changed", syncAuthState);

    return () => {
      window.removeEventListener("storage", syncAuthState);
      window.removeEventListener("auth-state-changed", syncAuthState);
    };
  }, []);

  useEffect(() => {
    const fetchAllCourseProgress = async () => {
      if (!userId) {
        setCourseProgressMap({});
        setIsProgressLoaded(true);
        return;
      }

      if (courses.length === 0) {
        setIsProgressLoaded(true);
        return;
      }

      try {
        setIsProgressLoaded(false);

        const progressMap: Record<string, CourseProgress> = {};

        await Promise.all(
          courses.map(async (course) => {
            if (!course._id) return;

            try {
              const response = await fetch(
                `/api/progress/courses/${course._id}`,
                {
                  headers: {
                    "x-user-id": userId,
                  },
                }
              );

              if (response.ok) {
                const data = await response.json();

                if (data.data) {
                  progressMap[course._id] = data.data;
                }
              }
            } catch (error) {
            }
          })
        );

        setCourseProgressMap(progressMap);
      } finally {
        setIsProgressLoaded(true);
      }
    };

    fetchAllCourseProgress();
  }, [userId, courses]);

  const getFilteredCourses = () => {
    if (activeTab === "In Progress") {
      return courses.filter(
        (course) =>
          course._id &&
          courseProgressMap[course._id]?.status === "in_progress"
      );
    }

    if (activeTab === "Saved") {
      return courses.filter(
        (course) =>
          course._id &&
          courseProgressMap[course._id]?.is_bookmarked === true
      );
    }

    if (activeTab === "Completed") {
      return courses.filter(
        (course) =>
          course._id &&
          courseProgressMap[course._id]?.status === "completed"
      );
    }

    return courses;
  };

  const filteredCourses = getFilteredCourses();

  const handleBookmarkChange = (
    courseId: string,
    isBookmarked: boolean
  ) => {
    setCourseProgressMap((prev) => ({
      ...prev,
      [courseId]: {
        ...prev[courseId],
        is_bookmarked: isBookmarked,
      },
    }));
  };

  return (
    <>
      <main className="flex-1">
        {!isInitialized || isLoadingCourses ? (
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
                    <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 sm:gap-x-12 lg:gap-50 mb-10 text-sm font-medium text-gray-500">
                      {["In Progress", "Saved", "Completed"].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={`whitespace-nowrap px-1 text-base sm:text-lg pb-2 transition ${
                            activeTab === tab
                              ? "text-indigo-600 border-b-2 border-indigo-600"
                              : "hover:text-gray-900"
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>

                    <h2 className="text-lg text-center font-semibold text-gray-700 mb-6">
                      {activeTab}
                    </h2>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {!isProgressLoaded ? (
                        <div className="col-span-full flex justify-center py-12">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                      ) : filteredCourses.length > 0 ? (
                        filteredCourses.map((course) => (
                          <CourseCard
                            key={course._id}
                            course={course}
                            userId={userId || undefined}
                            courseProgress={
                              course._id
                                ? courseProgressMap[course._id]
                                : null
                            }
                            onBookmarkChange={handleBookmarkChange}
                          />
                        ))
                      ) : (
                      <div className="col-span-full text-center py-12">
                        <p className="text-slate-500 text-lg mb-6">
                          No courses found in this category
                        </p>

                        <Link
                          href="/courses"
                          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
                                    bg-gradient-to-r from-indigo-600 to-blue-600
                                    text-white font-semibold shadow-lg shadow-indigo-200
                                    hover:from-indigo-700 hover:to-blue-700
                                    hover:shadow-xl hover:shadow-indigo-300
                                    hover:-translate-y-0.5
                                    transition-all duration-300"
                        >
                          Explore Courses
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 7l5 5m0 0l-5 5m5-5H6"
                            />
                          </svg>
                        </Link>
                      </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        ) : (
          <>
            <Header />

            <section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 min-h-[calc(100vh-4rem)] flex items-center">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="text-center">
                  <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                    Master Your Skills with{" "}
                    <span className="text-indigo-600">EduTrail</span>
                  </h1>

                  <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10">
                    Learn the courses you need without any hassle.
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

            <section className="bg-white py-16 sm:py-20">
              <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <h2 className="text-center text-3xl font-bold text-gray-950">
                  Why Choose EduTrail?
                </h2>

                <div className="mt-12 grid gap-6 md:grid-cols-3">
                  {[
                    {
                      title: "Track Progress",
                      description:
                        "Monitor your learning journey with detailed progress tracking and insights.",
                      image: "/programming.png",
                      alt: "Progress tracking icon",
                    },
                    {
                      title: "Skill Paths",
                      description:
                        "Follow structured learning paths designed by experts in the field.",
                      image: "/notebook.png",
                      alt: "Skill path notebook icon",
                    },
                    {
                      title: "Fast Learning",
                      description:
                        "Accelerate your learning with our optimized course structure",
                      image: "/bolt.png",
                      alt: "Fast learning bolt icon",
                    },
                  ].map((item) => (
                    <article
                      key={item.title}
                      className="rounded-md border border-indigo-100 bg-indigo-50/60 p-5 shadow-sm"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100">
                        <Image
                          src={item.image}
                          alt={item.alt}
                          width={20}
                          height={20}
                          className="h-5 w-5 object-contain"
                        />
                      </div>

                      <h3 className="mt-4 text-xl font-bold text-gray-950">
                        {item.title}
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-gray-700">
                        {item.description}
                      </p>
                    </article>
                  ))}
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
