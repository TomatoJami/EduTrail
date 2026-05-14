"use client";

// src/components/common/Header.tsx
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [userProfile, setUserProfile] = useState<{ name: string; email: string } | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const isChapterPage = pathname.split("/").length === 4 && pathname.startsWith("/courses/"); 
  const isAccountPage = pathname === "/account" || pathname === "/account/preferences";

  useEffect(() => {
    const syncAuthState = () => {
      const storedUser = localStorage.getItem("user");

      if (!storedUser) {
        setIsLoggedIn(false);
        setUserProfile(null);
        return;
      }

      try {
        const parsedUser = JSON.parse(storedUser) as { name?: string; email?: string };
        setIsLoggedIn(true);
        setUserProfile({
          name: parsedUser.name ?? "User",
          email: parsedUser.email ?? "",
        });
      } catch {
        setIsLoggedIn(true);
        setUserProfile(null);
      }
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
    localStorage.removeItem("authToken");
    localStorage.removeItem("authExpiresAt");
    localStorage.removeItem("authLastActivity");
    void fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    window.dispatchEvent(new Event("auth-state-changed"));
    setIsMenuOpen(false);
    router.push("/");
  };

  const handleSettingsClick = () => {
    setIsMenuOpen(false);
    router.push("/account");
  };

    const handleFeedbackClick = () => {
    setIsMenuOpen(false);
    router.push("/feedback");
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3">
          {/* Logo */}
          <Link href="/" className="flex min-w-0 items-center gap-2 text-2xl font-bold">
            <Image src="/logoblack.png" alt="EduTrail Logo" width={200} height={100} className="h-auto w-36 sm:w-48" />
          </Link>
          {/* Auth buttons */}
          {!isAccountPage && !isChapterPage && (
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              {isLoggedIn === null ? (
                <div className="h-10 w-10 sm:w-40" aria-hidden="true" />
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
                      className="absolute right-0 mt-3 w-[calc(100vw-2rem)] max-w-64 rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden"
                    >
                      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                          <Image src="/account.png" alt="Account" width={24} height={24} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-900">{userProfile?.name ?? "User"}</p>
                          <p className="truncate text-sm text-gray-500">{userProfile?.email ?? ""}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        role="menuitem"
                        onClick={handleSettingsClick}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition"
                      >
                        <span className="flex h-8 w-8 items-center justify-center text-gray-500">
                          <Image src="/settings.png" alt="Settings" width={20} height={20} />
                        </span>
                        <span>Settings</span>
                      </button>

                      <button
                        type="button"
                        role="menuitem"
                        onClick={handleFeedbackClick}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition"
                      >
                        <span className="flex h-8 w-8 items-center justify-center text-gray-500">
                          <Image src="/feedback.png" alt="Feedback" width={20} height={20} />
                        </span>
                        <span>Share feedback</span>
                      </button>

                      <button
                        type="button"
                        role="menuitem"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition"
                      >
                        <span className="flex h-8 w-8 items-center justify-center text-gray-500">
                          <Image src="/logout.png" alt="Logout" width={20} height={20} />
                        </span>
                        <span>Logout</span>
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <>
                  <Link href="/login" className="px-3 py-2 text-sm text-gray-700 hover:text-gray-900 transition border border-gray-300 rounded-lg sm:px-4 sm:text-base">
                    Login
                  </Link>
                  <Link href="/signup" className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium sm:px-4 sm:text-base">
                    Register
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
