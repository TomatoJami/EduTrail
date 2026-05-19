"use client";

import Image from "next/image";
// src/components/common/Footer.tsx
import Link from "next/link";

/** Renders the footer interface. */
export function Footer() {
  // Returns the JSX layout for this render state.
  return (
    <footer className="bg-slate-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 text-xl font-bold mb-2">
              <Image src="/logowhite.png" alt="EduTrail Logo" width={100} height={50} />
            </Link>
            <p className="text-gray-400 text-sm max-w-xs">
              Learn the courses you need without any hassle
            </p>
          </div>

          {/* Links */}
          <div className="flex justify-end">
            <div className="text-right">
              <h3 className="font-semibold mb-3">CONTACT US</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="/feedback" className="hover:text-white transition">
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700 pt-8">
          <p className="text-center text-sm text-gray-400">
            EduTrail. Copyright © 2026. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
