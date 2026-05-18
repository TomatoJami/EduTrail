"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Footer } from "@/components/common/Footer";
import { Header } from "@/components/common/Header";
import { Sidebar } from "@/components/common/Sidebar";

type FeedbackType = "Error" | "Wish";

export default function FeedbackPage() {
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("Error");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      router.push("/login");
      return;
    }

    setIsInitialized(true);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!text.trim()) {
      setError("Please enter your feedback");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const storedUser = localStorage.getItem("user");

      if (!storedUser) {
        router.push("/login");
        return;
      }

      const user = JSON.parse(storedUser);

    // Submit feedback through the API proxy with the current user id attached.
    const response = await fetch("/api/feedback", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "x-user-id": user.id || user._id,
    },
    body: JSON.stringify({
        feedbackType,
        data: text,
    }),
    });

      const data = await response.json();

      if (data.success) {
        setMessage("Feedback submitted successfully");
        setText("");
        setFeedbackType("Error");
      } else {
        setError(data.message || "Failed to submit feedback");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to submit feedback"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isInitialized) {
    return null;
  }

  return (
    <>
      <Header />

      <main className="flex-1">
        <section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 min-h-[calc(100vh-4rem)]">
          <div className="flex min-h-screen flex-col md:flex-row">
            <Sidebar />

            <div className="min-w-0 flex-1">
              <div className="py-8 sm:py-10">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                  {/* Title */}
                  <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                      Feedback
                    </h1>
                    <p className="mt-2 text-sm text-slate-600">
                      Report an issue or share your suggestions.
                    </p>
                  </div>

                  {/* Alerts */}
                  {message && (
                    <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                      {message}
                    </div>
                  )}

                  {error && (
                    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  {/* Form Card */}
                  <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <form
                      onSubmit={handleSubmit}
                      className="p-6 sm:p-8 space-y-6"
                    >
                      {/* Category */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-2">
                          Category
                        </label>

                        <select
                          value={feedbackType}
                          onChange={(e) =>
                            setFeedbackType(
                              e.target.value as FeedbackType
                            )
                          }
                          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        >
                          <option value="Error">Error</option>
                          <option value="Wish">Wish</option>
                        </select>
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-2">
                          Description
                        </label>

                        <textarea
                          value={text}
                          onChange={(e) =>
                            setText(e.target.value)
                          }
                          rows={8}
                          placeholder="Write your issue or suggestion..."
                          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition resize-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />
                      </div>

                      {/* Submit */}
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={loading}
                          className="px-6 py-2 bg-white border border-gray-300 text-gray-800 font-semibold rounded hover:bg-gray-50 disabled:bg-gray-100 transition"
                        >
                          {loading ? "Sending..." : "Send Feedback"}
                        </button>
                      </div>
                    </form>
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
