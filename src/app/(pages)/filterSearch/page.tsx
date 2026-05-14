"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { Sidebar } from "@/components/common/Sidebar";
import { Course, Subject } from "@/types";
import { CourseSearch } from "@/components/common/CourseSearch";

function FilterSearchLoading() {
  return (
    <main className="flex-1">
      <section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </section>
    </main>
  );
}

function FilterSearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string[]>([]);
  const [savedCourses, setSavedCourses] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Check if there's a subject parameter in the URL
    const subjectParam = searchParams.get("subject");
    if (subjectParam) {
      setSelectedSubjects([subjectParam]);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) {
          router.push("/login");
          return;
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
        }
        setIsInitialized(true);
      } catch (err) {
        console.error("Failed to load data:", err);
        setIsInitialized(true);
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

  const toggleSubjectFilter = (subjectId: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const toggleAgeGroupFilter = (ageGroup: string) => {
    setSelectedAgeGroup((prev) =>
      prev.includes(ageGroup)
        ? prev.filter((age) => age !== ageGroup)
        : [...prev, ageGroup]
    );
  };

  // Filter courses based on selected subjects and age groups
  const filteredCourses = courses.filter((course) => {
    const matchesSubject =
      selectedSubjects.length === 0 ||
      selectedSubjects.some(
        (id) => String(course.subject_id) === id || 
                (course.subject_id as any)?._id === id
      );

    const matchesAgeGroup =
      selectedAgeGroup.length === 0 ||
      selectedAgeGroup.includes(course.ageGroup);

    return matchesSubject && matchesAgeGroup;
  });

  // Reusable course card component
  const CourseCard = ({ course }: { course: Course }) => (
    <Link href={`/courses/${course._id}`} className="block h-full">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg transition-shadow duration-300 flex items-stretch h-full">
        <div className="p-6 flex flex-col justify-between flex-1">
            <div>
            <h3 className="text-lg font-bold text-slate-900 mb-3 line-clamp-2">
                {course.title}
            </h3>
            <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                {course.description}
            </p>
            </div>
            <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">
                Ages {course.ageGroup}
            </span>
            </div>
        </div>

        {/* Image Container - Right Side */}
        <div className="relative w-48 bg-white p-3 flex items-center justify-center flex-shrink-0 border-l border-slate-100">
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
        </div>
    </Link>
  );

  if (!isInitialized) {
    return <FilterSearchLoading />;
    }

  return (
    <>
        <Header />
        <main className="flex-1">
          <section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 min-h-screen">
            <div className="flex min-h-screen flex-col md:flex-row">
              <Sidebar />
              <div className="min-w-0 flex-1 py-8 sm:py-10">
                <CourseSearch courses={courses} />
                <div className="py-8 sm:py-10">
                  <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row gap-8">

                    
                        {/* Filters Sidebar */}
                        <div className="lg:w-64 flex-shrink-0">
                        <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6">
                            <div className="mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-slate-900">
                                    Filter By
                                </h3>

                                {(selectedSubjects.length > 0 || selectedAgeGroup.length > 0) && (
                                    <button
                                    onClick={() => {
                                        setSelectedSubjects([]);
                                        setSelectedAgeGroup([]);
                                    }}
                                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                                    >
                                    Clear filter
                                    </button>
                                )}
                                </div>

                            {/* Subject Filter */}
                            <div className="mb-8">
                                <h4 className="text-base font-semibold text-slate-900 mb-3 uppercase">
                                Subject
                                </h4>
                                <div className="space-y-2">
                                {subjects.map((subject) => (
                                    <label
                                    key={subject._id}
                                    className="flex items-center gap-2 cursor-pointer"
                                    >
                                    <input
                                        type="checkbox"
                                        checked={selectedSubjects.includes(
                                        subject._id || ""
                                        )}
                                        onChange={() =>
                                        toggleSubjectFilter(subject._id || "")
                                        }
                                        className="w-5 h-5 rounded border-slate-300 text-indigo-600"
                                    />
                                    <span className="text-base text-slate-700">
                                        {subject.subject_name}
                                    </span>
                                    </label>
                                ))}
                                </div>
                            </div>

                            {/* Age Group Filter */}
                            <div className="mb-8">
                                <h4 className="text-base font-semibold text-slate-900 mb-3 uppercase">
                                Age Group
                                </h4>
                                <div className="space-y-2">
                                {["1-3", "4-9", "10-12"].map((ageGroup) => (
                                    <label
                                    key={ageGroup}
                                    className="flex items-center gap-2 cursor-pointer"
                                    >
                                    <input
                                        type="checkbox"
                                        checked={selectedAgeGroup.includes(ageGroup)}
                                        onChange={() =>
                                        toggleAgeGroupFilter(ageGroup)
                                        }
                                        className="w-5 h-5 rounded border-slate-300 text-indigo-600"
                                    />
                                    <span className="text-base text-slate-700">
                                        Ages {ageGroup}
                                    </span>
                                    </label>
                                ))}
                                </div>
                            </div>
                            </div>
                        </div>
                        </div>

                        {/* Results */}
                        <div className="flex-1 min-w-0">
                        {/* Results Grid */}
                        {filteredCourses.length > 0 ? (
                          <div className="grid grid-cols-1 gap-6">
                          {filteredCourses.map((course) => (
                            <CourseCard key={course._id} course={course} />
                          ))}
                          </div>
                        ) : (
                            <div className="text-center py-12">
                            <p className="text-slate-600 text-lg">
                                No courses found matching your filters.
                            </p>
                            </div>
                        )}
                        </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        <Footer />
    </>
  );
}

export default function FilterSearch() {
  return (
    <Suspense fallback={<FilterSearchLoading />}>
      <FilterSearchContent />
    </Suspense>
  );
}
