"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AthleteExercise, AthleteSessionView } from "@/lib/athlete-types";
import {
  completeSession,
  saveWorkoutDrafts,
} from "@/lib/actions/session";
import { ExerciseMedia } from "@/components/media/ExerciseMedia";
import { FixedBottomBar } from "@/components/layout/FixedBottomBar";
import { useLoadingActive } from "@/components/layout/LoadingProvider";
import { resolveExerciseSets } from "@/lib/athlete-sets";
import {
  groupWorkoutExercises,
  isWorkoutGroupComplete,
  workoutGroupItems,
  type WorkoutGroup,
} from "@/lib/workout-groups";
import {
  DIFFICULTY_LEVEL_LABELS,
  formatPrescriptionQuantity,
  formatRest,
  type DifficultyLevel,
} from "@/lib/labels";
import { toDatetimeLocalValue } from "@/lib/session-timing";
import type { Exercise } from "@/lib/supabase/models";

type SetDraft = {
  set_number: number;
  weight_kg: number | null;
  reps: number | null;
  completed: boolean;
};

type ExerciseDraft = {
  sets: SetDraft[];
  rpe: number | null;
  rir: number | null;
  comment: string;
  selectedExerciseId: string | null;
};

function prescriptionMain(item: AthleteExercise): string {
  return formatPrescriptionQuantity(
    item.sets_count,
    item.target_reps,
    item.target_unit ?? "reps",
    item.target_secondary_reps ?? null,
  );
}

function buildDraft(item: AthleteExercise): ExerciseDraft {
  return {
    sets: resolveExerciseSets(item).map((set) => ({
      set_number: set.set_number,
      weight_kg: set.weight_kg,
      reps: set.reps,
      completed: set.completed,
    })),
    rpe: item.log?.rpe ?? null,
    rir: item.log?.rir ?? null,
    comment: item.log?.comment ?? "",
    selectedExerciseId:
      item.log?.selected_exercise_id ?? item.exercise?.id ?? null,
  };
}

function buildAllDrafts(
  exercises: AthleteExercise[],
): Record<string, ExerciseDraft> {
  return Object.fromEntries(exercises.map((item) => [item.id, buildDraft(item)]));
}

function resolveDisplayExercise(
  item: AthleteExercise,
  draft: ExerciseDraft,
): Exercise | null {
  if (draft.selectedExerciseId) {
    const fromVariants = item.variantOptions.find(
      (option) => option.id === draft.selectedExerciseId,
    );
    if (fromVariants) return fromVariants;
    if (item.exercise?.id === draft.selectedExerciseId) return item.exercise;
  }
  return item.exercise;
}

function ExercisePanel({
  item,
  draft,
  onDraftChange,
  compact,
  disabled,
}: {
  item: AthleteExercise;
  draft: ExerciseDraft;
  onDraftChange: (draft: ExerciseDraft) => void;
  compact?: boolean;
  disabled: boolean;
}) {
  const [cuesOpen, setCuesOpen] = useState(false);
  const display = resolveDisplayExercise(item, draft);
  const videoUrl = display?.video_url;
  const cues = display?.cues ?? [];

  const levelOptions = item.variantOptions.filter(
    (option) => option.difficulty_level != null,
  );

  const followLines: Array<{ label: string; value: string }> = [
    { label: "Séries", value: prescriptionMain(item) },
  ];
  if (item.tempo?.trim()) {
    followLines.push({ label: "Tempo", value: item.tempo.trim() });
  }
  if (item.rest_seconds != null && item.rest_seconds > 0) {
    followLines.push({
      label: "Repos",
      value: formatRest(item.rest_seconds),
    });
  }

  function updateSet(
    setNumber: number,
    patch: Partial<Pick<SetDraft, "weight_kg" | "reps" | "completed">>,
  ) {
    onDraftChange({
      ...draft,
      sets: draft.sets.map((set) =>
        set.set_number === setNumber ? { ...set, ...patch } : set,
      ),
    });
  }

  return (
    <section
      className={
        compact
          ? "rounded-2xl border border-ga-blue/40 bg-ga-blue/5 p-4"
          : undefined
      }
    >
      <div className="overflow-hidden rounded-2xl bg-ga-elevated">
        <ExerciseMedia
          url={videoUrl}
          name={display?.name ?? item.exercise?.name ?? "Exercice"}
          className={compact ? "aspect-[4/3] w-full" : "aspect-video w-full"}
        />
      </div>

      <div
        className={`flex items-start justify-between gap-3 ${
          compact ? "mt-4" : "mt-6"
        }`}
      >
        <h2
          className={`min-w-0 flex-1 font-semibold ${
            compact ? "text-2xl" : "text-3xl"
          }`}
        >
          {display?.name ?? item.exercise?.name ?? "Exercice"}
        </h2>
        {cues.length > 0 ? (
          <button
            type="button"
            onClick={() => setCuesOpen((open) => !open)}
            className="mt-1 shrink-0 rounded-lg border border-ga-border bg-ga-elevated px-3 py-1.5 text-sm font-medium text-ga-fg hover:border-ga-lime/50"
          >
            {cuesOpen ? "Masquer" : "Consignes"}
          </button>
        ) : null}
      </div>

      {levelOptions.length > 1 ? (
        <label className="mt-3 block text-sm text-ga-muted">
          Niveau
          <select
            value={draft.selectedExerciseId ?? display?.id ?? ""}
            disabled={disabled}
            onChange={(event) =>
              onDraftChange({
                ...draft,
                selectedExerciseId: event.target.value || null,
              })
            }
            className="mt-1.5 w-full rounded-xl border border-ga-border bg-ga-elevated px-3 py-2.5 text-sm text-ga-fg outline-none focus:border-ga-lime"
          >
            {levelOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {DIFFICULTY_LEVEL_LABELS[
                  option.difficulty_level as DifficultyLevel
                ] ?? option.name}
                {option.name !== display?.name ? ` — ${option.name}` : ""}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {cuesOpen && cues.length > 0 ? (
        <ol
          className={`mt-3 list-decimal space-y-2 pl-5 text-ga-muted ${
            compact ? "text-sm" : "text-base"
          }`}
        >
          {cues.slice(0, 6).map((cue) => (
            <li key={cue}>{cue}</li>
          ))}
        </ol>
      ) : null}

      {/* 1. Séries / tempo / repos — gras blanc */}
      <ul className={`mt-4 space-y-1 ${compact ? "text-sm" : "text-base"}`}>
        {followLines.map((line) => (
          <li key={line.label} className="font-bold text-white">
            {line.label} : {line.value}
          </li>
        ))}
      </ul>

      {/* 2. Charge / reps / Fait */}
      <div className="mt-6 w-full max-w-full">
        <div className="grid grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)_3.25rem] items-center gap-x-2.5 gap-y-1 text-sm text-ga-muted">
          <span>Sér.</span>
          <span>Charge</span>
          <span>Reps</span>
          <span className="text-center">Fait</span>
        </div>
        <div className="mt-3 flex flex-col gap-2.5">
          {draft.sets.map((set) => (
            <div
              key={set.set_number}
              className="grid grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)_3.25rem] items-center gap-x-2.5"
            >
              <span className="text-base text-ga-muted">{set.set_number}</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.5"
                value={set.weight_kg ?? ""}
                disabled={disabled}
                onChange={(event) => {
                  const weightKg =
                    event.target.value === "" ? null : Number(event.target.value);
                  updateSet(set.set_number, { weight_kg: weightKg });
                }}
                className="min-w-0 w-full max-w-full rounded-xl border border-ga-border bg-ga-elevated px-3 py-3.5 text-lg outline-none focus:border-ga-lime"
              />
              <input
                type="number"
                inputMode="numeric"
                value={set.reps ?? ""}
                disabled={disabled}
                onChange={(event) => {
                  const reps =
                    event.target.value === "" ? null : Number(event.target.value);
                  updateSet(set.set_number, { reps });
                }}
                className="min-w-0 w-full max-w-full rounded-xl border border-ga-border bg-ga-elevated px-3 py-3.5 text-lg outline-none focus:border-ga-lime"
              />
              <button
                type="button"
                disabled={disabled}
                onClick={() =>
                  updateSet(set.set_number, { completed: !set.completed })
                }
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-semibold ${
                  set.completed
                    ? "bg-ga-lime text-black"
                    : "bg-ga-elevated text-ga-muted"
                }`}
              >
                {set.completed ? "✓" : ""}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 3. RPE ressenti */}
      <div className="mt-6">
        <p className="text-base text-ga-muted">RPE ressenti</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((value) => (
            <button
              key={value}
              type="button"
              disabled={disabled}
              onClick={() => onDraftChange({ ...draft, rpe: value })}
              className={`flex h-10 w-10 items-center justify-center rounded-full text-base ${
                draft.rpe === value
                  ? "bg-ga-lime font-semibold text-black"
                  : "bg-ga-elevated text-ga-muted"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Commentaire */}
      <label className="mt-6 block text-base text-ga-muted">
        Commentaire
        <textarea
          value={draft.comment}
          disabled={disabled}
          onChange={(event) =>
            onDraftChange({ ...draft, comment: event.target.value })
          }
          rows={2}
          className="mt-2 w-full rounded-xl border border-ga-border bg-ga-elevated px-4 py-3 text-base text-ga-fg outline-none focus:border-ga-lime"
        />
      </label>
    </section>
  );
}

function GroupContent({
  group,
  drafts,
  onDraftChange,
  disabled,
}: {
  group: WorkoutGroup;
  drafts: Record<string, ExerciseDraft>;
  onDraftChange: (exerciseId: string, draft: ExerciseDraft) => void;
  disabled: boolean;
}) {
  if (group.kind === "single") {
    return (
      <ExercisePanel
        item={group.item}
        draft={drafts[group.item.id]}
        onDraftChange={(draft) => onDraftChange(group.item.id, draft)}
        disabled={disabled}
      />
    );
  }

  return (
    <div className="space-y-5">
      {group.items.map((item) => (
        <ExercisePanel
          key={item.id}
          item={item}
          draft={drafts[item.id]}
          onDraftChange={(draft) => onDraftChange(item.id, draft)}
          compact
          disabled={disabled}
        />
      ))}
    </div>
  );
}

function draftPayload(exercises: AthleteExercise[], drafts: Record<string, ExerciseDraft>) {
  return exercises.map((exercise) => {
    const draft = drafts[exercise.id];
    return {
      sessionExerciseId: exercise.id,
      sets: draft.sets.map((set) => ({
        setNumber: set.set_number,
        weightKg: set.weight_kg,
        reps: set.reps,
        completed: set.completed,
      })),
      rpe: draft.rpe,
      rir: draft.rir,
      comment: draft.comment,
      selectedExerciseId: draft.selectedExerciseId,
    };
  });
}

export function SessionWorkout({
  session,
  startIndex,
}: {
  session: AthleteSessionView;
  startIndex: number;
}) {
  const router = useRouter();
  const groups = useMemo(
    () => groupWorkoutExercises(session.exercises),
    [session.exercises],
  );
  const [index, setIndex] = useState(
    Math.min(Math.max(startIndex, 0), Math.max(groups.length - 1, 0)),
  );
  const [drafts, setDrafts] = useState(() => buildAllDrafts(session.exercises));
  const [advancing, setAdvancing] = useState(false);
  useLoadingActive(advancing);
  const [error, setError] = useState<string | null>(null);
  const [confirmingEnd, setConfirmingEnd] = useState(false);
  const [endedAt, setEndedAt] = useState(toDatetimeLocalValue);
  const [finalRpe, setFinalRpe] = useState<number | null>(null);

  const group = groups[index];
  const total = groups.length;

  const completedBlocs = useMemo(() => {
    return groups.filter((workoutGroup) => {
      const items = workoutGroupItems(workoutGroup);
      return items.every((item) => {
        const draft = drafts[item.id];
        if (!draft || draft.sets.length === 0) {
          return isWorkoutGroupComplete({ kind: "single", item });
        }
        return draft.sets.every((set) => set.completed);
      });
    }).length;
  }, [groups, drafts]);

  if (!group) {
    return (
      <p className="px-[10px] pt-10 text-sm text-ga-muted">
        Aucun exercice dans cette séance.
      </p>
    );
  }

  function updateDraft(exerciseId: string, draft: ExerciseDraft) {
    setDrafts((current) => ({ ...current, [exerciseId]: draft }));
  }

  async function jumpToBloc(target: number) {
    if (target === index || advancing) return;
    setError(null);
    setAdvancing(true);
    try {
      await saveWorkoutDrafts(
        draftPayload(workoutGroupItems(group), drafts),
      );
      setIndex(target);
    } finally {
      setAdvancing(false);
    }
  }

  async function goNext() {
    setError(null);
    setAdvancing(true);
    try {
      const result = await saveWorkoutDrafts(
        draftPayload(workoutGroupItems(group), drafts),
      );

      if (result.error) {
        setError(result.error);
        return;
      }

      if (index + 1 >= total) {
        setConfirmingEnd(true);
        return;
      }

      setIndex(index + 1);
    } finally {
      setAdvancing(false);
    }
  }

  async function finishSession() {
    setError(null);
    if (finalRpe == null) {
      setError("Indique ton RPE final (1–10).");
      return;
    }
    setAdvancing(true);
    try {
      const done = await completeSession(session.id, endedAt, finalRpe);
      if (done.error) {
        setError(done.error);
        return;
      }
      router.push("/app");
      router.refresh();
    } finally {
      setAdvancing(false);
    }
  }

  if (confirmingEnd) {
    return (
      <>
        <div className="px-[10px] pb-36 pt-8">
          <p className="text-base text-ga-muted">{session.title}</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">
            Fin de séance
          </h1>
          <label className="mt-8 block text-base">
            <span className="font-medium">Heure de fin</span>
            <input
              type="datetime-local"
              value={endedAt}
              onChange={(event) => setEndedAt(event.target.value)}
              className="mt-2 w-full rounded-xl border border-ga-border bg-ga-elevated px-4 py-3.5 text-base outline-none focus:border-ga-lime"
            />
          </label>
          <div className="mt-8">
            <p className="text-lg font-medium">RPE final</p>
            <p className="mt-1.5 text-sm text-ga-muted">
              Difficulté globale de la séance (1 = très facile, 10 = max)
            </p>
            <div className="mt-4 grid grid-cols-5 gap-2.5">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFinalRpe(value)}
                  className={`rounded-xl py-3.5 text-base font-semibold transition ${
                    finalRpe === value
                      ? "bg-ga-lime text-black"
                      : "bg-ga-elevated text-ga-muted hover:text-ga-fg"
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
          {error ? <p className="mt-4 text-base text-ga-red">{error}</p> : null}
        </div>
        <FixedBottomBar offsetClass="bottom-14" variant="athlete">
          <div className="flex gap-2.5">
            <button
              type="button"
              disabled={advancing}
              onClick={() => {
                setConfirmingEnd(false);
                setError(null);
              }}
              className="shrink-0 rounded-xl border border-ga-border bg-ga-elevated px-5 py-4 text-base font-medium text-ga-fg disabled:opacity-60"
            >
              Retour
            </button>
            <button
              type="button"
              disabled={advancing}
              onClick={finishSession}
              className="min-w-0 flex-1 rounded-xl bg-ga-lime py-4 text-base font-semibold text-black hover:bg-lime-300 disabled:opacity-60"
            >
              {advancing ? "Enregistrement…" : "Valider et terminer"}
            </button>
          </div>
        </FixedBottomBar>
      </>
    );
  }

  const stepLabel =
    group.kind === "superset"
      ? `Bloc ${index + 1} / ${total} · Superset`
      : `Bloc ${index + 1} / ${total}`;

  const nextCta =
    index + 1 >= total
      ? "Terminer la séance"
      : `Bloc terminé → Bloc ${index + 2}`;

  const progressRatio = total > 0 ? completedBlocs / total : 0;

  return (
    <>
      <div className="min-w-0 overflow-x-hidden px-[10px] pb-36 pt-5">
        <div className="min-w-0">
          <p className="truncate text-base text-ga-muted">{session.title}</p>
          <p className="mt-0.5 text-lg font-medium text-ga-fg">{stepLabel}</p>
        </div>

        <div className="mt-5">
          <GroupContent
            group={group}
            drafts={drafts}
            onDraftChange={updateDraft}
            disabled={advancing}
          />
        </div>

        {error ? <p className="mt-4 text-base text-ga-red">{error}</p> : null}

        <button
          type="button"
          disabled={advancing}
          onClick={goNext}
          className="mt-8 w-full rounded-xl bg-ga-lime py-4 text-base font-semibold text-black hover:bg-lime-300 disabled:opacity-60"
        >
          {nextCta}
        </button>
      </div>

      <div className="fixed inset-x-0 bottom-14 z-30 border-t border-ga-border bg-ga-panel/95 backdrop-blur-sm">
        <div className="mx-auto w-full max-w-2xl px-[10px] pt-2">
          <div className="flex items-center gap-2">
            <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-ga-elevated">
              <div
                className="h-full rounded-full bg-ga-lime/80 transition-[width] duration-300"
                style={{ width: `${Math.round(progressRatio * 100)}%` }}
              />
            </div>
            <span className="shrink-0 text-[11px] text-ga-muted">
              {completedBlocs}/{total}
            </span>
          </div>
        </div>
        <div className="mx-auto flex w-full max-w-2xl gap-1.5 overflow-x-auto px-2 py-2.5">
          {groups.map((workoutGroup, groupIndex) => {
            const items = workoutGroupItems(workoutGroup);
            const names = items
              .map((item) => item.exercise?.name ?? "Exo")
              .join(" · ");
            const done = items.every((item) => {
              const draft = drafts[item.id];
              if (!draft || draft.sets.length === 0) {
                return isWorkoutGroupComplete({
                  kind: "single",
                  item,
                });
              }
              return draft.sets.every((set) => set.completed);
            });
            const active = groupIndex === index;
            return (
              <button
                key={
                  workoutGroup.kind === "single"
                    ? workoutGroup.item.id
                    : workoutGroup.items.map((item) => item.id).join("-")
                }
                type="button"
                disabled={advancing}
                onClick={() => jumpToBloc(groupIndex)}
                className={`min-w-[5.25rem] flex-1 rounded-xl px-2 py-2 text-center transition disabled:opacity-60 ${
                  active
                    ? "bg-ga-lime text-black"
                    : done
                      ? "bg-ga-lime/15 text-ga-lime"
                      : "bg-ga-elevated text-ga-muted"
                }`}
              >
                <span className="block text-xs font-semibold leading-tight">
                  Bloc {groupIndex + 1}
                  {done && !active ? " ✓" : ""}
                </span>
                <span
                  className={`mt-1 block truncate text-[11px] leading-tight ${
                    active ? "text-black/70" : "opacity-80"
                  }`}
                >
                  {names}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
