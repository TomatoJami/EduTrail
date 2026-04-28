"use client";

import { useEffect } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedPageProps {
  children: React.ReactNode;
}

export function ProtectedPage({ children }: ProtectedPageProps) {
  const { user, loadUser } = useAuth();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  if (!user) {
    return (
      <>
        <Header />
        <main className="flex-1">
          <section className="bg-white min-h-[calc(100vh-4rem)] flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-600 mb-4">Please log in to access</p>
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
