"use client";

import { useState } from "react";
import { IconShare } from "@/components/icons";

export function ShareButton({
  title,
  size = "md",
}: {
  title: string;
  size?: "sm" | "md";
}) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, text: title, url: shareUrl });
      } catch {
        /* user cancelled */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  const sizeCls = size === "sm" ? "h-8 px-3 text-xs" : "h-11 px-4 text-sm";

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label="Share"
      className={`flex shrink-0 items-center gap-2 rounded-full border border-white/15 bg-white/10 font-semibold text-white/80 backdrop-blur transition hover:bg-white/20 hover:text-white ${sizeCls}`}
    >
      <IconShare className={size === "sm" ? "h-3.5 w-3.5" : "h-4.5 w-4.5"} />
      {copied ? "Copied!" : "Share"}
    </button>
  );
}
