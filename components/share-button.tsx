"use client";

import { useState } from "react";
import { IconShare } from "@/components/icons";

export function ShareButton({
  title,
  url,
  size = "md",
  iconOnly = false,
  className = "",
}: {
  title: string;
  url?: string;
  size?: "sm" | "md";
  iconOnly?: boolean;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareUrl = url ?? window.location.href;
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

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    void handleShare();
  };

  if (iconOnly) {
    const iconCls = size === "sm" ? "h-6 w-6" : "h-7 w-7";
    const boxCls = size === "sm" ? "h-8 w-8" : "h-9 w-9";
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label="Share"
        title="Share"
        className={`relative z-10 flex ${boxCls} shrink-0 items-center justify-center rounded-full border border-white/15 transition ${className} ${
          copied
            ? "border-emerald-400/50 bg-emerald-400/20 text-emerald-300"
            : "bg-black/40 text-white/70 hover:bg-white/20 hover:text-white"
        }`}
      >
        <IconShare className={iconCls} />
      </button>
    );
  }

  const sizeCls = size === "sm" ? "h-8 px-3 text-xs" : "h-11 px-4 text-sm";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Share"
      className={`flex shrink-0 items-center gap-2 rounded-full border border-white/15 bg-white/10 font-semibold text-white/80 backdrop-blur transition hover:bg-white/20 hover:text-white ${sizeCls}`}
    >
      <IconShare className={size === "sm" ? "h-3.5 w-3.5" : "h-4.5 w-4.5"} />
      {copied ? "Copied!" : "Share"}
    </button>
  );
}