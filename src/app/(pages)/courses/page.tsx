"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { Sidebar } from "@/components/common/Sidebar";
import { CourseCard } from "@/components/CourseCard";
import { Course, Subject, CourseProgress } from "@/types";
import { CourseSearch } from '@/components/common/CourseSearch';

const COURSES_PER_PAGE = 6;

export default function Courses() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [user, setUser] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState("");
  const [displayedCoursesCount, setDisplayedCoursesCount] = useState(COURSES_PER_PAGE);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [courseProgressMap, setCourseProgressMap] = useState<Record<string, CourseProgress>>({});
  const [isProgressLoaded, setIsProgressLoaded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check authentication first
        const storedUser = localStorage.getItem("user");
        if (!storedUser) {
          router.push("/login");
          return;
        }

        const userData = JSON.parse(storedUser);
        setUserId(userData._id || userData.id || null);
        
        // Fetch full user data with preferences before rendering recommendations.
        const userResponse = await fetch(`/api/users/${userData.id || userData._id}`);
        const userDataFull = await userResponse.json();

        if (userDataFull.success) {
          setUser(userDataFull.data);
        } else {
          setUser(userData);
        }

        // Fetch subjects for the course filter controls.
        const subjectsResponse = await fetch("/api/subjects");
        const subjectsData = await subjectsResponse.json();
        if (subjectsData.success) {
          setSubjects(subjectsData.data || []);
        }

        // Fetch courses shown in the catalog grid.
        const coursesResponse = await fetch("/api/courses");
        const coursesData = await coursesResponse.json();
        if (coursesData.success) {
          setCourses(coursesData.data || []);
        } else {
          setError(coursesData.message || "Failed to load courses");
        }

        setIsInitialized(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load courses");
        setIsInitialized(true);
      }
    };

    fetchData();
  }, [router]);

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
              // Fetch each course progress record in parallel for card status/bookmarks.
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
            } catch {
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

  // Get recommended courses based on user preferences
  const recommendedCourses = (() => {
    
    if (!user || !user.preferredSubjects || user.preferredSubjects.length === 0) {
      const filtered = courses.filter(course => {
        const ageGroupMatch = !user?.ageGroup || course.ageGroup === user.ageGroup;
        const progress = course._id ? courseProgressMap[course._id] : null;
        const statusMatch = !progress || (progress.status !== 'in_progress' && progress.status !== 'completed');
        return ageGroupMatch && statusMatch;
      }).slice(0, 3);
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

      const progress = course._id ? courseProgressMap[course._id] : null;
      const statusMatch = !progress || (progress.status !== 'in_progress' && progress.status !== 'completed');

      return ageGroupMatch && subjectMatch && statusMatch;
    }).slice(0, 3);
    return filtered;
  })();

  const filteredCourses = courses.filter(course => {
    // Filter by subject if selected
    if (selectedSubject && course.subject_id !== selectedSubject) {
      return false;
    }

    // Exclude courses with status "in_progress" or "completed"
    const progress = course._id ? courseProgressMap[course._id] : null;
    if (progress && (progress.status === 'in_progress' || progress.status === 'completed')) {
      return false;
    }

    return true;
  });

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

  if (!isInitialized) {
		return (
			<main className="flex-1">
				<section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 min-h-screen flex items-center justify-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
				</section>
			</main>
		);
	}

  return (
    <>
        <main className="flex-1">
          <Header />
          <section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 min-h-screen">
            <div className="flex min-h-screen flex-col md:flex-row">
              <Sidebar />
              <div className="min-w-0 flex-1">
                {error && (
                <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700">
                  {error}
                </div>
                )}

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
                        {!isProgressLoaded ? (
                          <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                          </div>
                        ) : displayedCourses.length > 0 ? (
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

                          {/* No preferences yet */}
                          {(!user?.preferredSubjects || user.preferredSubjects.length === 0) ? (
                            <div className="text-center py-12">
                              <p className="text-slate-600 text-lg mb-4">
                                You haven&apos;t set your preferences yet.
                              </p>
                              <p className="text-sm text-slate-500">
                                Add your interests to get personalized course recommendations.
                              </p>
                            </div>
                          ) : (
                            /* Preferences exist, so show recommended courses */
                            <>
                              {recommendedCourses.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                  {recommendedCourses.map((course) => (
                                    <CourseCard
                                      key={course._id}
                                      course={course}
                                      userId={userId || undefined}
                                      courseProgress={
                                        course._id
                                          ? courseProgressMap[course._id]
                                          : null
                                      }
                                    />
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
                        ) : null}

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
                                  <CourseCard
                                    key={course._id}
                                    course={course}
                                    userId={userId || undefined}
                                    courseProgress={
                                      course._id
                                        ? courseProgressMap[course._id]
                                        : null
                                    }
                                  />
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
              </div>
            </div>
          </section>
          <Footer />
      </main>
    </>
  );
}
