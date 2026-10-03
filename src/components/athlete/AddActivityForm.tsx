"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createAthleteActivity,
  updateAthleteActivity,
} from "@/lib/actions/activities";
import type { AthleteActivity } from "@/lib/supabase/models";
import { WEEKDAYS } from "@/lib/labels";
import { useLoadingActive } from "@/components/layout/LoadingProvider";

export function AddActivityForm({
  defaultDate,
  activity,
  onDone,
  onCancel,
}: {
  defaultDate: string;
  activity?: AthleteActivity;
  onDone?: () => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  useLoadingActive(pending);
  const editing = Boolean(activity);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(activity?.name ?? "");
  const [duration, setDuration] = useState(
    String(activity?.duration_minutes ?? 30),
  );
  const [rpe, setRpe] = useState(
    activity?.rpe != null ? String(activity.rpe) : "",
  );
  const [date, setDate] = useState(activity?.performed_on ?? defaultDate);
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
          const payload = {
            name,
            durationMinutes: Number(duration),
            rpe: rpe === "" ? null : Number(rpe),
            performedOn: date,
          };
          const result = editing
            ? await updateAthleteActivity({
                activityId: activity!.id,
                ...payload,
              })
            : await createAthleteActivity({
                ...payload,
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
          if (!editing) {
            setName("");
            setDuration("30");
            setRpe("");
            setRecurring(false);
            setWeekdays([]);
            setTimesPerWeek("");
          }
          router.refresh();
          onDone?.();
        });
      }}
    >
      <h3 className="text-sm font-semibold">
        {editing ? "Modifier l’activité" : "Ajouter une activité"}
      </h3>
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
          RPE séance (1–10)
          <input
            type="number"
            min={1}
            max={10}
            value={rpe}
            onChange={(event) => setRpe(event.target.value)}
            required
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
      {!editing ? (
        <>
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
        </>
      ) : null}
      {error ? <p className="text-sm text-ga-red">{error}</p> : null}
      <div className="flex gap-2">
        {editing && onCancel ? (
          <button
            type="button"
            disabled={pending}
            onClick={onCancel}
            className="flex-1 rounded-xl border border-ga-border py-2.5 text-sm font-medium text-ga-muted hover:text-ga-fg disabled:opacity-60"
          >
            Annuler
          </button>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-xl bg-ga-lime py-2.5 text-sm font-semibold text-black hover:bg-lime-300 disabled:opacity-60"
        >
          {pending ? "Enregistrement…" : editing ? "Enregistrer" : "Ajouter"}
        </button>
      </div>
    </form>
  );
}
