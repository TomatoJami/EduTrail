'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

/** Renders the account sidebar interface. */
export function AccountSidebar() {
  const router = useRouter();
  const pathname = usePathname();

  // Returns the JSX layout for this render state.
  return (
    <aside className="w-full border-b border-gray-200 bg-white md:w-56 md:shrink-0 md:border-b-0 md:border-r">
      <div className="h-full px-4 py-5 flex flex-col">
        {/* Back Button */}
        <button
          onClick={() => router.push('/')}
          className="mb-4 flex items-center gap-2 self-start text-gray-600 hover:text-gray-900 font-medium transition md:mb-6"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Settings Section */}
        <p className="mb-3 text-xs font-semibold text-center uppercase tracking-[0.2em] text-gray-400">Settings</p>

        <nav aria-label="Settings navigation" className="flex gap-2 md:flex-col">
          <Link
            href="/account"
            className={[
              'flex items-center gap-3 rounded-md border px-3 py-2 text-sm transition',
              pathname === '/account'
                ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                : 'border-transparent text-[#757D88] hover:border-gray-200 hover:bg-gray-50 hover:text-gray-900',
            ].join(' ')}
          >
            <svg className="h-6 w-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>My Account</span>
          </Link>

          <Link
            href="/account/preferences"
            className={[
              'flex items-center gap-3 rounded-md border px-3 py-2 text-sm transition',
              pathname === '/account/preferences'
                ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                : 'border-transparent text-[#757D88] hover:border-gray-200 hover:bg-gray-50 hover:text-gray-900',
            ].join(' ')}
          >
            <svg className="h-6 w-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Preferences</span>
          </Link>
        </nav>
      </div>
    </aside>
  );
}
