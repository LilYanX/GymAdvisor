"use client";

import { type FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/icons";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useLoading } from "@/components/layout/LoadingProvider";

type Mode = "login" | "reset";

export function LoginForm() {
  const router = useRouter();
  const { setLoading } = useLoading();
  const searchParams = useSearchParams();
  const authError = searchParams.get("error");

  const [mode, setMode] = useState<Mode>("login");
  const [error, setError] = useState<string | null>(
    authError === "reinitialisation"
      ? "Le lien de réinitialisation est invalide ou expiré. Refais une demande."
      : null,
  );
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function redirectByRole(userId: string) {
    const supabase = createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();
    router.push(profile?.role === "coach" ? "/" : "/app");
    router.refresh();
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setPending(true);
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const supabase = createClient();

    try {
      if (mode === "reset") {
        const redirectTo = `${window.location.origin}/auth/callback?next=/login/nouveau-mot-de-passe`;
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
          email,
          { redirectTo },
        );
        if (resetError) {
          setError(resetError.message);
          return;
        }
        setInfo(
          "Si un compte existe avec cet e-mail, tu recevras un lien pour choisir un nouveau mot de passe.",
        );
        return;
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError || !data.user) {
        setError("E-mail ou mot de passe incorrect.");
        return;
      }
      await redirectByRole(data.user.id);
    } finally {
      setPending(false);
      setLoading(false);
    }
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setInfo(null);
  }

  const title = mode === "login" ? "Connexion" : "Mot de passe oublié";

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex items-start justify-between gap-4">
          <Logo />
          <ThemeToggle />
        </div>
        <h1 className="mt-8 text-2xl font-semibold">{title}</h1>
        <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
          <label className="text-sm">
            <span className="mb-1.5 block text-ga-muted">E-mail</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-lg border border-ga-border bg-ga-card px-3 py-2 outline-none focus:border-ga-lime"
            />
          </label>
          {mode === "login" ? (
            <label className="text-sm">
              <span className="mb-1.5 block text-ga-muted">Mot de passe</span>
              <input
                name="password"
                type="password"
                required
                minLength={6}
                autoComplete="current-password"
                className="w-full rounded-lg border border-ga-border bg-ga-card px-3 py-2 outline-none focus:border-ga-lime"
              />
            </label>
          ) : null}
          {mode === "login" ? (
            <button
              type="button"
              onClick={() => switchMode("reset")}
              className="-mt-1 self-start text-sm text-ga-muted hover:text-ga-fg"
            >
              Mot de passe oublié ?
            </button>
          ) : null}
          {error ? <p className="text-sm text-ga-red">{error}</p> : null}
          {info ? <p className="text-sm text-ga-lime">{info}</p> : null}
          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded-lg bg-ga-lime px-4 py-2.5 text-sm font-semibold text-black hover:bg-lime-300 disabled:opacity-60"
          >
            {pending ? "…" : mode === "login" ? "Se connecter" : "Envoyer le lien"}
          </button>
        </form>
        {mode === "reset" ? (
          <div className="mt-6 text-sm">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className="text-left text-ga-muted hover:text-ga-fg"
            >
              Retour à la connexion
            </button>
          </div>
        ) : null}
      </div>
    </main>
  );
}
