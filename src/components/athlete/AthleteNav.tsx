"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconCalendar, IconDumbbell, IconHome, IconUser } from "@/components/icons";

const ITEMS = [
  { href: "/app", label: "Accueil", icon: IconHome },
  { href: "/app/programme", label: "Programme", icon: IconCalendar },
  { href: "/app/seance", label: "Séance", icon: IconDumbbell },
  { href: "/app/moi", label: "Profil", icon: IconUser },
];

export function AthleteNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-ga-border bg-ga-panel">
      <div className="mx-auto flex h-14 w-full max-w-md">
        {ITEMS.map((item) => {
          const active =
            item.href === "/app"
              ? pathname === "/app"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] ${
                active ? "text-ga-lime" : "text-ga-muted"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
