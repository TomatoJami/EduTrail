"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  {
    href: "/",
    label: "My Progress",
    icon: {
      default: "/progress.png",
      active: "/progress_picked.png",
      alt: "Progress",
    },
  },
  {
    href: "/account",
    label: "Skills Paths",
    icon: {
      default: "/courses.png",
      active: "/courses_picked.png",
      alt: "Courses",
    },
  },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full border-b border-gray-200 bg-white md:w-56 md:shrink-0 md:border-b-0 md:border-r">
      <div className="h-full px-4 py-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Learn</p>

        <nav aria-label="Learning navigation" className="flex gap-2 md:flex-col">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex items-center gap-3 rounded-md border px-3 py-2 text-sm transition",
                  isActive
                    ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                    : "border-transparent text-[#757D88] hover:border-gray-200 hover:bg-gray-50 hover:text-gray-900",
                ].join(" ")}
              >
                <Image
                  src={isActive ? item.icon.active : item.icon.default}
                  alt={item.icon.alt}
                  width={24}
                  height={24}
                  className="h-6 w-6 shrink-0"
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
