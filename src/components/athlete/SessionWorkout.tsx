"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AthleteExercise, AthleteSessionView } from "@/lib/athlete-types";
import {
  completeSession,
  saveExerciseFeedback,
  saveSetLog,
} from "@/lib/actions/session";
import { ExerciseMedia } from "@/components/media/ExerciseMedia";
import { FixedBottomBar } from "@/components/layout/FixedBottomBar";
import { useLoadingActive } from "@/components/layout/LoadingProvider";
import { resolveExerciseSets } from "@/lib/athlete-sets";
import {
  groupWorkoutExercises,
  workoutGroupItems,
  type WorkoutGroup,
} from "@/lib/workout-groups";

function prescription(item: AthleteExercise): string {
  const parts = [`${item.sets_count} × ${item.target_reps}`];
  if (item.target_weight_kg != null) parts.push(`vise ${item.target_weight_kg} kg`);
  if (item.target_rpe != null) parts.push(`RPE ${item.target_rpe}`);
  if (item.coach_note) parts.push(item.coach_note);
  return parts.join(", ");
}

function ExercisePanel({
  item,
  compact,
  pending,
  run,
}: {
  item: AthleteExercise;
  compact?: boolean;
  pending: boolean;
  run: (action: () => Promise<{ error: string | null }>) => void;
}) {
  const sets = resolveExerciseSets(item);
  const videoUrl = item.exercise?.video_url;

  return (
    <section
      className={
        compact
          ? "rounded-2xl border border-ga-blue/40 bg-ga-blue/5 p-3"
          : undefined
      }
    >
      <div className="overflow-hidden rounded-2xl bg-ga-elevated">
        <ExerciseMedia
          url={videoUrl}
          name={item.exercise?.name ?? "Exercice"}
          className={compact ? "aspect-[4/3] w-full" : "aspect-video w-full"}
        />
      </div>

      <h2 className={`font-semibold ${compact ? "mt-3 text-lg" : "mt-5 text-2xl"}`}>
        {item.exercise?.name ?? "Exercice"}
      </h2>
      <p className="mt-1 text-sm text-ga-muted">{prescription(item)}</p>
      {item.exercise?.cues && item.exercise.cues.length > 0 ? (
        <ol className="mt-3 list-decimal space-y-1.5 pl-4 text-sm text-ga-muted">
          {item.exercise.cues.slice(0, 6).map((cue) => (
            <li key={cue}>{cue}</li>
          ))}
        </ol>
      ) : null}

      <div className="mt-4 w-full max-w-full">
        <div className="grid grid-cols-[1.75rem_minmax(0,1fr)_minmax(0,1fr)_2.25rem] items-center gap-x-2 gap-y-1 text-xs text-ga-muted">
          <span>Sér.</span>
          <span>Charge</span>
          <span>Reps</span>
          <span className="text-center">Fait</span>
        </div>
        <div className="mt-2 flex flex-col gap-2">
          {sets.map((set) => (
            <div
              key={set.set_number}
              className="grid grid-cols-[1.75rem_minmax(0,1fr)_minmax(0,1fr)_2.25rem] items-center gap-x-2"
            >
              <span className="text-sm text-ga-muted">{set.set_number}</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.5"
                defaultValue={set.weight_kg ?? ""}
                disabled={pending}
                onBlur={(event) => {
                  const weightKg =
                    event.target.value === "" ? null : Number(event.target.value);
                  run(() =>
                    saveSetLog({
                      sessionExerciseId: item.id,
                      setNumber: set.set_number,
                      weightKg,
                      reps: set.reps,
                      completed: set.completed,
                    }),
                  );
                }}
                className="min-w-0 w-full max-w-full rounded-lg border border-ga-border bg-ga-elevated px-2 py-2 text-sm outline-none focus:border-ga-lime"
              />
              <input
                type="number"
                inputMode="numeric"
                defaultValue={set.reps ?? ""}
                disabled={pending}
                onBlur={(event) => {
                  const reps =
                    event.target.value === "" ? null : Number(event.target.value);
                  run(() =>
                    saveSetLog({
                      sessionExerciseId: item.id,
                      setNumber: set.set_number,
                      weightKg: set.weight_kg,
                      reps,
                      completed: set.completed,
                    }),
                  );
                }}
                className="min-w-0 w-full max-w-full rounded-lg border border-ga-border bg-ga-elevated px-2 py-2 text-sm outline-none focus:border-ga-lime"
              />
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  run(() =>
                    saveSetLog({
                      sessionExerciseId: item.id,
                      setNumber: set.set_number,
                      weightKg: set.weight_kg,
                      reps: set.reps,
                      completed: !set.completed,
                    }),
                  )
                }
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-semibold ${
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

      <div className="mt-4">
        <p className="text-sm text-ga-muted">RPE ressenti</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((value) => (
            <button
              key={value}
              type="button"
              disabled={pending}
              onClick={() =>
                run(() =>
                  saveExerciseFeedback({
                    sessionExerciseId: item.id,
                    rpe: value,
                    comment: item.log?.comment ?? "",
                  }),
                )
              }
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm ${
                item.log?.rpe === value
                  ? "bg-ga-lime font-semibold text-black"
                  : "bg-ga-elevated text-ga-muted"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <label className="mt-4 block text-sm text-ga-muted">
        Commentaire
        <textarea
          defaultValue={item.log?.comment ?? ""}
          key={item.id}
          disabled={pending}
          onBlur={(event) => {
            const comment = event.target.value;
            if (comment !== (item.log?.comment ?? "")) {
              run(() =>
                saveExerciseFeedback({
                  sessionExerciseId: item.id,
                  rpe: item.log?.rpe ?? null,
                  comment,
                }),
              );
            }
          }}
          rows={2}
          className="mt-2 w-full rounded-xl border border-ga-border bg-ga-elevated px-3 py-2 text-sm text-ga-fg outline-none focus:border-ga-lime"
        />
      </label>
    </section>
  );
}

function GroupContent({
  group,
  pending,
  run,
}: {
  group: WorkoutGroup;
  pending: boolean;
  run: (action: () => Promise<{ error: string | null }>) => void;
}) {
  if (group.kind === "single") {
    return <ExercisePanel item={group.item} pending={pending} run={run} />;
  }

  return (
    <div className="space-y-4">
      {group.items.map((item) => (
          <ExercisePanel
            key={item.id}
            item={item}
            compact
            pending={pending}
            run={run}
          />
        ))}
    </div>
  );
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
  const [pending, startTransition] = useTransition();
  useLoadingActive(pending);
  const [error, setError] = useState<string | null>(null);

  const group = groups[index];
  const total = groups.length;

  if (!group) {
    return (
      <p className="px-5 pt-10 text-sm text-ga-muted">
        Aucun exercice dans cette séance.
      </p>
    );
  }

  function run(action: () => Promise<{ error: string | null }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  async function goNext() {
    setError(null);
    startTransition(async () => {
      for (const exercise of workoutGroupItems(group)) {
        const result = await saveExerciseFeedback({
          sessionExerciseId: exercise.id,
          rpe: exercise.log?.rpe ?? null,
          comment: exercise.log?.comment ?? "",
        });
        if (result.error) {
          setError(result.error);
          return;
        }
      }

      if (index + 1 >= total) {
        const done = await completeSession(session.id);
        if (done.error) {
          setError(done.error);
          return;
        }
        router.push("/app");
        router.refresh();
        return;
      }

      setIndex(index + 1);
      router.refresh();
    });
  }

  const stepLabel =
    group.kind === "superset"
      ? `Superset ${index + 1} / ${total}`
      : `Exercice ${index + 1} / ${total}`;

  return (
    <>
      <div className="min-w-0 overflow-x-hidden px-5 pb-32 pt-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm text-ga-muted">{session.title}</p>
            <p className="text-sm text-ga-muted">{stepLabel}</p>
          </div>
          <div className="flex shrink-0 gap-1">
            {groups.map((workoutGroup, groupIndex) => (
              <span
                key={
                  workoutGroup.kind === "single"
                    ? workoutGroup.item.id
                    : workoutGroup.items.map((item) => item.id).join("-")
                }
                className={`h-1.5 w-4 rounded-full sm:w-5 ${
                  groupIndex <= index ? "bg-ga-lime" : "bg-ga-elevated"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="mt-4">
          <GroupContent group={group} pending={pending} run={run} />
        </div>

        {error ? <p className="mt-3 text-sm text-ga-red">{error}</p> : null}
      </div>

      <FixedBottomBar offsetClass="bottom-14" variant="athlete">
        <button
          type="button"
          disabled={pending}
          onClick={goNext}
          className="w-full rounded-xl bg-ga-lime py-3 text-sm font-semibold text-black hover:bg-lime-300 disabled:opacity-60"
        >
          {index + 1 >= total ? "Terminer la séance" : "Exercice suivant"}
        </button>
      </FixedBottomBar>
    </>
  );
}
