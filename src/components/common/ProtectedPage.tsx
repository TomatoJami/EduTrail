"use client";

import { useEffect } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedPageProps {
  children: React.ReactNode;
}

export function ProtectedPage({ children }: ProtectedPageProps) {
  const { user, loadUser, initialized } = useAuth();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  if (!initialized) {
    return (
      <>
        <Header />
        <main className="flex-1">
          <section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 min-h-[calc(100vh-4rem)] flex items-center justify-center">
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Header />
        <main className="flex-1">
          <section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 min-h-[calc(100vh-4rem)] flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Please log in to access
              </p>
              <a href="/login" className="text-blue-600 hover:underline">
                Go to Login
              </a>
            </div>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  return <>{children}</>;
}