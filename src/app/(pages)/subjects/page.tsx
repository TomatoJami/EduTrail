'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Footer } from "@/components/common/Footer";
import { Header } from "@/components/common/Header";
import { Sidebar } from "@/components/common/Sidebar";
import { useState, useEffect } from "react";
import { Subject } from "@/types";

/** Renders the subjects interface. */
export default function Subjects() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState("");

  // Synchronizes browser state or side effects after render.
  useEffect(() => {
    /** Renders the fetch data interface. */
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
        } else {
          setError(subjectsData.message || "Failed to load subjects");
        }

        setIsInitialized(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load subjects");
        setIsInitialized(true);
      }
    };
    fetchData();
  }, [router]);

  	if (!isInitialized) {
		// Returns the JSX layout for this render state.
		return (
			<main className="flex-1">
				<section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 min-h-screen flex items-center justify-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
				</section>
			</main>
		);
	}

	if (error) {
		// Returns the JSX layout for this render state.
		return (
			<main className="flex-1 min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 flex items-center justify-center">
				<div className="text-center">
					<p className="text-red-600">{error || "No subjects available"}</p>
					<Link href="/courses" className="text-indigo-600 hover:text-indigo-700 mt-4 inline-block">
						Back to courses
					</Link>
				</div>
			</main>
		);
	}

  // Returns the JSX layout for this render state.
  return (
    <>
        <Header />
        <main className="flex-1">
          <section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 min-h-[calc(100vh-4rem)]">
            <div className="flex min-h-screen flex-col md:flex-row">
              <Sidebar />
              <div className="min-w-0 flex-1">
                  <div className="py-8 sm:py-10">
                    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {subjects.map((subject) => (
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