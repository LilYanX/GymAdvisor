"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MUSCLE_GROUP_LABELS } from "@/lib/labels";
import type { Exercise, MuscleGroup } from "@/lib/supabase/models";
import { ExerciseMedia } from "@/components/media/ExerciseMedia";

const FILTERS: Array<{ id: "all" | MuscleGroup; label: string }> = [
  { id: "all", label: "Tous" },
  { id: "jambe", label: "Jambe" },
  { id: "push", label: "Push" },
  { id: "pull", label: "Pull" },
  { id: "core", label: "Core" },
  { id: "cardio", label: "Cardio" },
  { id: "mobilite", label: "Mobilité" },
  { id: "balistique", label: "Balistique" },
  { id: "pliometrie", label: "Pliométrie" },
];

export function LibraryView({ exercises }: { exercises: Exercise[] }) {
  const [filter, setFilter] = useState<"all" | MuscleGroup>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(
    exercises[0]?.id ?? null,
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return exercises.filter((exercise) => {
      if (filter !== "all" && exercise.muscle_group !== filter) return false;
      if (!needle) return true;
      return exercise.name.toLowerCase().includes(needle);
    });
  }, [exercises, filter, query]);

  const selected =
    visible.find((exercise) => exercise.id === selectedId) ?? visible[0] ?? null;

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="min-w-0 flex-1 overflow-y-auto p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h1 className="text-2xl font-semibold">Bibliothèque d’exercices</h1>
          <Link
            href="/bibliotheque/nouveau"
            className="rounded-lg bg-ga-lime px-4 py-2 text-sm font-semibold text-black hover:bg-lime-300"
          >
            Nouvel exercice
          </Link>
        </div>

        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Rechercher un exercice"
          className="mt-6 w-full max-w-md rounded-lg border border-ga-border bg-ga-elevated px-3 py-2 text-sm outline-none focus:border-ga-lime"
        />

        <div className="mt-4 flex flex-wrap gap-2">
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
            {query.trim()
              ? "Aucun exercice trouvé."
              : "Aucun exercice. Ajoute le premier avec « Nouvel exercice »."}
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-3">
            {visible.map((exercise) => (
              <button
                key={exercise.id}
                type="button"
                onClick={() => setSelectedId(exercise.id)}
                className={`rounded-xl border p-3 text-left transition-colors ${
                  selected?.id === exercise.id
                    ? "border-ga-lime bg-ga-card"
                    : "border-ga-border bg-ga-card hover:border-ga-lime/60"
                }`}
              >
                <div className="overflow-hidden rounded-lg bg-ga-elevated">
                  <ExerciseMedia
                    url={exercise.video_url}
                    name={exercise.name}
                    className="aspect-video w-full"
                    playing={selected?.id === exercise.id}
                  />
                </div>
                <p className="mt-2 text-sm font-medium">{exercise.name}</p>
                <p className="mt-0.5 text-xs text-ga-muted">
                  {MUSCLE_GROUP_LABELS[exercise.muscle_group]}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected ? (
        <aside className="hidden w-96 shrink-0 flex-col border-l border-ga-border bg-ga-panel lg:flex">
          <div className="min-h-0 flex-1 overflow-y-auto p-6">
            <div className="overflow-hidden rounded-xl bg-ga-elevated">
              <ExerciseMedia
                url={selected.video_url}
                name={selected.name}
                className="aspect-video w-full"
                playing
              />
            </div>
            <h2 className="mt-4 text-xl font-semibold">{selected.name}</h2>
            <p className="mt-1 text-sm text-ga-muted">
              {MUSCLE_GROUP_LABELS[selected.muscle_group]}
            </p>
            {selected.cues.length > 0 ? (
              <ol className="mt-4 list-decimal space-y-1.5 pl-4 text-sm text-ga-muted">
                {selected.cues.map((cue) => (
                  <li key={cue}>{cue}</li>
                ))}
              </ol>
            ) : null}
            {selected.vigilance_points ? (
              <p className="mt-4 whitespace-pre-line text-sm text-ga-muted">
                {selected.vigilance_points}
              </p>
            ) : null}
            <div className="mt-6 flex flex-col gap-2">
              <Link
                href={`/bibliotheque/${selected.id}`}
                className="rounded-lg border border-ga-border px-4 py-2 text-center text-sm hover:border-ga-lime"
              >
                Modifier
              </Link>
              <Link
                href="/editeur"
                className="rounded-lg bg-ga-lime px-4 py-2 text-center text-sm font-semibold text-black hover:bg-lime-300"
              >
                Utiliser dans un programme
              </Link>
            </div>
          </div>
        </aside>
      ) : null}
    </div>
  );
}
