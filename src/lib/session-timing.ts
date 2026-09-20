/** Valeur pour <input type="datetime-local" /> en heure locale. */
export function toDatetimeLocalValue(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Parse une valeur datetime-local (YYYY-MM-DDTHH:mm) en Date locale. */
export function parseDatetimeLocal(value: string): Date | null {
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)) return null;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

/**
 * Durée en minutes entre deux ISO timestamptz.
 * Gère le cas overnight (ex. 23:00 → 00:30) tant que la fin est après le début.
 */
export function sessionDurationMinutes(
  startedAt: string | null | undefined,
  completedAt: string | null | undefined,
): number | null {
  if (!startedAt || !completedAt) return null;
  const start = new Date(startedAt).getTime();
  const end = new Date(completedAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return null;
  }
  return Math.max(1, Math.round((end - start) / 60_000));
}

/** UA séance = durée (min) × (RPE moyen / 10). */
export function sessionLoadUnits(
  durationMinutes: number,
  avgRpe: number,
): number {
  if (durationMinutes <= 0 || avgRpe <= 0) return 0;
  return Math.round(durationMinutes * (avgRpe / 10) * 10) / 10;
}

export function assertEndAfterStart(
  startedAt: string,
  completedAt: string,
): string | null {
  const start = new Date(startedAt).getTime();
  const end = new Date(completedAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return "Horaires invalides.";
  }
  if (end <= start) {
    return "L’heure de fin doit être après l’heure de début (y compris le lendemain si besoin).";
  }
  return null;
}
