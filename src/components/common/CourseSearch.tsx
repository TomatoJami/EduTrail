'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Course } from '@/types';

/** Defines the TypeScript shape for props. */
interface Props {
  courses: Course[];
}

/** Renders the course search interface. */
export const CourseSearch = ({ courses }: Props) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(query.toLowerCase())
  );

  const showDropdown = isFocused && query;

  // Returns the JSX layout for this render state.
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 mb-8">
      <div className="relative w-full">

        <input
          type="text"
          placeholder="Search courses..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setTimeout(() => setIsFocused(false), 150);
          }}
          className="w-full px-4 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
          <img src="/search.png" alt="Search" />
        </div>

        {showDropdown && (
          <div className="absolute left-0 top-full w-full bg-white border shadow-sm max-h-64 overflow-y-auto z-50">
            {filteredCourses.length > 0 ? (
              filteredCourses.map(course => (
                <Link
                  key={course._id}
                  href={`/courses/${course._id}`}
                  className="block px-4 py-2 text-gray-500 hover:bg-gray-100 transition"
                >
                  {course.title}
                </Link>
              ))
            ) : (
              <p className="p-4 text-gray-500">No courses found</p>
            )}
          </div>
        )}

      </div>
    </div>
  );
};