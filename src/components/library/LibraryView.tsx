"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MUSCLE_GROUP_LABELS } from "@/lib/labels";
import type { Exercise, MuscleGroup } from "@/lib/supabase/models";
import { ExerciseMedia } from "@/components/media/ExerciseMedia";

const PAGE_SIZE = 24;

const FILTERS: Array<{ id: "all" | MuscleGroup; label: string }> = [
  { id: "all", label: "Tous" },
  ...(Object.keys(MUSCLE_GROUP_LABELS) as MuscleGroup[]).map((id) => ({
    id,
    label: MUSCLE_GROUP_LABELS[id],
  })),
];

function buildLibraryHref(params: {
  page?: number;
  group?: "all" | MuscleGroup;
  q?: string;
}): string {
  const search = new URLSearchParams();
  if (params.group && params.group !== "all") search.set("group", params.group);
  if (params.q?.trim()) search.set("q", params.q.trim());
  if (params.page && params.page > 1) search.set("page", String(params.page));
  const qs = search.toString();
  return qs ? `/bibliotheque?${qs}` : "/bibliotheque";
}

export function LibraryView({
  exercises,
  totalCount,
  page,
  group,
  query: initialQuery,
  pageSize = PAGE_SIZE,
}: {
  exercises: Exercise[];
  totalCount: number;
  page: number;
  group: "all" | MuscleGroup;
  query: string;
  pageSize?: number;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [selectedId, setSelectedId] = useState<string | null>(
    exercises[0]?.id ?? null,
  );

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    setSelectedId(exercises[0]?.id ?? null);
  }, [exercises]);

  const selected =
    exercises.find((exercise) => exercise.id === selectedId) ??
    exercises[0] ??
    null;

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);

  const rangeLabel = useMemo(() => {
    if (totalCount === 0) return "0 exercice";
    const from = (safePage - 1) * pageSize + 1;
    const to = Math.min(safePage * pageSize, totalCount);
    return `${from}–${to} sur ${totalCount} exercice${totalCount > 1 ? "s" : ""}`;
  }, [safePage, pageSize, totalCount]);

  function goTo(next: {
    page?: number;
    group?: "all" | MuscleGroup;
    q?: string;
  }) {
    router.push(
      buildLibraryHref({
        page: next.page ?? 1,
        group: next.group ?? group,
        q: next.q ?? query,
      }),
    );
  }

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="min-w-0 flex-1 overflow-y-auto p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Bibliothèque d’exercices</h1>
            <p className="mt-1 text-sm text-ga-muted">{rangeLabel}</p>
          </div>
          <Link
            href="/bibliotheque/nouveau"
            className="rounded-lg bg-ga-lime px-4 py-2 text-sm font-semibold text-black hover:bg-lime-300"
          >
            Nouvel exercice
          </Link>
        </div>

        <form
          className="mt-6 w-full max-w-md"
          onSubmit={(event) => {
            event.preventDefault();
            goTo({ page: 1, q: query });
          }}
        >
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher un exercice"
            className="w-full rounded-lg border border-ga-border bg-ga-elevated px-3 py-2 text-sm outline-none focus:border-ga-lime"
          />
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => goTo({ page: 1, group: item.id, q: query })}
              className={`rounded-full px-3 py-1.5 text-sm ${
                group === item.id
                  ? "bg-ga-lime font-semibold text-black"
                  : "bg-ga-elevated text-ga-muted hover:text-ga-fg"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {exercises.length === 0 ? (
          <p className="mt-8 text-sm text-ga-muted">
            {initialQuery.trim() || group !== "all"
              ? "Aucun exercice trouvé."
              : "Aucun exercice. Ajoute le premier avec « Nouvel exercice »."}
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-3">
            {exercises.map((exercise) => (
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

        {totalPages > 1 ? (
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => goTo({ page: safePage - 1 })}
              className="rounded-lg border border-ga-border px-3 py-1.5 text-sm text-ga-muted hover:text-ga-fg disabled:opacity-40"
            >
              Précédent
            </button>
            <p className="text-sm text-ga-muted">
              Page {safePage} / {totalPages}
            </p>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => goTo({ page: safePage + 1 })}
              className="rounded-lg border border-ga-border px-3 py-1.5 text-sm text-ga-muted hover:text-ga-fg disabled:opacity-40"
            >
              Suivant
            </button>
          </div>
        ) : null}
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
