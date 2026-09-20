"use client";

import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/next";
import {
  COOKIE_CONSENT_KEY,
  readCookieConsent,
  type CookieConsent,
} from "@/components/legal/CookieBanner";

/**
 * Charge l’analytics uniquement après consentement cookies.
 * Sans consentement (ou refus), rien n’est envoyé.
 */
export function ConsentAnalytics() {
  const [consent, setConsent] = useState<CookieConsent | null>(null);

  useEffect(() => {
    setConsent(readCookieConsent());
    function onConsent(event: Event) {
      const detail = (event as CustomEvent<CookieConsent>).detail;
      setConsent(detail);
    }
    function onStorage(event: StorageEvent) {
      if (event.key === COOKIE_CONSENT_KEY) {
        setConsent(readCookieConsent());
      }
    }
    window.addEventListener("ga-cookie-consent", onConsent);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("ga-cookie-consent", onConsent);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  if (consent !== "accepted") return null;
  return <Analytics />;
}
