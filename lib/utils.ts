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

export function mediaTags(tags?: string[] | string | null): string[] {
  if (!tags) return [];
  const list = Array.isArray(tags) ? tags : [tags];
  return list.map((t) => String(t).trim().toUpperCase()).filter(Boolean);
}

export interface BadgeMeta {
  label: string;
  cls: string;
}

export function albumBadges(a: {
  type?: string;
  audioQuality?: string;
  audioModes?: string[];
  mediaMetadata?: { tags?: string[] | string | null } | null;
}): BadgeMeta[] {
  const badges: BadgeMeta[] = [];
  const tags = mediaTags(a.mediaMetadata?.tags);
  const modes = (a.audioModes ?? []).map((m) => m.toUpperCase());

  if (modes.includes("DOLBY_ATMOS") || tags.includes("DOLBY_ATMOS")) {
    badges.push({
      label: "ATMOS",
      cls: "border-cyan-300/50 bg-cyan-400/15 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.35)]",
    });
  }
  if (tags.includes("HIRES_LOSSLESS") || (a.audioQuality ?? "").toUpperCase().startsWith("HI_RES")) {
    badges.push({
      label: "HI-RES",
      cls: "border-yellow-300/60 bg-gradient-to-r from-yellow-400/25 via-amber-300/20 to-yellow-400/25 text-yellow-200 shadow-[0_0_12px_rgba(250,204,21,0.35)]",
    });
  }
  if (!badges.length && (a.audioQuality ?? "").toUpperCase() === "LOSSLESS") {
    badges.push({
      label: "LOSSLESS",
      cls: "border-white/15 bg-white/5 text-white/50",
    });
  }
  if (a.type === "SINGLE" && !a.audioQuality) {
    badges.push({ label: "SINGLE", cls: "border-white/10 bg-white/5 text-white/40" });
  }
  return badges;
}

export function albumTypeLabel(type?: string): string {
  switch (type) {
    case "ALBUM":
      return `${type.slice(0, 1)}${type.slice(1).toLowerCase()}`;
    case "SINGLE":
      return "Single";
    case "EP":
      return "EP";
    default:
      return type ?? "";
  }
}
