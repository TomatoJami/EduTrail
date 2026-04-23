"use client";

// src/components/common/Header.tsx
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    const syncAuthState = () => {
      const storedUser = localStorage.getItem("user");
      setIsLoggedIn(Boolean(storedUser));
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    syncAuthState();
    window.addEventListener("storage", syncAuthState);
    window.addEventListener("auth-state-changed", syncAuthState);
    window.addEventListener("click", handleClickOutside);
    window.addEventListener("keydown", handleEscapeKey);

    return () => {
      window.removeEventListener("storage", syncAuthState);
      window.removeEventListener("auth-state-changed", syncAuthState);
      window.removeEventListener("click", handleClickOutside);
      window.removeEventListener("keydown", handleEscapeKey);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("auth-state-changed"));
    setIsMenuOpen(false);
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold">
            <Image src="/logoblack.png" alt="EduTrail Logo" width={200} height={100} />
          </Link>
          {/* Auth buttons */}
          <div className="hidden md:flex gap-3">
            {isLoggedIn === null ? (
              <div className="h-10 w-40" aria-hidden="true" />
            ) : isLoggedIn ? (
              <div ref={menuRef} className="relative">
                <button
                  type="button"
                  aria-label="Account menu"
                  aria-haspopup="menu"
                  aria-expanded={isMenuOpen}
                  onClick={() => setIsMenuOpen((value) => !value)}
                  className="flex items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  <Image src="/account.png" alt="Account" width={40} height={40} className="rounded-full" />
                </button>

                {isMenuOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 mt-3 w-64 rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden"
                  >
                    <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                        <Image src="/account.png" alt="Account" width={24} height={24} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">User User</p>
                        <p className="truncate text-sm text-gray-500">user@gmail.com</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      role="menuitem"
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                        ⚙
                      </span>
                      <span>Settings</span>
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                        +
                      </span>
                      <span>Share feedback</span>
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                        ↪
                      </span>
                      <span>Logout</span>
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <>
                <Link href="/login" className="px-4 py-2 text-gray-700 hover:text-gray-900 transition border border-gray-300 rounded-lg">
                  Login
                </Link>
                <Link href="/signup" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
