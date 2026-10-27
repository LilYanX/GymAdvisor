"use client";

import { useMemo } from "react";
import { addDaysISO, capitalize, isoWeekday } from "@/lib/dates";

export type CalendarDayMarker = {
  /** Nombre d’activités libres ce jour (pastilles vertes). */
  activityCount?: number;
  /** Séance programmée non terminée. */
  hasPlannedSession?: boolean;
};

type Props = {
  /** Premier jour du mois affiché (YYYY-MM-01). */
  monthStart: string;
  onMonthChange: (monthStart: string) => void;
  selectedDate?: string | null;
  onSelectDate?: (date: string) => void;
  markers?: Record<string, CalendarDayMarker>;
  /** Affiche la légende activités / séances. */
  showLegend?: boolean;
  size?: "md" | "lg";
};

const WEEKDAY_HEADERS = ["L", "M", "M", "J", "V", "S", "D"];

function shiftMonth(monthStart: string, delta: number): string {
  const [year, month] = monthStart.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return date.toISOString().slice(0, 10);
}

function daysInMonth(monthStart: string): number {
  const [year, month] = monthStart.split("-").map(Number);
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function activityBadge(count: number): string {
  if (count <= 0) return "";
  if (count === 1) return "✓";
  if (count === 2) return "✓✓";
  if (count === 3) return "✓✓✓";
  return String(count);
}

export function MonthCalendar({
  monthStart,
  onMonthChange,
  selectedDate,
  onSelectDate,
  markers = {},
  showLegend = false,
  size = "md",
}: Props) {
  const selectable = typeof onSelectDate === "function";
  const large = size === "lg";

  const monthLabel = useMemo(() => {
    const [year, month] = monthStart.split("-").map(Number);
    return capitalize(
      new Intl.DateTimeFormat("fr-FR", {
        month: "long",
        year: "numeric",
      }).format(new Date(year, month - 1, 1)),
    );
  }, [monthStart]);

  const cells = useMemo(() => {
    const total = daysInMonth(monthStart);
    const startWeekday = isoWeekday(monthStart);
    const leading = startWeekday - 1;
    const result: Array<{ date: string | null; day: number | null }> = [];

    for (let i = 0; i < leading; i += 1) {
      result.push({ date: null, day: null });
    }
    for (let day = 1; day <= total; day += 1) {
      const date = addDaysISO(monthStart, day - 1);
      result.push({ date, day });
    }
    while (result.length % 7 !== 0) {
      result.push({ date: null, day: null });
    }
    return result;
  }, [monthStart]);

  return (
    <div
      className={`rounded-2xl border border-ga-border bg-ga-card ${
        large ? "p-4" : "p-3"
      }`}
    >
      <div className={`mb-3 flex items-center justify-between gap-2 ${large ? "mb-4" : ""}`}>
        <button
          type="button"
          onClick={() => onMonthChange(shiftMonth(monthStart, -1))}
          className={`rounded-lg px-2 py-1 text-ga-muted hover:bg-ga-elevated hover:text-ga-fg ${
            large ? "px-3 py-1.5 text-lg" : "text-sm"
          }`}
          aria-label="Mois précédent"
        >
          ‹
        </button>
        <p
          className={`font-semibold capitalize ${
            large ? "text-lg" : "text-sm"
          }`}
        >
          {monthLabel}
        </p>
        <button
          type="button"
          onClick={() => onMonthChange(shiftMonth(monthStart, 1))}
          className={`rounded-lg px-2 py-1 text-ga-muted hover:bg-ga-elevated hover:text-ga-fg ${
            large ? "px-3 py-1.5 text-lg" : "text-sm"
          }`}
          aria-label="Mois suivant"
        >
          ›
        </button>
      </div>

      <div
        className={`grid grid-cols-7 gap-1 text-center font-medium text-ga-muted ${
          large ? "gap-1.5 text-sm" : "text-[10px]"
        }`}
      >
        {WEEKDAY_HEADERS.map((label, index) => (
          <span key={`${label}-${index}`}>{label}</span>
        ))}
      </div>

      <div className={`mt-1 grid grid-cols-7 ${large ? "mt-2 gap-1.5" : "gap-1"}`}>
        {cells.map((cell, index) => {
          if (!cell.date || cell.day == null) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const marker = markers[cell.date];
          const activityCount = marker?.activityCount ?? 0;
          const planned = Boolean(marker?.hasPlannedSession);
          const selected = selectedDate === cell.date;
          const badge = activityBadge(activityCount);

          const content = (
            <>
              <span
                className={`flex items-center justify-center rounded-full font-medium ${
                  large ? "h-9 w-9 text-sm" : "h-7 w-7 text-xs"
                } ${
                  selected
                    ? "bg-ga-lime text-black"
                    : activityCount > 0
                      ? "bg-ga-lime/20 text-ga-lime"
                      : "text-ga-fg"
                }`}
              >
                {badge || cell.day}
              </span>
              {planned ? (
                <span
                  className={`mt-0.5 rounded-full bg-ga-blue ${
                    large ? "h-2 w-2" : "h-1.5 w-1.5"
                  }`}
                />
              ) : (
                <span
                  className={`mt-0.5 ${large ? "h-2 w-2" : "h-1.5 w-1.5"}`}
                />
              )}
            </>
          );

          if (selectable) {
            return (
              <button
                key={cell.date}
                type="button"
                onClick={() => onSelectDate?.(cell.date!)}
                className="flex aspect-square flex-col items-center justify-center rounded-lg hover:bg-ga-elevated"
              >
                {content}
              </button>
            );
          }

          return (
            <div
              key={cell.date}
              className="flex aspect-square flex-col items-center justify-center"
            >
              {content}
            </div>
          );
        })}
      </div>

      {showLegend ? (
        <div
          className={`mt-3 flex flex-wrap gap-3 text-ga-muted ${
            large ? "mt-4 gap-4 text-sm" : "text-[11px]"
          }`}
        >
          <span className="inline-flex items-center gap-1.5">
            <span
              className={`flex items-center justify-center rounded-full bg-ga-lime/20 text-ga-lime ${
                large ? "h-6 w-6 text-xs" : "h-5 w-5 text-[10px]"
              }`}
            >
              ✓
            </span>
            Activité faite
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className={`rounded-full bg-ga-blue ${
                large ? "h-2 w-2" : "h-1.5 w-1.5"
              }`}
            />
            Séance programmée
          </span>
        </div>
      ) : null}
    </div>
  );
}

export function monthStartFromISO(isoDate: string): string {
  return `${isoDate.slice(0, 7)}-01`;
}
