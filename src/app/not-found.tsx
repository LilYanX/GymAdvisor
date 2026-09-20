import Link from "next/link";
import { Logo } from "@/components/icons";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <Logo />
      <p className="mt-8 text-sm font-medium uppercase tracking-wide text-ga-muted">
        Erreur 404
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        Page introuvable
      </h1>
      <p className="mt-3 max-w-md text-sm text-ga-muted">
        Ce lien n’existe pas ou la page a été déplacée.
      </p>
      <Link
        href="/login"
        className="mt-8 rounded-lg bg-ga-lime px-4 py-2.5 text-sm font-semibold text-black hover:bg-lime-300"
      >
        Retour à la connexion
      </Link>
    </main>
  );
}
