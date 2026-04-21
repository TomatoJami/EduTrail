"use client";

// src/components/common/Header.tsx
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export function Header() {
  const [isOpen, setIsOpen] = useState(false);

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
            <Link href="/login" className="px-4 py-2 text-gray-700 hover:text-gray-900 transition border border-gray-300 rounded-lg">
              Login
            </Link>
            <Link href="/signup" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium">
              Register
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
