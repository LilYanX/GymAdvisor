"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AthleteActivity } from "@/lib/supabase/models";
import { deleteAthleteActivity } from "@/lib/actions/activities";
import { AddActivityForm } from "@/components/athlete/AddActivityForm";
import { formatDayMonth } from "@/lib/dates";
import { IconTrash } from "@/components/icons";
import { useLoadingActive } from "@/components/layout/LoadingProvider";

export function AthleteActivitiesSection({
  activities,
  defaultDate,
  size = "md",
}: {
  activities: AthleteActivity[];
  defaultDate: string;
  size?: "md" | "lg";
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  useLoadingActive(pending);
  const large = size === "lg";

  const editing = activities.find((item) => item.id === editingId) ?? null;

  return (
    <section className={large ? "mt-12" : "mt-10"}>
      <div className="flex items-center justify-between gap-3">
        <h2
          className={`font-semibold uppercase tracking-wide text-ga-muted ${
            large ? "text-base" : "text-sm"
          }`}
        >
          Mes activités
        </h2>
        <button
          type="button"
          onClick={() => {
            setEditingId(null);
            setAdding((current) => !current);
            setError(null);
          }}
          className={`rounded-lg border border-ga-border bg-ga-card font-medium text-ga-muted transition hover:border-ga-lime/40 hover:text-ga-fg ${
            large ? "rounded-xl px-4 py-2 text-sm" : "px-3 py-1.5 text-xs"
          }`}
        >
          {adding ? "Fermer" : "+ Ajouter"}
        </button>
      </div>

      {adding ? (
        <div className="mt-3">
          <AddActivityForm
            defaultDate={defaultDate}
            onDone={() => setAdding(false)}
          />
        </div>
      ) : null}

      {editing ? (
        <div className="mt-3">
          <AddActivityForm
            key={editing.id}
            defaultDate={defaultDate}
            activity={editing}
            onDone={() => setEditingId(null)}
            onCancel={() => setEditingId(null)}
          />
        </div>
      ) : null}

      {error ? <p className="mt-3 text-sm text-ga-red">{error}</p> : null}

      {activities.length === 0 ? (
        <p
          className={`mt-4 leading-relaxed text-ga-muted ${
            large ? "text-base" : "text-sm"
          }`}
        >
          Ajoute une activité même en jour off (course, marche…).
        </p>
      ) : (
        <ul className={`mt-4 ${large ? "space-y-3" : "space-y-2"}`}>
          {activities.map((activity) => (
            <li
              key={activity.id}
              className={`rounded-xl border bg-ga-card transition ${
                large ? "rounded-2xl px-5 py-4 text-base" : "px-4 py-3 text-sm"
              } ${
                editingId === activity.id
                  ? "border-ga-lime/50"
                  : "border-ga-border hover:border-ga-lime/30"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    setAdding(false);
                    setEditingId((current) =>
                      current === activity.id ? null : activity.id,
                    );
                    setError(null);
                  }}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className={large ? "text-lg font-semibold" : "font-medium"}>
                      {activity.name}
                    </p>
                    <p
                      className={`shrink-0 text-ga-muted ${
                        large ? "text-sm" : "text-xs"
                      }`}
                    >
                      {formatDayMonth(activity.performed_on)}
                    </p>
                  </div>
                  <p className={`mt-1 text-ga-muted ${large ? "text-base" : ""}`}>
                    {activity.duration_minutes} min
                    {activity.rpe != null ? ` · RPE ${activity.rpe}` : ""}
                    <span
                      className={`ml-2 text-ga-lime ${
                        large ? "text-sm" : "text-xs"
                      }`}
                    >
                      Modifier
                    </span>
                  </p>
                </button>
                <button
                  type="button"
                  title="Supprimer"
                  disabled={pending}
                  onClick={() => {
                    setError(null);
                    startTransition(async () => {
                      const result = await deleteAthleteActivity(activity.id);
                      if (result.error) {
                        setError(result.error);
                        return;
                      }
                      if (editingId === activity.id) setEditingId(null);
                      router.refresh();
                    });
                  }}
                  className="shrink-0 rounded-lg p-1.5 text-ga-muted transition hover:bg-ga-elevated hover:text-ga-red disabled:opacity-50"
                >
                  <IconTrash className={large ? "h-5 w-5" : "h-3.5 w-3.5"} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
