"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IconShare } from "@/components/icons";

export type MenuItem = {
  label: string;
  icon?: React.ReactNode;
  danger?: boolean;
  onSelect: () => void;
};

export type MenuState = { x: number; y: number; open: boolean };

export function useContextMenu() {
  const [menu, setMenu] = useState<MenuState>({ x: 0, y: 0, open: false });

  const openAt = useCallback((x: number, y: number) => {
    setMenu({ x, y, open: true });
  }, []);

  const openFromEvent = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ x: e.clientX, y: e.clientY, open: true });
  }, []);

  const close = useCallback(() => {
    setMenu((m) => ({ ...m, open: false }));
  }, []);

  return { menu, openAt, openFromEvent, close };
}

export async function doShare(title: string, url: string) {
  if (navigator.share) {
    try {
      await navigator.share({ title, text: title, url });
    } catch {
      /* user cancelled */
    }
    return;
  }
  try {
    await navigator.clipboard.writeText(url);
  } catch {
    /* clipboard unavailable */
  }
}

export function ContextMenu({
  menu,
  items,
  onClose,
}: {
  menu: MenuState;
  items: MenuItem[];
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu.open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menu.open, onClose]);

  if (!menu.open) return null;

  const menuWidth = 192;
  const menuHeight = items.length * 40 + 12;
  const left = Math.max(8, Math.min(menu.x, window.innerWidth - menuWidth - 8));
  const top = Math.max(8, Math.min(menu.y, window.innerHeight - menuHeight - 8));

  const menuEl = (
    <div
      ref={ref}
      role="menu"
      onClick={(e) => e.stopPropagation()}
      className="fixed z-[60] min-w-48 overflow-hidden rounded-xl border border-white/10 bg-[#0e0e15]/95 p-1.5 shadow-2xl shadow-black/70 backdrop-blur-xl"
      style={{ left, top }}
    >
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          role="menuitem"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
            item.onSelect();
          }}
          className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-white/10 ${
            item.danger
              ? "text-red-400 hover:bg-red-400/10"
              : "text-white/80 hover:text-white"
          }`}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  );

  return createPortal(menuEl, document.body);
}

export function shareItem(title: string, url: string): MenuItem {
  return {
    label: "Share",
    icon: <IconShare className="h-4 w-4" />,
    onSelect: () => void doShare(title, url),
  };
}
