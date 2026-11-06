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

export function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 flex h-screen flex-col border-r border-ga-border bg-ga-panel transition-[width] duration-200 ${
        collapsed ? "w-14" : "w-60"
      }`}
    >
      <div
        className={`flex items-center gap-2 ${
          collapsed ? "justify-center px-2 py-4" : "justify-between px-4 py-4"
        }`}
      >
        {!collapsed ? <Logo /> : null}
        <button
          type="button"
          onClick={onToggle}
          title={collapsed ? "Afficher le menu" : "Masquer le menu"}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ga-border bg-ga-elevated text-sm text-ga-muted hover:text-ga-fg"
        >
          {collapsed ? "»" : "«"}
        </button>
      </div>
      <nav
        className={`flex flex-1 flex-col gap-1 ${
          collapsed ? "px-2" : "px-3"
        }`}
      >
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
              title={item.label}
              className={`flex items-center rounded-lg text-sm transition ${
                collapsed
                  ? "justify-center px-0 py-2.5"
                  : "gap-3 px-3 py-2.5"
              } ${
                active
                  ? "bg-ga-elevated text-ga-fg"
                  : "text-ga-muted hover:bg-ga-elevated/60 hover:text-ga-fg"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed ? item.label : null}
            </Link>
          );
        })}
      </nav>
      <div
        className={`border-t border-ga-border ${
          collapsed ? "px-2 py-3" : "px-4 py-4"
        }`}
      >
        <div
          className={`flex items-center gap-2 ${
            collapsed ? "flex-col" : "justify-between"
          }`}
        >
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
          {!collapsed ? <ThemeToggle /> : null}
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
