"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { App } from "@capacitor/app";

const APP_ROUTE_RE = /^\/(album|artist|track|playlist|mix|search|library)(\/|$)/;

export function DeepLinkHandler() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!window.Capacitor?.isNativePlatform?.()) return;

    const navigate = (url?: string) => {
      if (!url) return;
      let parsed: URL;
      try {
        parsed = new URL(url);
      } catch {
        return;
      }
      if (parsed.hostname && parsed.hostname !== "metmusic.qzz.io") return;
      const path = parsed.pathname + parsed.search;
      if (!APP_ROUTE_RE.test(path)) return;
      if (path !== pathname) router.push(path);
    };

    void App.getLaunchUrl().then((launch) => navigate(launch?.url));

    const listener = App.addListener("appUrlOpen", ({ url }) => navigate(url));

    return () => {
      void listener.then((h) => h.remove());
    };
  }, [pathname, router]);

  return null;
}