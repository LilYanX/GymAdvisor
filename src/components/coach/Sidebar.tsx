"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/actions/auth";
import {
  IconBell,
  IconEditor,
  IconLayout,
  IconLibrary,
  IconLogout,
  IconUsers,
  Logo,
  IconUser,
} from "@/components/icons";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const NAV = [
  { href: "/", label: "Tableau de bord", icon: IconLayout },
  { href: "/sportifs", label: "Sportifs", icon: IconUsers },
  { href: "/editeur", label: "Éditeur de programme", icon: IconEditor },
  { href: "/bibliotheque", label: "Bibliothèque", icon: IconLibrary },
  { href: "/paiements", label: "Paiements", icon: IconBell },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex h-screen w-60 flex-col border-r border-ga-border bg-ga-panel">
      <div className="px-5 py-5">
        <Logo />
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3">
        {NAV.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                active
                  ? "bg-ga-elevated text-ga-fg"
                  : "text-ga-muted hover:bg-ga-elevated/60 hover:text-ga-fg"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-ga-border px-4 py-4">
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/profil"
            title="Mon profil"
            className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${
              pathname === "/profil"
                ? "border-ga-lime bg-ga-lime/15 text-ga-lime"
                : "border-ga-border bg-ga-elevated text-ga-muted hover:text-ga-fg"
            }`}
          >
            <IconUser className="h-4 w-4" />
          </Link>
          <ThemeToggle />
          <form action={signOut}>
            <button
              type="submit"
              title="Se déconnecter"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-ga-border bg-ga-elevated text-ga-muted hover:text-ga-fg"
            >
              <IconLogout className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
