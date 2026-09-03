"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  deleteWorkoutTemplate,
  saveWorkoutTemplate,
} from "@/lib/actions/templates";
import { newLocalId } from "@/lib/editor-draft";
import { MUSCLE_GROUP_LABELS } from "@/lib/labels";
import type { Exercise, WorkoutTemplateKind } from "@/lib/supabase/models";
import { IconPlus, IconTrash } from "@/components/icons";
import { useLoading } from "@/components/layout/LoadingProvider";
import { ExerciseMedia } from "@/components/media/ExerciseMedia";

export type TemplateExerciseDraft = {
  id: string;
  exercise_id: string;
  exercise: Exercise | null;
  sets_count: number;
  target_reps: number;
  target_weight_kg: number | null;
  target_percent: number | null;
  target_rpe: number | null;
  rest_seconds: number | null;
  coach_note: string;
  superset_group_id: string | null;
};

export type TemplateDraft = {
  id: string | null;
  name: string;
  kind: WorkoutTemplateKind;
  notes: string;
  exercises: TemplateExerciseDraft[];
};

export type SavedTemplate = {
  id: string;
  name: string;
  kind: WorkoutTemplateKind;
  notes: string;
  exercises: TemplateExerciseDraft[];
};

function emptyDraft(): TemplateDraft {
  return {
    id: null,
    name: "",
    kind: "block",
    notes: "",
    exercises: [],
  };
}

export function SubProgramEditor({
  library,
  templates: initialTemplates,
  onTemplatesChange,
}: {
  library: Exercise[];
  templates: SavedTemplate[];
  onTemplatesChange?: (templates: SavedTemplate[]) => void;
}) {
  const router = useRouter();
  const { setLoading } = useLoading();
  const [templates, setTemplates] = useState(initialTemplates);
  const [draft, setDraft] = useState<TemplateDraft>(emptyDraft());
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setTemplates(initialTemplates);
  }, [initialTemplates]);

  function syncTemplates(next: SavedTemplate[]) {
    setTemplates(next);
    onTemplatesChange?.(next);
  }

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return library;
    return library.filter((item) => item.name.toLowerCase().includes(needle));
  }, [library, query]);

  function addExercise(exercise: Exercise) {
    setDraft((current) => ({
      ...current,
      exercises: [
        ...current.exercises,
        {
          id: newLocalId(),
          exercise_id: exercise.id,
          exercise,
          sets_count: 4,
          target_reps: 8,
          target_weight_kg: null,
          target_percent: null,
          target_rpe: null,
          rest_seconds: 120,
          coach_note: "",
          superset_group_id: null,
        },
      ],
    }));
  }

  function linkSuperset(index: number) {
    if (index <= 0) return;
    setDraft((current) => {
      const exercises = [...current.exercises];
      const previous = exercises[index - 1];
      const groupId = previous.superset_group_id ?? newLocalId();
      if (!previous.superset_group_id) {
        exercises[index - 1] = { ...previous, superset_group_id: groupId };
      }
      exercises[index] = { ...exercises[index], superset_group_id: groupId };
      return { ...current, exercises };
    });
  }

  function save() {
    setError(null);
    setLoading(true);
    startTransition(async () => {
      const result = await saveWorkoutTemplate(draft.id, {
        name: draft.name,
        kind: draft.kind,
        notes: draft.notes,
        exercises: draft.exercises.map((item, index) => ({
          exercise_id: item.exercise_id,
          sort_order: index,
          sets_count: item.sets_count,
          target_reps: item.target_reps,
          target_weight_kg: item.target_weight_kg,
          target_percent: item.target_percent,
          target_rpe: item.target_rpe,
          rest_seconds: item.rest_seconds,
          coach_note: item.coach_note,
          superset_group_id: item.superset_group_id,
        })),
      });
      setLoading(false);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.id) {
        const saved: SavedTemplate = {
          id: result.id,
          name: draft.name.trim(),
          kind: draft.kind,
          notes: draft.notes,
          exercises: draft.exercises,
        };
        syncTemplates(
          draft.id
            ? templates.map((item) => (item.id === draft.id ? saved : item))
            : [saved, ...templates.filter((item) => item.id !== result.id)],
        );
      }
      setDraft(emptyDraft());
      router.refresh();
    });
  }

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <aside className="flex w-64 shrink-0 flex-col border-r border-ga-border bg-ga-panel md:w-72 lg:w-80 xl:w-[26rem] 2xl:w-[30rem]">
        <div className="shrink-0 border-b border-ga-border p-4">
          <p className="text-sm font-medium">Bibliothèque</p>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher un exercice"
            className="mt-3 w-full rounded-lg border border-ga-border bg-ga-elevated px-3 py-2 text-sm outline-none focus:border-ga-lime"
          />
        </div>
        <div className="ga-scrollbar-hidden min-h-0 flex-1 overflow-y-auto p-3">
          {filtered.length === 0 ? (
            <p className="px-1 text-sm text-ga-muted">
              {query.trim()
                ? "Aucun exercice trouvé."
                : "Aucun exercice dans la bibliothèque."}{" "}
              Ajoutes-en dans{" "}
              <Link href="/bibliotheque" className="text-ga-lime hover:underline">
                Bibliothèque
              </Link>
              .
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
              {filtered.map((exercise) => (
                <button
                  key={exercise.id}
                  type="button"
                  onClick={() => addExercise(exercise)}
                  className="rounded-lg border border-ga-border bg-ga-card p-2 text-left hover:border-ga-lime"
                >
                  <div className="mb-1.5 overflow-hidden rounded-md bg-ga-elevated">
                    <ExerciseMedia
                      url={exercise.video_url}
                      name={exercise.name}
                      className="h-10 w-full"
                      controls={false}
                      playing={false}
                    />
                  </div>
                  <p className="line-clamp-2 text-xs font-medium leading-snug">
                    {exercise.name}
                  </p>
                  <p className="mt-0.5 text-[10px] text-ga-muted">
                    {MUSCLE_GROUP_LABELS[exercise.muscle_group]}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      <div className="ga-scrollbar-hidden min-h-0 flex-1 overflow-y-auto p-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Sous-programmes</h2>
              <p className="mt-1 text-sm text-ga-muted">
                Crée des journées ou des blocs d’exercices réutilisables dans
                l’éditeur de programme.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDraft(emptyDraft())}
              className="inline-flex items-center gap-1 rounded-lg bg-ga-elevated px-3 py-2 text-sm text-ga-muted hover:text-ga-fg"
            >
              <IconPlus className="h-4 w-4" />
              Nouveau
            </button>
          </div>

          <section className="rounded-xl border border-ga-border bg-ga-card p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm text-ga-muted">
                Nom
                <input
                  value={draft.name}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-ga-border bg-ga-elevated px-3 py-2 text-sm text-ga-fg outline-none focus:border-ga-lime"
                />
              </label>
              <label className="text-sm text-ga-muted">
                Type
                <select
                  value={draft.kind}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      kind: event.target.value as WorkoutTemplateKind,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-ga-border bg-ga-elevated px-3 py-2 text-sm text-ga-fg outline-none focus:border-ga-lime"
                >
                  <option value="block">Bloc d’exercices</option>
                  <option value="day">Journée complète</option>
                </select>
              </label>
            </div>
            <label className="mt-3 block text-sm text-ga-muted">
              Notes
              <textarea
                value={draft.notes}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
                rows={2}
                className="mt-1 w-full rounded-lg border border-ga-border bg-ga-elevated px-3 py-2 text-sm text-ga-fg outline-none focus:border-ga-lime"
              />
            </label>

            <div className="mt-4 flex flex-col gap-2">
              {draft.exercises.length === 0 ? (
                <p className="text-sm text-ga-muted">
                  Ajoute des exercices depuis la bibliothèque.
                </p>
              ) : (
                draft.exercises.map((item, index) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-ga-border bg-ga-elevated p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">
                          {item.exercise?.name ?? "Exercice"}
                        </p>
                        {item.superset_group_id ? (
                          <p className="text-xs text-ga-blue">Superset</p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setDraft((current) => ({
                            ...current,
                            exercises: current.exercises.filter(
                              (exercise) => exercise.id !== item.id,
                            ),
                          }))
                        }
                        className="text-ga-muted hover:text-ga-red"
                      >
                        <IconTrash className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      <label className="text-xs text-ga-muted">
                        Séries
                        <input
                          type="number"
                          value={item.sets_count}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              exercises: current.exercises.map((exercise) =>
                                exercise.id === item.id
                                  ? {
                                      ...exercise,
                                      sets_count: Number(event.target.value) || 1,
                                    }
                                  : exercise,
                              ),
                            }))
                          }
                          className="mt-1 w-full rounded-md border border-ga-border bg-ga-card px-2 py-1 text-sm"
                        />
                      </label>
                      <label className="text-xs text-ga-muted">
                        Reps
                        <input
                          type="number"
                          value={item.target_reps}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              exercises: current.exercises.map((exercise) =>
                                exercise.id === item.id
                                  ? {
                                      ...exercise,
                                      target_reps: Number(event.target.value) || 1,
                                    }
                                  : exercise,
                              ),
                            }))
                          }
                          className="mt-1 w-full rounded-md border border-ga-border bg-ga-card px-2 py-1 text-sm"
                        />
                      </label>
                      <label className="text-xs text-ga-muted">
                        Repos (s)
                        <input
                          type="number"
                          value={item.rest_seconds ?? ""}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              exercises: current.exercises.map((exercise) =>
                                exercise.id === item.id
                                  ? {
                                      ...exercise,
                                      rest_seconds:
                                        event.target.value === ""
                                          ? null
                                          : Number(event.target.value),
                                    }
                                  : exercise,
                              ),
                            }))
                          }
                          className="mt-1 w-full rounded-md border border-ga-border bg-ga-card px-2 py-1 text-sm"
                        />
                      </label>
                    </div>
                    {index > 0 ? (
                      <button
                        type="button"
                        onClick={() => linkSuperset(index)}
                        className="mt-2 text-xs text-ga-blue hover:underline"
                      >
                        {item.superset_group_id
                          ? "Déjà en superset"
                          : "Superset avec le précédent"}
                      </button>
                    ) : null}
                  </div>
                ))
              )}
            </div>

            {error ? <p className="mt-3 text-sm text-ga-red">{error}</p> : null}
            <button
              type="button"
              disabled={pending}
              onClick={save}
              className="mt-4 rounded-lg bg-ga-lime px-4 py-2 text-sm font-semibold text-black hover:bg-lime-300 disabled:opacity-60"
            >
              Enregistrer le sous-programme
            </button>
          </section>

          <section>
            <h3 className="text-base font-semibold">Modèles enregistrés</h3>
            {templates.length === 0 ? (
              <p className="mt-2 text-sm text-ga-muted">Aucun sous-programme.</p>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {templates.map((template) => (
                  <article
                    key={template.id}
                    className="rounded-xl border border-ga-border bg-ga-card p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{template.name}</p>
                        <p className="text-xs text-ga-muted">
                          {template.kind === "day" ? "Journée" : "Bloc"} ·{" "}
                          {template.exercises.length} exercice
                          {template.exercises.length > 1 ? "s" : ""}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          startTransition(async () => {
                            const result = await deleteWorkoutTemplate(template.id);
                            if (result.error) setError(result.error);
                            else {
                              syncTemplates(
                                templates.filter((item) => item.id !== template.id),
                              );
                              router.refresh();
                            }
                          });
                        }}
                        className="text-ga-muted hover:text-ga-red"
                      >
                        <IconTrash className="h-4 w-4" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setDraft({
                          id: template.id,
                          name: template.name,
                          kind: template.kind,
                          notes: template.notes,
                          exercises: template.exercises,
                        })
                      }
                      className="mt-3 text-sm text-ga-lime hover:underline"
                    >
                      Modifier
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
