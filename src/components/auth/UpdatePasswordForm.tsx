"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/icons";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useLoadingActive } from "@/components/layout/LoadingProvider";

export function UpdatePasswordForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  useLoadingActive(pending);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setPending(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setPending(false);
      setError(updateError.message);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    router.push(profile?.role === "coach" ? "/" : "/app");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex items-start justify-between gap-4">
          <Logo />
          <ThemeToggle />
        </div>
        <h1 className="mt-8 text-2xl font-semibold">Nouveau mot de passe</h1>
        <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
          <label className="text-sm">
            <span className="mb-1.5 block text-ga-muted">Nouveau mot de passe</span>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full rounded-lg border border-ga-border bg-ga-card px-3 py-2 outline-none focus:border-ga-lime"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1.5 block text-ga-muted">Confirmer</span>
            <input
              name="confirm"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full rounded-lg border border-ga-border bg-ga-card px-3 py-2 outline-none focus:border-ga-lime"
            />
          </label>
          {error ? <p className="text-sm text-ga-red">{error}</p> : null}
          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded-lg bg-ga-lime px-4 py-2.5 text-sm font-semibold text-black hover:bg-lime-300 disabled:opacity-60"
          >
            {pending ? "…" : "Enregistrer"}
          </button>
        </form>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm text-ga-muted hover:text-ga-fg"
        >
          Retour à la connexion
        </Link>
      </div>
    </main>
  );
}
