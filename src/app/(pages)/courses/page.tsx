"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { Sidebar } from "@/components/common/Sidebar";
import { Course, Subject } from "@/types";
import { ProtectedPage } from "@/components/common/ProtectedPage";
import { CourseSearch } from '@/components/common/CourseSearch';

const COURSES_PER_PAGE = 6;

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savedCourses, setSavedCourses] = useState<Set<string>>(new Set());
  const [displayedCoursesCount, setDisplayedCoursesCount] = useState(COURSES_PER_PAGE);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user from localStorage
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          // Fetch full user data with preferences
          const userResponse = await fetch(`/api/users/${userData.id || userData._id}`);
          const userDataFull = await userResponse.json();

          if (userDataFull.success) {
            setUser(userDataFull.data);
          } else {
            setUser(userData);
          }
        }

        // Fetch subjects
        const subjectsResponse = await fetch("/api/subjects");
        const subjectsData = await subjectsResponse.json();
        if (subjectsData.success) {
          setSubjects(subjectsData.data || []);
        }

        // Fetch courses
        const coursesResponse = await fetch("/api/courses");
        const coursesData = await coursesResponse.json();
        if (coursesData.success) {
          setCourses(coursesData.data || []);
        } else {
          setError(coursesData.message || "Failed to load courses");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load courses");
      } finally {
        setLoading(false);
      }
    };

    fetchData();

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

  // Get recommended courses based on user preferences
  const recommendedCourses = (() => {
    
    if (!user || !user.preferredSubjects || user.preferredSubjects.length === 0) {
      const filtered = courses.filter(course => !user?.ageGroup || course.ageGroup === user.ageGroup).slice(0, 3);
      return filtered;
    }
    
    const filtered = courses.filter((course) => {
      const ageGroupMatch = !user.ageGroup || course.ageGroup === user.ageGroup;
      const courseSubjectId = typeof course.subject_id === 'string' 
        ? course.subject_id 
        : (course.subject_id as any)?._id || (course.subject_id as any)?.toString?.() || '';
      
      const subjectMatch = user.preferredSubjects.some((id: any) => {
        const idString = typeof id === 'string' ? id : (id as any)?._id || (id as any)?.toString?.() || '';
        return idString === courseSubjectId;
      });
      return ageGroupMatch && subjectMatch;
    }).slice(0, 3);
    return filtered;
  })();

  const filteredCourses = selectedSubject
    ? courses.filter(course => course.subject_id === selectedSubject)
    : courses;

  const displayedSubjects = subjects.slice(0, 4);

  const displayedCourses = filteredCourses.slice(0, displayedCoursesCount);

  const hasMoreCourses = displayedCoursesCount < filteredCourses.length;

  const handleLoadMore = () => {
    setDisplayedCoursesCount(prev => prev + COURSES_PER_PAGE);
  };

  const handleSubjectFilter = (subjectId: string | null) => {
    setSelectedSubject(subjectId);
    setDisplayedCoursesCount(COURSES_PER_PAGE);
  };

  // Reusable course card component
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
  );

  return (
    <>
      <ProtectedPage>
        <Header />
        <main className="flex-1">
          <section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 min-h-screen">
            <div className="flex min-h-screen flex-col md:flex-row">
              <Sidebar />
              <div className="min-w-0 flex-1">
                {error && (
                <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700">
                  {error}
                </div>
                )}

                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                  </div>
                ) : (
                <div className="min-w-0 flex-1 py-8 sm:py-10">
                  <CourseSearch courses={courses} /> 
                    <div className="mb-16 bg-white p-8 md:p-10 ">
                      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                        <div className="mb-10">
                          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                            Explore The Catalog
                          </h1>
                        </div>
                        <div className="flex items-center justify-between mb-6">
                          <h2 className="text-xl font-bold text-slate-900">Subjects</h2>
                          <a href="/subjects" className="text-indigo-600 hover:text-indigo-700 font-semibold text-sm">
                            All subjects →
                          </a>
                        </div>
                        {displayedSubjects.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {displayedSubjects.map((subject) => (
                            <Link
                              key={subject._id}
                              href={`/filterSearch?subject=${subject._id}`}
                              className="p-4 rounded-xl border-2 border-slate-200 bg-white hover:border-indigo-300 transition-all cursor-pointer"
                            >
                              <div className="flex flex-col items-center gap-3">
                                {subject.subject_img ? (
                                  <img
                                    src={subject.subject_img}
                                    alt={subject.subject_name}
                                    className="max-w-full max-h-full object-contain"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                                    <svg
                                      className="w-6 h-6 text-white"
                                      fill="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
                                    </svg>
                                  </div>
                                )}
                                <p className="text-sm font-semibold text-slate-900 text-center line-clamp-2">
                                  {subject.subject_name}
                                </p>
                              </div>
                            </Link>
                          ))}
                        </div>
                        ) : (
                            <div className="text-center py-12">
                              <p className="text-slate-600 text-lg">No subjects available.</p>
                            </div>
                          )}
                      </div>
                    </div>


                  <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                      <>
                        {/* Reset filter button */}
                        {selectedSubject && (
                          <div className="mb-8">
                            <button
                              onClick={() => handleSubjectFilter(null)}
                              className="text-indigo-600 hover:text-indigo-700 font-semibold text-sm"
                            >
                              ← Back to all courses
                            </button>
                          </div>
                        )}

                        {/* Recommended Section */}
                        {displayedCourses.length > 0 && (
                        <div className="mb-16">
                          <div className="flex items-center justify-between mb-2">
                            <h2 className="text-xl font-bold text-slate-900">
                              Recommended for you
                            </h2>

                            {(!user?.preferredSubjects || user.preferredSubjects.length === 0) && (
                              <Link
                                href="/account/preferences"
                                className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                              >
                                Add preferences
                              </Link>
                            )}
                          </div>

                          {/* Если нет preferences */}
                          {(!user?.preferredSubjects || user.preferredSubjects.length === 0) ? (
                            <div className="text-center py-12">
                              <p className="text-slate-600 text-lg mb-4">
                                You haven't set your preferences yet.
                              </p>
                              <p className="text-sm text-slate-500">
                                Add your interests to get personalized course recommendations.
                              </p>
                            </div>
                          ) : (
                            /* Если есть preferences → показываем курсы */
                            <>
                              {recommendedCourses.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                  {recommendedCourses.map((course) => (
                                    <CourseCard key={course._id} course={course} />
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-12">
                                  <p className="text-slate-600 text-lg">
                                    No matching courses found for your preferences.
                                  </p>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                        )}

                        {/* Browse All Section */}
                        <div>
                          <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-slate-900">Browse all</h2>
                            <a href="/filterSearch" className="text-indigo-600 hover:text-indigo-700 font-semibold text-sm">
                              All subjects →
                            </a>
                          </div>

                          {displayedCourses.length > 0 ? (
                            <>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                                {displayedCourses.map((course) => (
                                  <CourseCard key={course._id} course={course} />
                                ))}
                              </div>

                              {/* Load More Button */}
                              {hasMoreCourses && (
                                <div className="flex justify-center">
                                  <button
                                    onClick={handleLoadMore}
                                    className="px-8 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold hover:bg-slate-50 transition-colors"
                                  >
                                    Show more →
                                  </button>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-center py-12">
                              <p className="text-slate-600 text-lg">No courses available.</p>
                            </div>
                          )}
                        </div>
                      </>
                  </div>
                </div>
                )}
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </ProtectedPage>
    </>
  );
}