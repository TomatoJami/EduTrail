"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminNav } from "@/components/admin/AdminNav";

/** Defines the TypeScript shape for auth user. */
type AuthUser = {
  id?: string;
  _id?: string;
  role?: "student" | "admin";
};

/** Renders the get stored user interface. */
function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = localStorage.getItem("user");
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

/** Renders the admin layout interface. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  // Synchronizes browser state or side effects after render.
  useEffect(() => {
    const user = getStoredUser();
    if (!user || user.role !== "admin") {
      router.replace("/");
      return;
    }

    setIsCheckingAccess(false);
  }, [router]);

  if (isCheckingAccess) {
    // Returns the JSX layout for this render state.
    return <section className="min-h-screen bg-slate-100" />;
  }

  // Returns the JSX layout for this render state.
  return (
    <main className="min-h-screen bg-slate-100 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Admin panel</h1>
            <p className="text-sm text-slate-600">Manage platform sections</p>
          </div>
          <Link
            href="/"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Back to home
          </Link>
        </div>

        <AdminNav />
        {children}
      </div>
    </main>
  );
}
