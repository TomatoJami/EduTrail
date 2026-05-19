import Link from "next/link";

const sections = [
  {
    href: "/admin/subjects",
    title: "Subjects",
    description: "Create and organize subject categories.",
  },
  {
    href: "/admin/courses",
    title: "Courses",
    description: "Manage course catalog and metadata.",
  },
  {
    href: "/admin/users",
    title: "Users",
    description: "View and manage student/admin accounts.",
  },
  {
    href: "/admin/feedback",
    title: "Feedback",
    description: "Review user feedback and reports.",
  },
];

/** Renders the admin home page interface. */
export default function AdminHomePage() {
  // Returns the JSX layout for this render state.
  return (
    <section className="grid gap-4 sm:grid-cols-2">
      {sections.map((section) => (
        <Link
          key={section.href}
          href={section.href}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
        >
          <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
          <p className="mt-1 text-sm text-slate-600">{section.description}</p>
        </Link>
      ))}
    </section>
  );
}
