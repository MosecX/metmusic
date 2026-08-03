"use client";

import { useRouter } from "next/navigation";
import { IconArrowLeft, IconArrowRight } from "@/components/icons";

export function NavButtons({ className = "" }: { className?: string }) {
  const router = useRouter();

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="Back"
        className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
      >
        <IconArrowLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => router.forward()}
        aria-label="Forward"
        className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
      >
        <IconArrowRight className="h-5 w-5" />
      </button>
    </div>
  );
}
