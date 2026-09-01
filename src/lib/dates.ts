const PARIS = "Europe/Paris";

export function todayISO(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: PARIS }).format(
    new Date(),
  );
}

export function firstOfMonthISO(): string {
  return `${todayISO().slice(0, 7)}-01`;
}

export function isoWeekday(isoDate: string = todayISO()): number {
  const [year, month, day] = isoDate.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  const dayOfWeek = utc.getUTCDay();
  return dayOfWeek === 0 ? 7 : dayOfWeek;
}

export function formatHeaderDate(isoDate: string = todayISO()): string {
  const date = parseISODate(isoDate);
  const weekday = new Intl.DateTimeFormat("fr-FR", { weekday: "long" }).format(
    date,
  );
  const dayMonth = new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
  return `${capitalize(weekday)} ${dayMonth}`;
}

export function formatDayMonth(isoDate: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
  }).format(parseISODate(isoDate));
}

export function formatFeedbackDate(iso: string | null): string {
  if (!iso) return "-";
  return formatDayMonth(iso);
}

export function formatWeekdayLong(isoDate: string): string {
  return capitalize(
    new Intl.DateTimeFormat("fr-FR", { weekday: "long" }).format(
      parseISODate(isoDate),
    ),
  );
}

export function currentMonthLabel(): string {
  return new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    timeZone: PARIS,
  }).format(new Date());
}

function parseISODate(isoDate: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function yesterdayISO(): string {
  return addDaysISO(todayISO(), -1);
}

export function addDaysISO(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function mondayOfWeekISO(isoDate: string = todayISO()): string {
  return addDaysISO(isoDate, 1 - isoWeekday(isoDate));
}

export function formatPeriodLabel(periodStart: string): string {
  const [year, month] = periodStart.split("-").map(Number);
  return capitalize(
    new Intl.DateTimeFormat("fr-FR", {
      month: "long",
      year: "numeric",
    }).format(new Date(year, month - 1, 1)),
  );
}

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
