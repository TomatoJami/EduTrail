"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const adminSections = [
  { href: "/admin/subjects", label: "Subjects" },
  { href: "/admin/courses", label: "Courses" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/feedback", label: "Feedback" },
];

/** Renders the admin nav interface. */
export function AdminNav() {
  const pathname = usePathname();

  // Returns the JSX layout for this render state.
  return (
    <nav className="mb-8 rounded-xl border border-slate-200 bg-white p-2 shadow-sm" aria-label="Admin sections">
      <ul className="flex flex-wrap gap-2">
        {adminSections.map((section) => {
          const isActive = pathname === section.href;

          // Returns the JSX layout for this render state.
          return (
            <li key={section.href}>
              <Link
                href={section.href}
                className={`inline-flex rounded-lg px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {section.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
