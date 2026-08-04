import Link from "next/link";
import { NavButtons } from "@/components/nav-buttons";
import { IconHome, IconLibrary, IconSearch, IconSparkle } from "@/components/icons";

const links = [
  { href: "/", label: "Home", icon: IconHome },
  { href: "/search", label: "Search", icon: IconSearch },
  { href: "/mix", label: "My Mix", icon: IconSparkle },
  { href: "/library", label: "Library", icon: IconLibrary },
];

export default function Sidebar() {
  return (
    <aside className="glass slide-in-left fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-white/10 p-4 lg:flex">
      <div className="mb-6 flex items-center justify-between px-2">
        <Link href="/" className="flex items-center gap-2">
          <span className="logo-grad flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 text-black shadow-lg shadow-fuchsia-500/30">
            <IconSparkle className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold tracking-tight text-white">
            MetMusic
          </span>
        </Link>
        <NavButtons />
      </div>

      <nav className="flex flex-col gap-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            <link.icon className="h-5 w-5" />
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="mt-8 flex-1" />

      <div className="glass-soft rounded-2xl p-4">
        <p className="text-xs leading-relaxed text-white/50">
          HiFi streaming through the ez-hifi-api proxy. Educational use only.
        </p>
      </div>
    </aside>
  );
}
