"use client";

// app/(pages)/page.tsx
import Link from "next/link";
import { useEffect, useState } from "react";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { Sidebar } from "@/components/common/Sidebar";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const syncAuthState = () => {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) {
        setIsLoggedIn(false);
        setIsAdmin(false);
        return;
      }

      setIsLoggedIn(true);

      try {
        const parsedUser = JSON.parse(storedUser) as { role?: 'student' | 'admin' };
        setIsAdmin(parsedUser.role === 'admin');
      } catch {
        setIsAdmin(false);
      }
    };

    syncAuthState();
    window.addEventListener("storage", syncAuthState);
    window.addEventListener("auth-state-changed", syncAuthState);

    return () => {
      window.removeEventListener("storage", syncAuthState);
      window.removeEventListener("auth-state-changed", syncAuthState);
    };
  }, []);

  return (
    <>
      <Header />

      <main className="flex-1">
        {isLoggedIn === null ? (
          <section className="bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 pt-32 pb-40 min-h-screen" />
        ) : isLoggedIn ? (
          <>
            <section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 min-h-[calc(100vh-4rem)]">
              <div className="flex min-h-[calc(100vh-4rem)] flex-col md:flex-row">
                <Sidebar />

                <div className="min-w-0 flex-1 py-8 sm:py-10">
                  <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                      Welcome back to <span className="text-indigo-600">EduTrail</span>
                    </h1>
                    <p className="text-lg text-gray-600 mb-10 max-w-2xl">
                      Continue your learning journey. Pick up where you left off and keep building your skills.
                    </p>

                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-500 mb-2">In Progress</p>
                        <p className="text-3xl font-bold text-gray-900">3</p>
                        <p className="text-sm text-gray-600 mt-2">Courses currently active</p>
                      </div>

                      <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-500 mb-2">Completed</p>
                        <p className="text-3xl font-bold text-gray-900">7</p>
                        <p className="text-sm text-gray-600 mt-2">Courses completed so far</p>
                      </div>

                      <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-500 mb-2">Weekly Goal</p>
                        <p className="text-3xl font-bold text-gray-900">68%</p>
                        <p className="text-sm text-gray-600 mt-2">Progress toward this week&apos;s target</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        ) : (
          <>
            {/* Hero Section */}
            <section className="bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 pt-32 pb-40 min-h-screen flex items-center">
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

            {/* Features Section */}
            <section id="why" className="py-24 bg-white">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-4xl font-bold text-center mb-16 text-gray-900">
                  Why Choose EduTrail?
                </h2>

                <div className="grid md:grid-cols-3 gap-8">
                  {/* Track Progress */}
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

                  {/* Skill Paths */}
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

                  {/* Fast Learning */}
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