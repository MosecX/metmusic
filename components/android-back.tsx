"use client";

import { useEffect } from "react";
import { App } from "@capacitor/app";

export function AndroidBackHandler() {
  useEffect(() => {
    if (!window.Capacitor?.isNativePlatform?.()) return;

    const listener = App.addListener("backButton", ({ canGoBack }) => {
      const openDialog = document.querySelector<HTMLDialogElement>("dialog[open]");
      if (openDialog) {
        openDialog.close();
        return;
      }
      if (canGoBack || window.history.length > 1) {
        window.history.back();
      } else {
        void App.minimizeApp();
      }
    });

    return () => {
      void listener.then((h) => h.remove());
    };
  }, []);

  return null;
}