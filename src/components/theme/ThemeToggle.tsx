"use client";

import { useEffect, useState } from "react";
import { THEME_STORAGE_KEY } from "@/lib/theme";

export type Theme = "dark" | "light";

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("light", theme === "light");
  document.documentElement.style.colorScheme = theme;
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const isLight = theme === "light";

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    const next: Theme = stored === "light" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  }, []);

  function toggle() {
    const next: Theme = isLight ? "dark" : "light";
    setTheme(next);
    window.localStorage.setItem(THEME_STORAGE_KEY, next);
    applyTheme(next);
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isLight}
      aria-label={isLight ? "Mode clair activé" : "Mode sombre activé"}
      onClick={toggle}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors ${
        isLight
          ? "border-amber-300/70 bg-amber-100"
          : "border-ga-border bg-[#2a2a32]"
      } ${className}`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full shadow-sm transition-transform ${
          isLight
            ? "translate-x-[1.375rem] bg-ga-fg"
            : "translate-x-1 bg-[#f4f4f5]"
        }`}
      />
    </button>
  );
}
