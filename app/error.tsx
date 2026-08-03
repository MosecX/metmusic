"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="glass-strong rounded-3xl p-8">
        <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
        <p className="mt-1 text-sm text-white/50">
          {error.message || "The music API could not be reached."}
        </p>
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:opacity-90"
        >
          Try again
        </button>
        <Link
          href="/"
          className="glass glass-hover rounded-full px-5 py-2.5 text-sm font-medium text-white"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
