export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatDate(date?: string): string {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function qualityShort(q?: string): string | null {
  if (!q) return null;
  const s = q.toUpperCase().replace(/\s+/g, "_");
  if (s === "HI_RES_LOSSLESS" || s === "HIRES") return "HI-RES";
  if (s === "LOSSLESS") return "LOSSLESS";
  if (s === "HIGH") return "HIGH";
  if (s === "LOSSY" || s === "LOW") return "LOSSY";
  return s.replace(/_/g, " ");
}

export function qualityClass(q?: string): string {
  const s = (q ?? "").toUpperCase();
  if (s.startsWith("HI_RES"))
    return "border-yellow-300/60 bg-gradient-to-r from-yellow-400/25 via-amber-300/20 to-yellow-400/25 text-yellow-200 shadow-[0_0_12px_rgba(250,204,21,0.35)]";
  if (s === "LOSSLESS") return "border-white/15 bg-white/5 text-white/45";
  if (s === "HIGH") return "border-white/15 bg-white/5 text-white/45";
  if (s === "LOSSY" || s === "LOW") return "border-white/10 bg-white/5 text-white/30";
  return "border-white/15 bg-white/5 text-white/50";
}
