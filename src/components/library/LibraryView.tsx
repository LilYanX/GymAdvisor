"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MUSCLE_GROUP_LABELS } from "@/lib/labels";
import type { Exercise, MuscleGroup } from "@/lib/supabase/models";
import { ExerciseVideoUpload } from "@/components/library/ExerciseVideoUpload";
import { EditExerciseForm } from "@/components/library/EditExerciseForm";
import { ExerciseMedia } from "@/components/media/ExerciseMedia";

const FILTERS: Array<{ id: "all" | MuscleGroup; label: string }> = [
  { id: "all", label: "Tous" },
  { id: "jambes", label: "Jambes" },
  { id: "haut_du_corps", label: "Haut du corps" },
  { id: "gainage", label: "Gainage" },
  { id: "cardio", label: "Cardio" },
];

export function LibraryView({ exercises }: { exercises: Exercise[] }) {
  const [filter, setFilter] = useState<"all" | MuscleGroup>("all");
  const [selectedId, setSelectedId] = useState<string | null>(
    exercises[0]?.id ?? null,
  );

  const visible = useMemo(
    () =>
      exercises.filter(
        (exercise) => filter === "all" || exercise.muscle_group === filter,
      ),
    [exercises, filter],
  );

  const selected =
    visible.find((exercise) => exercise.id === selectedId) ?? visible[0] ?? null;

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="min-w-0 flex-1 overflow-y-auto p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h1 className="text-2xl font-semibold">Bibliothèque d’exercices</h1>
          <p className="mt-1 text-sm text-ga-muted">
            Bibliothèque commune à tous les coachs.
          </p>
          <Link
            href="/bibliotheque/nouveau"
            className="rounded-lg bg-ga-lime px-4 py-2 text-sm font-semibold text-black hover:bg-lime-300"
          >
            Nouvel exercice
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`rounded-full px-3 py-1.5 text-sm ${
                filter === item.id
                  ? "bg-ga-lime font-semibold text-black"
                  : "bg-ga-elevated text-ga-muted hover:text-ga-fg"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <p className="mt-8 text-sm text-ga-muted">
            Aucun exercice. Ajoute le premier avec « Nouvel exercice ».
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-3">
            {visible.map((exercise) => (
              <button
                key={exercise.id}
                type="button"
                onClick={() => setSelectedId(exercise.id)}
                className={`rounded-xl border bg-ga-card text-left ${
                  selected?.id === exercise.id
                    ? "border-ga-lime"
                    : "border-ga-border hover:border-ga-muted"
                }`}
              >
                <div className="overflow-hidden rounded-t-xl bg-ga-elevated">
                  <ExerciseMedia
                    url={exercise.video_url}
                    name={exercise.name}
                    className="h-32 w-full"
                    controls={false}
                    playing={false}
                  />
                </div>
                <div className="p-3">
                  <p className="font-medium">{exercise.name}</p>
                  <p className="mt-1 text-xs text-ga-muted">
                    {MUSCLE_GROUP_LABELS[exercise.muscle_group]}
                    {exercise.cues.length > 0
                      ? ` · ${exercise.cues.length} consignes`
                      : ""}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected ? (
        <aside className="flex w-80 shrink-0 flex-col border-l border-ga-border bg-ga-panel">
          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            <h2 className="text-lg font-semibold">{selected.name}</h2>
            <div className="mt-4 overflow-hidden rounded-xl bg-ga-elevated">
              <ExerciseMedia
                url={selected.video_url}
                name={selected.name}
                className="h-40 w-full"
                playing
              />
            </div>
            <ExerciseVideoUpload
              exerciseId={selected.id}
              currentUrl={selected.video_url}
            />
            {selected.cues.length > 0 ? (
              <div className="mt-5">
                <h3 className="text-sm font-medium">Consigne</h3>
                <ol className="mt-2 list-decimal space-y-2 pl-4 text-sm text-ga-muted">
                  {selected.cues.map((cue) => (
                    <li key={cue}>{cue}</li>
                  ))}
                </ol>
              </div>
            ) : null}
            {selected.vigilance_points ? (
              <div className="mt-5 rounded-lg border border-ga-amber/40 bg-ga-amber/10 p-3 text-sm">
                <p className="font-medium text-ga-amber">Points de vigilance</p>
                <p className="mt-1 whitespace-pre-line text-ga-muted">
                  {selected.vigilance_points.replace(/\s*·\s*/g, "\n")}
                </p>
              </div>
            ) : null}
            <EditExerciseForm exercise={selected} />
          </div>
          <div className="shrink-0 border-t border-ga-border p-5">
            <Link
              href="/editeur"
              className="flex w-full items-center justify-center rounded-lg bg-ga-lime px-4 py-2.5 text-sm font-semibold text-black hover:bg-lime-300"
            >
              Utiliser dans un programme
            </Link>
          </div>
        </aside>
      ) : null}
    </div>
  );
}
