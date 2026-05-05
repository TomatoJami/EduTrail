"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const menuItems = [
  {
    href: "/",
    label: "My Progress",
    icon: {
      default: "/progress.png",
      active: "/progress_picked.png",
      hover: "/progres_clicked.png",
      alt: "Progress",
    },
  },
  {
    href: "/courses",
    label: "Search Courses",
    icon: {
      default: "/courses.png",
      active: "/courses_picked.png",
      hover: "/courses_clicked.png",
      alt: "Courses",
    },
  },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  useEffect(() => {
    const checkAdmin = () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser) as { role?: 'student' | 'admin' };
          setIsAdmin(parsedUser.role === 'admin');
        } catch {
          setIsAdmin(false);
        }
      }
    };

    checkAdmin();
    window.addEventListener("storage", checkAdmin);
    window.addEventListener("auth-state-changed", checkAdmin);

    return () => {
      window.removeEventListener("storage", checkAdmin);
      window.removeEventListener("auth-state-changed", checkAdmin);
    };
  }, []);

  return (
    <aside className="w-full border-b border-gray-200 bg-white md:w-56 md:shrink-0 md:border-b-0 md:border-r">
      <div className="h-full px-4 py-5 flex flex-col">
        <p className="mb-3 text-xs font-semibold text-center uppercase tracking-[0.2em] text-gray-400">Learn</p>

        <nav aria-label="Learning navigation" className="flex gap-2 md:flex-col">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const isHovered = hoveredItem === item.href;

          const iconSrc: typeof item.icon.default | typeof item.icon.active | typeof item.icon.hover = 
            isActive ? item.icon.active : isHovered ? item.icon.hover : item.icon.default;

          return (
            <Link
              key={item.href}
              href={item.href}
              onMouseEnter={() => setHoveredItem(item.href)}
              onMouseLeave={() => setHoveredItem(null)}
              className={[
                "flex items-center gap-3 rounded-md border px-3 py-2 text-sm transition",
                isActive
                  ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                  : "border-transparent text-[#757D88] hover:border-gray-200 hover:bg-gray-50 hover:text-gray-900",
              ].join(" ")}
            >
              <Image
                src={iconSrc}
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

        {isAdmin && (
          <>
            <div className="my-4 border-t border-gray-200"></div>
            <p className="mb-3 text-xs font-semibold text-center uppercase tracking-[0.2em] text-gray-400">Admin</p>
            <Link
              href="/admin"
              className={[
                "flex items-center gap-3 rounded-md border px-3 py-2 text-sm transition",
                pathname === "/admin"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-transparent text-[#757D88] hover:border-gray-200 hover:bg-gray-50 hover:text-gray-900",
              ].join(" ")}
            >
              <svg className="h-6 w-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Admin Panel</span>
            </Link>
          </>
        )}
      </div>
    </aside>
  );
}
