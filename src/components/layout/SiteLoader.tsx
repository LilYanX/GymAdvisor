"use client";

import { useEffect, useState } from "react";
import { HeartRateWave } from "@/components/layout/HeartRateWave";

const STORAGE_KEY = "ga-splash-seen";
const MIN_VISIBLE_MS = 900;
const MAX_WAIT_MS = 3000;

export function SiteLoader() {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY)) {
      setVisible(false);
      return;
    }

    const startedAt = Date.now();
    let finished = false;

    const dismiss = () => {
      if (finished) return;
      finished = true;

      const remaining = Math.max(0, MIN_VISIBLE_MS - (Date.now() - startedAt));
      window.setTimeout(() => {
        setExiting(true);
        window.setTimeout(() => {
          sessionStorage.setItem(STORAGE_KEY, "1");
          setVisible(false);
        }, 400);
      }, remaining);
    };

    if (document.readyState === "complete") {
      dismiss();
    } else {
      window.addEventListener("load", dismiss, { once: true });
    }

    const safety = window.setTimeout(dismiss, MAX_WAIT_MS);

    return () => {
      finished = true;
      window.clearTimeout(safety);
      window.removeEventListener("load", dismiss);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-live="polite"
      aria-busy={!exiting}
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-ga-bg transition-opacity duration-400 ${
        exiting ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex w-full max-w-xl flex-col items-center px-8">
        <HeartRateWave />
        <p className="mt-8 text-lg font-medium tracking-wide text-ga-fg">Chargement</p>
      </div>
    </div>
  );
}
