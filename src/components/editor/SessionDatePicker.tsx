"use client";

import { useEffect, useState } from "react";
import {
  MonthCalendar,
  monthStartFromISO,
} from "@/components/calendar/MonthCalendar";
import { formatDayMonth, formatWeekdayLong, todayISO } from "@/lib/dates";

type Props = {
  value: string | null;
  onChange: (date: string) => void;
};

export function SessionDatePicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [monthStart, setMonthStart] = useState(() =>
    monthStartFromISO(value ?? todayISO()),
  );

  useEffect(() => {
    if (value) setMonthStart(monthStartFromISO(value));
  }, [value]);

  return (
    <div className="mx-4 mb-3">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="w-full rounded-md border border-ga-border bg-ga-elevated px-2 py-1.5 text-left text-xs text-ga-fg hover:border-ga-lime/50"
      >
        {value ? (
          <>
            Date :{" "}
            <span className="font-medium">
              {formatWeekdayLong(value)} {formatDayMonth(value)}
            </span>
          </>
        ) : (
          <span className="text-ga-muted">Choisir une date…</span>
        )}
      </button>

      {open ? (
        <div className="mt-2 rounded-xl border border-ga-border bg-ga-panel p-2 shadow-lg">
          <MonthCalendar
            monthStart={monthStart}
            onMonthChange={setMonthStart}
            selectedDate={value}
            onSelectDate={(date) => {
              onChange(date);
              setOpen(false);
            }}
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-2 w-full rounded-lg border border-ga-border py-1.5 text-xs text-ga-muted hover:text-ga-fg"
          >
            Fermer
          </button>
        </div>
      ) : null}
    </div>
  );
}
