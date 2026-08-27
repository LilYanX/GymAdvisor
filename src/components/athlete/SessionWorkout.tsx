"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AthleteExercise, AthleteSessionView } from "@/lib/athlete-types";
import {
  completeSession,
  saveExerciseFeedback,
  saveSetLog,
} from "@/lib/actions/session";
import { ExerciseMedia } from "@/components/media/ExerciseMedia";
import { FixedBottomBar } from "@/components/layout/FixedBottomBar";

function prescription(item: AthleteExercise): string {
  const parts = [`${item.sets_count} × ${item.target_reps}`];
  if (item.target_weight_kg != null) parts.push(`vise ${item.target_weight_kg} kg`);
  if (item.target_rpe != null) parts.push(`RPE ${item.target_rpe}`);
  if (item.coach_note) parts.push(item.coach_note);
  return parts.join(", ");
}

export function SessionWorkout({
  session,
  startIndex,
}: {
  session: AthleteSessionView;
  startIndex: number;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(
    Math.min(Math.max(startIndex, 0), Math.max(session.exercises.length - 1, 0)),
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const item = session.exercises[index];
  const total = session.exercises.length;
  if (!item) {
    return (
      <p className="px-5 pt-10 text-sm text-ga-muted">
        Aucun exercice dans cette séance.
      </p>
    );
  }

  const sets =
    item.sets.length > 0
      ? item.sets
      : Array.from({ length: item.sets_count }, (_, setIndex) => ({
          id: `local-${setIndex}`,
          session_exercise_id: item.id,
          athlete_id: "",
          set_number: setIndex + 1,
          weight_kg: item.target_weight_kg,
          reps: item.target_reps,
          completed: false,
          created_at: "",
          updated_at: "",
        }));

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
      const result = await saveExerciseFeedback({
        sessionExerciseId: item.id,
        rpe: item.log?.rpe ?? null,
        comment: item.log?.comment ?? "",
      });
      if (result.error) {
        setError(result.error);
        return;
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

  const videoUrl = item.exercise?.video_url;
  const supersetPeers = item.superset_group_id
    ? session.exercises.filter(
        (exercise) =>
          exercise.superset_group_id === item.superset_group_id &&
          exercise.id !== item.id,
      )
    : [];

  return (
    <>
      <div className="min-w-0 overflow-x-hidden px-5 pb-32 pt-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm text-ga-muted">{session.title}</p>
            <p className="text-sm text-ga-muted">
              Exercice {index + 1} / {total}
            </p>
          </div>
          <div className="flex shrink-0 gap-1">
            {session.exercises.map((exercise, exerciseIndex) => (
              <span
                key={exercise.id}
                className={`h-1.5 w-4 rounded-full sm:w-5 ${
                  exerciseIndex <= index ? "bg-ga-lime" : "bg-ga-elevated"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl bg-ga-elevated">
          <ExerciseMedia
            url={videoUrl}
            name={item.exercise?.name ?? "Exercice"}
            className="aspect-video w-full"
          />
        </div>

        <h1 className="mt-5 text-2xl font-semibold">
          {item.exercise?.name ?? "Exercice"}
        </h1>
        {supersetPeers.length > 0 ? (
          <p className="mt-2 rounded-lg border border-ga-blue/40 bg-ga-blue/10 px-3 py-2 text-sm text-ga-blue">
            Superset avec{" "}
            {supersetPeers
              .map((exercise) => exercise.exercise?.name ?? "Exercice")
              .join(", ")}
          </p>
        ) : null}
        <p className="mt-1 text-sm text-ga-muted">{prescription(item)}</p>
        {item.exercise?.cues && item.exercise.cues.length > 0 ? (
          <ol className="mt-4 list-decimal space-y-1.5 pl-4 text-sm text-ga-muted">
            {item.exercise.cues.slice(0, 6).map((cue) => (
              <li key={cue}>{cue}</li>
            ))}
          </ol>
        ) : null}

        <div className="mt-6 w-full max-w-full">
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

        <div className="mt-6">
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

        <label className="mt-6 block text-sm text-ga-muted">
          Commentaire (optionnel)
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
