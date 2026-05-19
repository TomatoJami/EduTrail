import Link from "next/link";

/** Renders the not found interface. */
export default function NotFound() {
  // Returns the JSX layout for this render state.
  return (
    <main className="flex-1 min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 flex items-center justify-center">
      <div className="text-center px-4">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-indigo-600 mb-2">404</h1>
          <h2 className="text-4xl font-bold text-slate-800 mb-4">Page Not Found</h2>
          <p className="text-lg text-slate-600 mb-8">
            Sorry, the page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </main>
  );
}
