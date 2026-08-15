"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { IconSearch } from "@/components/icons";

export function SearchBox({
  initial = "",
  autoFocus = false,
  className = "",
}: {
  initial?: string;
  autoFocus?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const lastTypedAt = useRef(0);

  useEffect(() => {
    if (Date.now() - lastTypedAt.current > 400) {
      setValue(initial);
    }
  }, [initial]);

  useEffect(() => {
    const t = setTimeout(() => {
      const q = value.trim();
      if (q) {
        router.replace(`/search?q=${encodeURIComponent(q)}`, { scroll: false });
      }
    }, 400);
    return () => clearTimeout(t);
  }, [value, router]);

  return (
    <div className={`relative ${className}`}>
      <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
      <label htmlFor="search-box" className="sr-only">
        Search
      </label>
      <input
        id="search-box"
        type="search"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => {
          lastTypedAt.current = Date.now();
          setValue(e.target.value);
        }}
        placeholder="Search tracks, albums, artists..."
        className="glass h-12 w-full rounded-full pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-white/40 focus:bg-white/10"
      />
    </div>
  );
}
