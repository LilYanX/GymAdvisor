import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/icons";

export function LegalPageShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-5 py-10">
      <div className="flex items-center justify-between gap-4">
        <Link href="/login" className="inline-flex" aria-label="GymAdvisor — connexion">
          <Logo />
        </Link>
        <Link
          href="/login"
          className="rounded-lg bg-ga-lime px-3 py-2 text-sm font-semibold text-black hover:bg-lime-300"
        >
          Connexion
        </Link>
      </div>
      <h1 className="mt-10 text-3xl font-semibold tracking-tight">{title}</h1>
      <div className="prose-legal mt-8 space-y-4 text-sm leading-relaxed text-ga-muted [&_h2]:mt-8 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-ga-fg [&_strong]:text-ga-fg [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
        {children}
      </div>
      <p className="mt-12 border-t border-ga-border pt-6 text-xs text-ga-muted">
        <Link href="/cgu" className="hover:text-ga-fg">
          CGU
        </Link>
        {" · "}
        <Link href="/rgpd" className="hover:text-ga-fg">
          Confidentialité
        </Link>
        {" · "}
        <Link href="/login" className="hover:text-ga-fg">
          Connexion
        </Link>
      </p>
    </main>
  );
}
