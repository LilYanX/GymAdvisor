"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export const COOKIE_CONSENT_KEY = "ga_cookie_consent";

export type CookieConsent = "accepted" | "refused";

export function readCookieConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(COOKIE_CONSENT_KEY);
  if (value === "accepted" || value === "refused") return value;
  return null;
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(readCookieConsent() == null);
  }, []);

  function choose(value: CookieConsent) {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, value);
    window.dispatchEvent(
      new CustomEvent("ga-cookie-consent", { detail: value }),
    );
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Consentement cookies"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-ga-border bg-ga-card/95 p-4 shadow-[0_-8px_30px_rgba(0,0,0,0.35)] backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 text-sm text-ga-muted">
          <p className="font-medium text-ga-fg">Cookies & confidentialité</p>
          <p className="mt-1 leading-relaxed">
            Nous utilisons des cookies essentiels pour la connexion. La mesure
            d’audience n’est activée qu’avec votre accord.{" "}
            <Link href="/rgpd" className="text-ga-lime hover:underline">
              En savoir plus
            </Link>
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => choose("refused")}
            className="rounded-lg border border-ga-border px-3 py-2 text-sm text-ga-muted hover:text-ga-fg"
          >
            Refuser
          </button>
          <button
            type="button"
            onClick={() => choose("accepted")}
            className="rounded-lg bg-ga-lime px-3 py-2 text-sm font-semibold text-black hover:bg-lime-300"
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  );
}
