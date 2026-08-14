import type { Metadata, Viewport } from "next";
import "./globals.css";
import Link from "next/link";
import Sidebar from "@/components/sidebar";
import { PlayerBar, PlayerProvider } from "@/components/player";
import { PwaRegister } from "@/components/pwa-register";
import { AndroidBackHandler } from "@/components/android-back";
import { NavButtons } from "@/components/nav-buttons";
import { IconHome, IconLibrary, IconSearch, IconSparkle } from "@/components/icons";

export const metadata: Metadata = {
  title: "MetMusic — HiFi Streaming",
  description: "A Tidal-inspired web player powered by the ez-hifi-api proxy.",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "MetMusic",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
  applicationName: "MetMusic",
};

export const viewport: Viewport = {
  themeColor: "#07070b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
        {/* Background */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_18%_0%,#152238_0%,#0a0a12_45%,#07070b_72%)]" />
          <div className="hidden lg:block">
            <div className="blob absolute -left-40 -top-40 h-[36rem] w-[36rem] rounded-full bg-cyan-500/20 blur-[130px]" />
            <div className="blob absolute -right-32 top-1/4 h-[32rem] w-[32rem] rounded-full bg-fuchsia-500/15 blur-[130px]" />
            <div className="blob absolute -bottom-40 left-1/3 h-[34rem] w-[34rem] rounded-full bg-indigo-500/15 blur-[130px]" />
            <div className="blob absolute right-1/4 top-2/3 h-[20rem] w-[20rem] rounded-full bg-violet-500/10 blur-[100px]" />
          </div>
        </div>

        <PlayerProvider>
          {/* Mobile top bar */}
          <header className="glass-strong slide-in-down sticky top-0 z-30 flex items-center justify-between gap-2 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] lg:hidden">
            <div className="flex min-w-0 items-center gap-1">
              <NavButtons />
              <Link href="/" className="flex shrink-0 items-center gap-2">
                <span className="logo-grad flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 text-black shadow-lg shadow-fuchsia-500/30">
                  <IconSparkle className="h-5 w-5" />
                </span>
                <span className="hidden text-base font-bold tracking-tight text-white sm:inline">
                  MetMusic
                </span>
              </Link>
            </div>
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
              <main className="mx-auto max-w-7xl px-4 pb-[calc(8rem+env(safe-area-inset-bottom))] pt-6 md:px-8 lg:pt-10">
                {children}
              </main>
            </div>
          </div>
          <PlayerBar />
          <PwaRegister />
          <AndroidBackHandler />
        </PlayerProvider>
      </body>
    </html>
  );
}
