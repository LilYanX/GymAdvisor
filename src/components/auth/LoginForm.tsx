"use client";

import { type FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/icons";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

type Mode = "login" | "signup" | "reset";

export function LoginForm() {
  const router = useRouter();
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

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const firstName = String(form.get("first_name") ?? "").trim();
    const supabase = createClient();

    if (mode === "reset") {
      const redirectTo = `${window.location.origin}/auth/callback?next=/login/nouveau-mot-de-passe`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        { redirectTo },
      );
      setPending(false);
      if (resetError) {
        setError(resetError.message);
        return;
      }
      setInfo(
        "Si un compte existe avec cet e-mail, tu recevras un lien pour choisir un nouveau mot de passe.",
      );
      return;
    }

    if (mode === "signup") {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { first_name: firstName } },
      });
      setPending(false);
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      if (!data.session) {
        setInfo("Compte créé. Vérifie tes e-mails puis connecte-toi.");
        setMode("login");
        return;
      }
      await redirectByRole(data.session.user.id);
      return;
    }

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setPending(false);
    if (signInError || !data.user) {
      setError("E-mail ou mot de passe incorrect.");
      return;
    }
    await redirectByRole(data.user.id);
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setInfo(null);
  }

  const title =
    mode === "login"
      ? "Connexion"
      : mode === "signup"
        ? "Créer mon espace"
        : "Mot de passe oublié";

  const subtitle =
    mode === "login"
      ? "Coach ou sportif - même écran, deux espaces."
      : mode === "signup"
        ? "Utilise l’e-mail que ton coach a enregistré."
        : "Saisis ton e-mail. Un lien te permettra de définir un nouveau mot de passe (coach ou sportif).";

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex items-start justify-between gap-4">
          <Logo />
          <ThemeToggle />
        </div>
        <h1 className="mt-8 text-2xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-ga-muted">{subtitle}</p>
        <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
          {mode === "signup" ? (
            <label className="text-sm">
              <span className="mb-1.5 block text-ga-muted">Prénom</span>
              <input
                name="first_name"
                required
                className="w-full rounded-lg border border-ga-border bg-ga-card px-3 py-2 outline-none focus:border-ga-lime"
              />
            </label>
          ) : null}
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
          {mode !== "reset" ? (
            <label className="text-sm">
              <span className="mb-1.5 block text-ga-muted">Mot de passe</span>
              <input
                name="password"
                type="password"
                required
                minLength={6}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
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
            {pending
              ? "…"
              : mode === "login"
                ? "Se connecter"
                : mode === "signup"
                  ? "Créer mon compte"
                  : "Envoyer le lien"}
          </button>
        </form>
        <div className="mt-6 flex flex-col gap-2 text-sm">
          {mode === "reset" ? (
            <button
              type="button"
              onClick={() => switchMode("login")}
              className="text-left text-ga-muted hover:text-ga-fg"
            >
              Retour à la connexion
            </button>
          ) : (
            <button
              type="button"
              onClick={() => switchMode(mode === "login" ? "signup" : "login")}
              className="text-left text-ga-muted hover:text-ga-fg"
            >
              {mode === "login"
                ? "Sportif ? Créer mon espace"
                : "Déjà un compte ? Se connecter"}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
