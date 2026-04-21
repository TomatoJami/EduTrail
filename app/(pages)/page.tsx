// app/(pages)/page.tsx
import Link from "next/link";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";

export default function Home() {
  return (
    <>
    <Header />
      
    <main className="flex-1">
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

              <Link href="/login" className="inline-block px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition text-lg">
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
      </main>

      <Footer />
    </>
  );
}
