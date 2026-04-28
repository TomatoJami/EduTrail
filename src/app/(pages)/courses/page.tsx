"use client";

import Link from "next/link";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { ProtectedPage } from "@/components/common/ProtectedPage";
import { Sidebar } from "@/components/common/Sidebar"

export default function Courses() {

  return (
    <>
      <ProtectedPage>
        <Header />
          <main className="flex-1">
            <section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 min-h-[calc(100vh-4rem)]">
              <div className="flex min-h-[calc(100vh-4rem)] flex-col md:flex-row">
                <Sidebar />
              </div>
            </section>
          
        </main>

        <Footer />
      </ProtectedPage>
    </>
  );
}