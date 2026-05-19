"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

/** Renders the inactivity limit ms interface. */
const INACTIVITY_LIMIT_MS = 60 * 60 * 1000;
/** Renders the last activity key interface. */
const LAST_ACTIVITY_KEY = "authLastActivity";
/** Renders the auth token key interface. */
const AUTH_TOKEN_KEY = "authToken";
/** Renders the auth expires at key interface. */
const AUTH_EXPIRES_AT_KEY = "authExpiresAt";

/** Keeps the public paths logic isolated and reusable. */
const publicPaths = new Set([
  "/",
  "/login",
  "/signup",
  "/forgot-password",
]);

/** Keeps the has active user logic isolated and reusable. */
function hasActiveUser() {
  return Boolean(localStorage.getItem("user"));
}

/** Keeps the mark activity logic isolated and reusable. */
function markActivity() {
  if (hasActiveUser()) {
    localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
  }
}

/** Keeps the clear session logic isolated and reusable. */
function clearSession() {
  localStorage.removeItem("user");
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_EXPIRES_AT_KEY);
  localStorage.removeItem(LAST_ACTIVITY_KEY);
  void fetch("/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "logout" }),
  });
  window.dispatchEvent(new Event("auth-state-changed"));
}

/** Renders the session timeout interface. */
export function SessionTimeout() {
  const router = useRouter();
  const pathname = usePathname();

  // Synchronizes browser state or side effects after render.
  useEffect(() => {
    /** Keeps the expire session logic isolated and reusable. */
    const expireSession = () => {
      if (!hasActiveUser()) {
        localStorage.removeItem(LAST_ACTIVITY_KEY);
        return;
      }

      const lastActivity = Number(localStorage.getItem(LAST_ACTIVITY_KEY));
      const expiresAt = localStorage.getItem(AUTH_EXPIRES_AT_KEY);
      const tokenExpiresAt = expiresAt ? Date.parse(expiresAt) : 0;

      if (tokenExpiresAt && Date.now() >= tokenExpiresAt) {
        clearSession();
        const isPublicPath =
          publicPaths.has(pathname) || pathname.startsWith("/reset-password/");

        if (!isPublicPath) {
          router.push("/");
        }
        return;
      }

      if (!lastActivity) {
        markActivity();
        return;
      }

      if (Date.now() - lastActivity >= INACTIVITY_LIMIT_MS) {
        clearSession();

        const isPublicPath =
          publicPaths.has(pathname) || pathname.startsWith("/reset-password/");

        if (!isPublicPath) {
          router.push("/");
        }
      }
    };

    /** Handles activity user interaction. */
    const handleActivity = () => {
      markActivity();
    };

    /** Handles auth state changed user interaction. */
    const handleAuthStateChanged = () => {
      if (hasActiveUser()) {
        markActivity();
      } else {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_EXPIRES_AT_KEY);
        localStorage.removeItem(LAST_ACTIVITY_KEY);
        void fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "logout" }),
        });
      }
    };

    handleAuthStateChanged();
    expireSession();

    const activityEvents = ["click", "keydown", "mousemove", "scroll", "touchstart"];
    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, handleActivity, { passive: true });
    });
    window.addEventListener("storage", expireSession);
    window.addEventListener("auth-state-changed", handleAuthStateChanged);

    const intervalId = window.setInterval(expireSession, 60 * 1000);

    return () => {
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, handleActivity);
      });
      window.removeEventListener("storage", expireSession);
      window.removeEventListener("auth-state-changed", handleAuthStateChanged);
      window.clearInterval(intervalId);
    };
  }, [pathname, router]);

  return null;
}
