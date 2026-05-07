"use client";

// app/(pages)/page.tsx
import Link from "next/link";
import { useEffect, useState } from "react";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { Sidebar } from "@/components/common/Sidebar";
import { CourseCard } from "@/components/CourseCard";
import { Course } from "@/types";

interface CourseProgress {
  _id: string;
  user_id: string;
  course_id: string;
  status: "in_progress" | "completed";
  is_bookmarked: boolean;
  created_at: string;
  updated_at: string;
}

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseProgressMap, setCourseProgressMap] = useState<Record<string, CourseProgress>>({});
  const [activeTab, setActiveTab] = useState("In Progress");
  const [isInitialized, setIsInitialized] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

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
        const parsedUser = JSON.parse(storedUser) as { role?: 'student' | 'admin'; _id?: string; id?: string };
        setIsAdmin(parsedUser.role === 'admin');
        setUserId(parsedUser._id || parsedUser.id || null);
      } catch {
        setIsAdmin(false);
        setUserId(null);
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

  // Fetch course progress for all courses when userId and courses are available
  useEffect(() => {
    if (!userId || courses.length === 0) {
      setCourseProgressMap({});
      return;
    }

    const fetchAllCourseProgress = async () => {
      const progressMap: Record<string, CourseProgress> = {};

      for (const course of courses) {
        if (!course._id) continue;
        try {
          const response = await fetch(`/api/progress/courses/${course._id}`, {
            headers: {
              'x-user-id': userId,
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.data) {
              progressMap[course._id] = data.data;
            }
          }
        } catch (error) {
          console.error(`Error fetching progress for course ${course._id}:`, error);
        }
      }

      setCourseProgressMap(progressMap);
    };

    fetchAllCourseProgress();
  }, [userId, courses]);

  // Filter courses based on active tab
  const getFilteredCourses = () => {
    if (activeTab === "In Progress") {
      return courses.filter((course) => course._id && courseProgressMap[course._id]?.status === "in_progress");
    } else if (activeTab === "Saved") {
      return courses.filter((course) => course._id && courseProgressMap[course._id]?.is_bookmarked === true);
    } else if (activeTab === "Completed") {
      return courses.filter((course) => course._id && courseProgressMap[course._id]?.status === "completed");
    }
    return courses;
  };

  const filteredCourses = getFilteredCourses();

  const handleBookmarkChange = (courseId: string, isBookmarked: boolean) => {
    // Update the courseProgressMap when bookmark status changes
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
                    {filteredCourses.length > 0 ? (
                      filteredCourses.map((course) => (
                        <CourseCard
                          key={course._id}
                          course={course}
                          userId={userId || undefined}
                          onBookmarkChange={handleBookmarkChange}
                        />
                      ))
                    ) : (
                      <div className="col-span-full text-center py-12">
                        <p className="text-slate-500 text-lg">No courses found in this category</p>
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