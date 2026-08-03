export default function Loading() {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="glass flex flex-col items-center gap-3 rounded-3xl px-10 py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-sky-400" />
        <p className="text-sm text-white/40">Loading…</p>
      </div>
    </div>
  );
}
