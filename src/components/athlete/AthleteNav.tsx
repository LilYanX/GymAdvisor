"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconCalendar, IconHome, IconUser } from "@/components/icons";

const ITEMS = [
  { href: "/app", label: "Accueil", icon: IconHome },
  { href: "/app/programme", label: "Programme", icon: IconCalendar },
  { href: "/app/moi", label: "Profil", icon: IconUser },
];

export function AthleteNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-ga-border bg-ga-panel pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex h-20 w-full max-w-2xl">
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
              className={`flex flex-1 flex-col items-center justify-center gap-1.5 text-sm font-medium ${
                active ? "text-ga-lime" : "text-ga-muted"
              }`}
            >
              <Icon className="h-8 w-8 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
