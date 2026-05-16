"use client";

import { useEffect, useMemo, useState } from "react";

type FeedbackUser = {
  _id?: string;
  name?: string;
  email?: string;
};

type FeedbackItem = {
  _id: string;
  feedbackType: "Error" | "Wish";
  data: string;
  user_id: string | FeedbackUser;
  createdAt?: string;
};

type FilterType = "all" | "Error" | "Wish";

type StoredUser = {
  id?: string;
  _id?: string;
};

const getUserId = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = localStorage.getItem("user");
  if (!raw) {
    return null;
  }

  try {
    const user = JSON.parse(raw) as StoredUser;
    return user._id || user.id || null;
  } catch {
    return null;
  }
};

const formatDate = (value?: string) => {
  if (!value) {
    return "Unknown date";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const getUserField = (user: string | FeedbackUser, field: keyof FeedbackUser) => {
  if (typeof user === "string") {
    return "Unknown";
  }

  return user[field] || "Unknown";
};

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const userId = getUserId();
      if (!userId) {
        setError("Unauthorized: user id not found");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/feedback", {
        headers: {
          "x-user-id": userId,
        },
      });

      const data = await response.json();

      if (!response.ok || data?.success === false) {
        throw new Error(data?.message || `Failed to fetch feedback (${response.status})`);
      }

      setFeedback(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load feedback";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const filteredFeedback = useMemo(() => {
    if (filter === "all") {
      return feedback;
    }

    return feedback.filter((item) => item.feedbackType === filter);
  }, [feedback, filter]);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Feedback</h2>
          <p className="mt-1 text-sm text-slate-600">
            All feedback items with user details and creation date.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(["all", "Error", "Wish"] as FilterType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFilter(type)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                filter === type
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {type === "all" ? "All" : type}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-600">Loading feedback...</p>
      ) : filteredFeedback.length === 0 ? (
        <p className="text-sm text-slate-600">No feedback found for this filter.</p>
      ) : (
        <div className="space-y-3">
          {filteredFeedback.map((item) => (
            <div key={item._id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                    item.feedbackType === "Error"
                      ? "bg-rose-100 text-rose-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {item.feedbackType}
                </span>
                <span className="text-xs text-slate-500">Created at {formatDate(item.createdAt)}</span>
              </div>

              <p className="mb-4 whitespace-pre-wrap text-sm text-slate-800">{item.data}</p>

              <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
                <div>
                  <span className="font-medium text-slate-700">Name:</span>{" "}
                  {getUserField(item.user_id, "name")}
                </div>
                <div>
                  <span className="font-medium text-slate-700">Email:</span>{" "}
                  {getUserField(item.user_id, "email")}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
