"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Course, CourseProgress, CourseCardProps } from "@/types";


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

export function CourseCard({
  course,
  userId,
  courseProgress,
  onBookmarkChange,
}: CourseCardProps) {
  const router = useRouter();

  const [isBookmarked, setIsBookmarked] = useState(
    courseProgress?.is_bookmarked || false
  );

  const [isLoading, setIsLoading] = useState(false);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);

  useEffect(() => {
    setIsBookmarked(courseProgress?.is_bookmarked || false);
  }, [courseProgress]);

  const handleStartCourse = async (e: React.MouseEvent) => {
    e.preventDefault();

    try {
      setIsLoading(true);

      const response = await fetch(
        `/api/progress/courses/${course._id}/start`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": userId || "",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to start course");
      }

      router.push(`/courses/${course._id}/learn`);
    } catch (err) {
      console.error("Error starting course:", err);
      alert("Failed to start course");
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueCourse = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(`/courses/${course._id}`);
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();

    try {
      setIsBookmarkLoading(true);

      const response = await fetch(
        `/api/progress/courses/${course._id}/bookmark`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": userId || "",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to bookmark course");
      }

      const data = await response.json();

      setIsBookmarked(data.data?.is_bookmarked || false);

      if (course._id) {
        onBookmarkChange?.(
          course._id,
          data.data?.is_bookmarked || false
        );
      }
    } catch (err) {
      console.error("Error bookmarking course:", err);
      alert("Failed to bookmark course");
    } finally {
      setIsBookmarkLoading(false);
    }
  };

  return (
    <Link href={`/courses/${course._id}`}>
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col h-full cursor-pointer">
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

        <div className="p-4 flex flex-col flex-grow">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Course
            </p>

            {userId && (
              <button
                onClick={handleBookmark}
                disabled={isBookmarkLoading}
                className={`rounded-full p-1.5 transition ${
                  isBookmarked
                    ? "text-blue-400 hover:text-blue-500"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <BookmarkIcon />
              </button>
            )}
          </div>

          <h3 className="text-base font-bold text-slate-900 mb-3 overflow-hidden break-words line-clamp-2">
            <span className="truncate overflow-hidden whitespace-nowrap block">
              {course.title}
            </span>
          </h3>

          <div className="flex items-end justify-between gap-2 mt-auto">
            <span className="text-xs font-medium text-slate-600 whitespace-nowrap">
              Ages {course.ageGroup}
            </span>

            {userId && courseProgress ? (
              courseProgress.status === "in_progress" ? (
                <button
                  onClick={handleContinueCourse}
                  className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-semibold text-sm transition-colors"
                >
                  Continue
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    router.push(`/courses/${course._id}`);
                  }}
                  className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-700 font-semibold text-sm transition-colors"
                >
                  View
                </button>
              )
            ) : userId ? (
              <button
                onClick={handleStartCourse}
                disabled={isLoading}
                className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-semibold text-sm transition-colors disabled:opacity-50"
              >
                {isLoading ? "Starting..." : "Get Started"}
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 text-indigo-600 font-semibold text-sm">
                View
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}