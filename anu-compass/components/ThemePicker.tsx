"use client";

import { useEffect, useRef, useState } from "react";

const THEMES = [
  {
    id: "warm",
    label: "Warm",
    description: "Amber & rose glow",
    swatch: "linear-gradient(135deg, #fbbf24 0%, #f472b6 100%)",
  },
  {
    id: "navy",
    label: "Navy",
    description: "Deep ocean cyan",
    swatch: "linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)",
  },
  {
    id: "forest",
    label: "Forest",
    description: "Emerald & teal",
    swatch: "linear-gradient(135deg, #10b981 0%, #2dd4bf 100%)",
  },
  {
    id: "pure",
    label: "Pure",
    description: "No decoration",
    swatch: "linear-gradient(135deg, #fafafa 0%, #d4d4d4 100%)",
  },
] as const;

type ThemeId = (typeof THEMES)[number]["id"];

const DEFAULT_THEME: ThemeId = "warm";
const STORAGE_KEY = "anu-compass:theme";

export default function ThemePicker() {
  const [theme, setTheme] = useState<ThemeId>(DEFAULT_THEME);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const current = document.documentElement.getAttribute(
      "data-theme",
    ) as ThemeId | null;
    if (current && THEMES.some((t) => t.id === current)) {
      setTheme(current);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function pick(id: ThemeId) {
    setTheme(id);
    document.documentElement.setAttribute("data-theme", id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // ignore quota / disabled storage
    }
    setOpen(false);
  }

  const current = THEMES.find((t) => t.id === theme)!;

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Theme: ${current.label}. Click to change.`}
        title={`Theme: ${current.label}`}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-black/5 dark:ring-white/10 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-xl shadow-sm hover:bg-white dark:hover:bg-neutral-800/80 transition"
      >
        <span
          aria-hidden
          className="inline-block h-4 w-4 rounded-full ring-1 ring-inset ring-black/10 dark:ring-white/10"
          style={{ background: current.swatch }}
        />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 z-20 w-52 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-1 shadow-xl"
        >
          {THEMES.map((t) => {
            const selected = t.id === theme;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => pick(t.id)}
                role="menuitemradio"
                aria-checked={selected}
                className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition ${
                  selected
                    ? "bg-neutral-100 dark:bg-neutral-800"
                    : "hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
                }`}
              >
                <span
                  aria-hidden
                  className={`inline-block h-5 w-5 rounded-full flex-none ${
                    selected
                      ? "ring-2 ring-neutral-900 dark:ring-neutral-100 ring-offset-2 ring-offset-white dark:ring-offset-neutral-900"
                      : "ring-1 ring-inset ring-black/10 dark:ring-white/10"
                  }`}
                  style={{ background: t.swatch }}
                />
                <span className="flex-1">
                  <span
                    className={`block text-sm ${
                      selected
                        ? "font-semibold text-neutral-900 dark:text-neutral-50"
                        : "font-medium text-neutral-700 dark:text-neutral-300"
                    }`}
                  >
                    {t.label}
                  </span>
                  <span className="block text-xs text-neutral-500 dark:text-neutral-400">
                    {t.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
