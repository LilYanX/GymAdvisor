"use client";

import { useState } from "react";
import type { AthleteActivity } from "@/lib/supabase/models";
import { AddActivityForm } from "@/components/athlete/AddActivityForm";
import { formatDayMonth } from "@/lib/dates";

export function AthleteActivitiesSection({
  activities,
  defaultDate,
}: {
  activities: AthleteActivity[];
  defaultDate: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Mes activités</h2>
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="rounded-lg border border-ga-border px-3 py-1.5 text-xs text-ga-muted hover:text-ga-fg"
        >
          {open ? "Fermer" : "+ Ajouter"}
        </button>
      </div>

      {open ? (
        <div className="mt-3">
          <AddActivityForm
            defaultDate={defaultDate}
            onDone={() => setOpen(false)}
          />
        </div>
      ) : null}

      {activities.length === 0 ? (
        <p className="mt-3 text-sm text-ga-muted">
          Ajoute une activité même en jour off (course, marche…).
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {activities.map((activity) => (
            <li
              key={activity.id}
              className="rounded-xl border border-ga-border bg-ga-card px-4 py-3 text-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{activity.name}</p>
                <p className="text-xs text-ga-muted">
                  {formatDayMonth(activity.performed_on)}
                </p>
              </div>
              <p className="mt-1 text-ga-muted">
                {activity.duration_minutes} min
                {activity.rpe != null ? ` · RPE ${activity.rpe}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
