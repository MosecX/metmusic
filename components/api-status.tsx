import { checkApiHealth, type ApiHealth } from "@/lib/tidal";
import { IconAlert } from "@/components/icons";
import { RetryButton } from "@/components/retry-button";

export default async function ApiStatusBanner({
  health,
}: {
  health?: ApiHealth;
}) {
  const status = health ?? (await checkApiHealth());
  if (status.online) return null;

  const hasError = status.error !== null;

  return (
    <section role="alert" className="glass relative mb-10 overflow-hidden rounded-3xl">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-40 blur-2xl max-lg:blur-lg"
        style={{
          backgroundImage:
            "radial-gradient(circle at 25% 25%, rgba(244,63,94,0.35), transparent 60%)",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#07070b]/80 via-[#07070b]/40 to-transparent" />
      <div className="relative flex flex-col gap-6 p-6 md:flex-row md:items-center md:gap-8 md:p-10">
        <div className="shrink-0">
          <div className="flex h-40 w-40 items-center justify-center rounded-2xl bg-red-500/10 ring-1 ring-red-500/25 md:h-48 md:w-48">
            <IconAlert className="h-16 w-16 text-red-400" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-red-400/80">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-red-500" />
            API status
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            Music API unavailable
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/60">
            {hasError
              ? `The music streaming API responded with an error (${status.error}). Content can't be loaded right now.`
              : "We couldn't reach the music streaming API. Check the provider status and try again in a moment."}
          </p>
          <div className="mt-6 flex items-center gap-4">
            <RetryButton />
          </div>
        </div>
      </div>
    </section>
  );
}