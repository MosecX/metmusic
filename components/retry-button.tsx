"use client";

import { useRouter } from "next/navigation";
import { IconRefresh } from "@/components/icons";

export function RetryButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.refresh()}
      className="glass glass-hover flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium text-white"
    >
      <IconRefresh className="h-4 w-4" />
      Retry
    </button>
  );
}
