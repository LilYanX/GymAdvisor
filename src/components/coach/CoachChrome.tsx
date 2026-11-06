"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/coach/Sidebar";

const STORAGE_KEY = "ga.coach.sidebar.collapsed";

export function CoachChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "1" || stored === "0") {
        setCollapsed(stored === "1");
      } else {
        setCollapsed(pathname.startsWith("/editeur"));
      }
    } catch {
      setCollapsed(pathname.startsWith("/editeur"));
    }
    setReady(true);
  }, [pathname]);

  function toggle() {
    setCollapsed((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  return (
    <div className="flex h-screen overflow-hidden bg-ga-bg">
      <Sidebar
        collapsed={ready ? collapsed : false}
        onToggle={toggle}
      />
      <div
        className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden transition-[margin] duration-200 ${
          ready && collapsed ? "ml-14" : "ml-60"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
