"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (window.location.protocol !== "https:" && window.location.hostname !== "localhost") return;
    navigator.serviceWorker.register("/sw.js").then((reg) => {
      reg.update().catch(() => {});
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        window.location.reload();
      });
    }).catch(() => {
      /* offline support is best-effort */
    });
  }, []);

  return null;
}