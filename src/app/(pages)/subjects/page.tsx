'use client';

import { Footer } from "@/components/common/Footer";
import { Header } from "@/components/common/Header";
import { ProtectedPage } from "@/components/common/ProtectedPage";
import { Sidebar } from "@/components/common/Sidebar";
import { useState, useEffect } from "react";
import { Subject } from "@/types";


export default function Subjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch subjects
        const subjectsResponse = await fetch("/api/subjects");
        const subjectsData = await subjectsResponse.json();
        if (subjectsData.success) {
          setSubjects(subjectsData.data || []);
        } else {
          setError(subjectsData.message || "Failed to load subjects");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load subjects");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <>
      <ProtectedPage>
        <Header />
        <main className="flex-1">
          <section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 min-h-[calc(100vh-4rem)]">
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
                ) : subjects.length > 0 ? (
                  <div className="py-8 sm:py-10">
                    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {subjects.map((subject) => (
                          <div
                            key={subject._id}
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
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-slate-600 text-lg">No subjects available.</p>
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