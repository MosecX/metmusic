"use client";

export function LyricsPreview({ text }: { text: string }) {
  return (
    <div>
      <div className="max-h-72 overflow-y-auto rounded-2xl glass-soft p-6">
        <p className="whitespace-pre-line text-sm leading-relaxed text-white/80">{text}</p>
      </div>
      <p className="mt-2 text-xs text-white/40">
        Preview — synced lyrics are available while playing, in the player
      </p>
    </div>
  );
}
