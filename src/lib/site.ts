/** URL publique de l’app (prod). */
export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export const SITE_NAME = "GymAdvisor";
export const SITE_DESCRIPTION =
  "Suivi de coachings sportifs à distance pour coachs et sportifs.";
