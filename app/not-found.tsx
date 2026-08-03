"use client";

import Link from "next/link";
import { IconArrowLeft, IconMusic } from "@/components/icons";

export default function NotFound() {
  return (
    <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="glass-strong flex flex-col items-center gap-3 rounded-3xl p-10">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-white/30">
          <IconMusic className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-white">Track not found</h1>
        <p className="max-w-sm text-sm text-white/50">
          The content you are looking for is unavailable or restricted in your region.
        </p>
      </div>
      <Link
        href="/"
        className="mt-2 flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:opacity-90"
      >
        <IconArrowLeft className="h-4 w-4" />
        Back home
      </Link>
    </div>
  );
}
