"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createAthleteActivity } from "@/lib/actions/activities";
import { WEEKDAYS } from "@/lib/labels";
import { useLoadingActive } from "@/components/layout/LoadingProvider";

export function AddActivityForm({
  defaultDate,
  onDone,
}: {
  defaultDate: string;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  useLoadingActive(pending);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("30");
  const [rpe, setRpe] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [recurring, setRecurring] = useState(false);
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [timesPerWeek, setTimesPerWeek] = useState("");

  function toggleDay(day: number) {
    setWeekdays((current) =>
      current.includes(day)
        ? current.filter((value) => value !== day)
        : [...current, day].sort((a, b) => a - b),
    );
  }

  return (
    <form
      className="flex flex-col gap-4 rounded-2xl border border-ga-border bg-ga-card p-4"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = await createAthleteActivity({
            name,
            durationMinutes: Number(duration),
            rpe: rpe === "" ? null : Number(rpe),
            performedOn: date,
            recurrence: recurring
              ? {
                  weekdays,
                  timesPerWeek:
                    timesPerWeek === "" ? null : Number(timesPerWeek),
                }
              : null,
          });
          if (result.error) {
            setError(result.error);
            return;
          }
          setName("");
          setDuration("30");
          setRpe("");
          setRecurring(false);
          setWeekdays([]);
          setTimesPerWeek("");
          router.refresh();
          onDone?.();
        });
      }}
    >
      <h3 className="text-sm font-semibold">Ajouter une activité</h3>
      <label className="text-xs text-ga-muted">
        Nom
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          placeholder="Course, marche, yoga…"
          className="mt-1 w-full rounded-lg border border-ga-border bg-ga-elevated px-3 py-2 text-sm text-ga-fg outline-none focus:border-ga-lime"
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs text-ga-muted">
          Durée (min)
          <input
            type="number"
            min={1}
            value={duration}
            onChange={(event) => setDuration(event.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-ga-border bg-ga-elevated px-3 py-2 text-sm text-ga-fg outline-none focus:border-ga-lime"
          />
        </label>
        <label className="text-xs text-ga-muted">
          RPE (1–10)
          <input
            type="number"
            min={1}
            max={10}
            value={rpe}
            onChange={(event) => setRpe(event.target.value)}
            className="mt-1 w-full rounded-lg border border-ga-border bg-ga-elevated px-3 py-2 text-sm text-ga-fg outline-none focus:border-ga-lime"
          />
        </label>
      </div>
      <label className="text-xs text-ga-muted">
        Date
        <input
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          required
          className="mt-1 w-full rounded-lg border border-ga-border bg-ga-elevated px-3 py-2 text-sm text-ga-fg outline-none focus:border-ga-lime"
        />
      </label>
      <label className="flex items-center gap-2 text-sm text-ga-muted">
        <input
          type="checkbox"
          checked={recurring}
          onChange={(event) => setRecurring(event.target.checked)}
        />
        Récurrence
      </label>
      {recurring ? (
        <div className="space-y-3 rounded-xl border border-ga-border bg-ga-elevated p-3">
          <p className="text-xs text-ga-muted">Jours de la semaine</p>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((day) => (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleDay(day.value)}
                className={`rounded-full px-2.5 py-1 text-xs ${
                  weekdays.includes(day.value)
                    ? "bg-ga-lime font-semibold text-black"
                    : "bg-ga-card text-ga-muted"
                }`}
              >
                {day.label.slice(0, 3)}
              </button>
            ))}
          </div>
          <label className="block text-xs text-ga-muted">
            Ou nombre de fois / semaine
            <input
              type="number"
              min={1}
              max={7}
              value={timesPerWeek}
              onChange={(event) => setTimesPerWeek(event.target.value)}
              className="mt-1 w-full rounded-lg border border-ga-border bg-ga-card px-3 py-2 text-sm text-ga-fg outline-none focus:border-ga-lime"
            />
          </label>
        </div>
      ) : null}
      {error ? <p className="text-sm text-ga-red">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-ga-lime py-2.5 text-sm font-semibold text-black hover:bg-lime-300 disabled:opacity-60"
      >
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
