"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deleteExercise,
  updateExercise,
  type ExerciseFormState,
} from "@/lib/actions/exercises";
import { MUSCLE_GROUP_LABELS } from "@/lib/labels";
import { ExerciseVideoUpload } from "@/components/library/ExerciseVideoUpload";
import { useLoadingActive } from "@/components/layout/LoadingProvider";
import type { Exercise, MuscleGroup } from "@/lib/supabase/models";

const initial: ExerciseFormState = { error: null };

export function EditExerciseForm({ exercise }: { exercise: Exercise }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(updateExercise, initial);
  const [deleting, startDelete] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  useLoadingActive(pending || deleting);

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <section className="min-w-0 rounded-xl border border-ga-border bg-ga-card p-5">
        <h2 className="text-base font-semibold">Vidéo</h2>
        <ExerciseVideoUpload
          key={exercise.id}
          exerciseId={exercise.id}
          currentUrl={exercise.video_url}
        />
      </section>

      <form
        key={exercise.updated_at}
        action={action}
        className="grid min-w-0 gap-3 rounded-xl border border-ga-border bg-ga-card p-5 sm:grid-cols-2"
      >
        <input type="hidden" name="exercise_id" value={exercise.id} />
        <label className="min-w-0 text-sm sm:col-span-2">
          <span className="mb-1.5 block text-ga-muted">Nom</span>
          <input
            name="name"
            required
            defaultValue={exercise.name}
            className="w-full rounded-lg border border-ga-border bg-ga-elevated px-3 py-2 outline-none focus:border-ga-lime"
          />
        </label>
        <label className="min-w-0 text-sm">
          <span className="mb-1.5 block text-ga-muted">Groupe</span>
          <select
            name="muscle_group"
            defaultValue={exercise.muscle_group}
            className="w-full rounded-lg border border-ga-border bg-ga-elevated px-3 py-2 outline-none focus:border-ga-lime"
          >
            {(Object.keys(MUSCLE_GROUP_LABELS) as MuscleGroup[]).map((group) => (
              <option key={group} value={group}>
                {MUSCLE_GROUP_LABELS[group]}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-0 text-sm">
          <span className="mb-1.5 block text-ga-muted">URL vidéo / GIF</span>
          <input
            name="video_url"
            type="url"
            defaultValue={exercise.video_url ?? ""}
            className="w-full rounded-lg border border-ga-border bg-ga-elevated px-3 py-2 outline-none focus:border-ga-lime"
          />
        </label>
        <label className="min-w-0 text-sm sm:col-span-2">
          <span className="mb-1.5 block text-ga-muted">Consignes (une par ligne)</span>
          <textarea
            name="cues"
            rows={4}
            defaultValue={exercise.cues.join("\n")}
            className="w-full rounded-lg border border-ga-border bg-ga-elevated px-3 py-2 outline-none focus:border-ga-lime"
          />
        </label>
        <label className="min-w-0 text-sm sm:col-span-2">
          <span className="mb-1.5 block text-ga-muted">Points de vigilance</span>
          <textarea
            name="vigilance_points"
            rows={3}
            defaultValue={exercise.vigilance_points}
            className="w-full rounded-lg border border-ga-border bg-ga-elevated px-3 py-2 outline-none focus:border-ga-lime"
          />
        </label>
        {state.error || deleteError ? (
          <p className="text-sm text-ga-red sm:col-span-2">
            {state.error ?? deleteError}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <button
            type="submit"
            disabled={pending || deleting}
            className="rounded-lg bg-ga-lime px-4 py-2 text-sm font-semibold text-black hover:bg-lime-300 disabled:opacity-60"
          >
            {pending ? "Enregistrement…" : "Enregistrer"}
          </button>
          <button
            type="button"
            disabled={pending || deleting}
            onClick={() => {
              if (!confirm(`Supprimer « ${exercise.name} » ?`)) return;
              setDeleteError(null);
              startDelete(async () => {
                const result = await deleteExercise(exercise.id);
                if (result.error) {
                  setDeleteError(result.error);
                  return;
                }
                router.push("/bibliotheque");
                router.refresh();
              });
            }}
            className="rounded-lg border border-ga-red/40 px-4 py-2 text-sm text-ga-red hover:bg-ga-red/10 disabled:opacity-60"
          >
            {deleting ? "Suppression…" : "Supprimer"}
          </button>
        </div>
      </form>
    </div>
  );
}
