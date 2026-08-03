import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import Sidebar from "@/components/sidebar";
import { PlayerBar, PlayerProvider } from "@/components/player";
import { IconHome, IconLibrary, IconSearch, IconSparkle } from "@/components/icons";

export const metadata: Metadata = {
  title: "MetMusic — HiFi Streaming",
  description: "A Tidal-inspired web player powered by the ez-hifi-api proxy.",
};

const MOBILE_LINKS = [
  { href: "/", label: "Home", icon: IconHome },
  { href: "/search", label: "Search", icon: IconSearch },
  { href: "/library", label: "Library", icon: IconLibrary },
  { href: "/mix", label: "Mix", icon: IconSparkle },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="relative min-h-full bg-[#07070b] text-zinc-100">
        {/* Aurora background */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        >
          <div className="absolute -left-40 -top-40 h-[36rem] w-[36rem] rounded-full bg-cyan-500/20 blur-[130px]" />
          <div className="absolute -right-32 top-1/4 h-[32rem] w-[32rem] rounded-full bg-fuchsia-500/15 blur-[130px]" />
          <div className="absolute -bottom-40 left-1/3 h-[34rem] w-[34rem] rounded-full bg-indigo-500/15 blur-[130px]" />
          <div className="absolute right-1/4 top-2/3 h-[20rem] w-[20rem] rounded-full bg-violet-500/10 blur-[100px]" />
        </div>

        <PlayerProvider>
          {/* Mobile top bar */}
          <header className="glass-strong sticky top-0 z-30 flex items-center justify-between px-4 py-3 lg:hidden">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 text-black shadow-lg shadow-fuchsia-500/30">
                <IconSparkle className="h-5 w-5" />
              </span>
              <span className="text-base font-bold tracking-tight text-white">MetMusic</span>
            </Link>
            <nav className="flex items-center gap-1">
              {MOBILE_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-label={link.label}
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                  <link.icon className="h-5 w-5" />
                </Link>
              ))}
            </nav>
          </header>

          <div className="relative z-10">
            <Sidebar />
            <div className="lg:pl-60">
              <main className="mx-auto max-w-7xl px-4 pb-32 pt-6 md:px-8 lg:pt-10">
                {children}
              </main>
            </div>
          </div>
          <PlayerBar />
        </PlayerProvider>
      </body>
    </html>
  );
}
