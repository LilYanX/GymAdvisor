"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deleteExercise,
  updateExercise,
  type ExerciseFormState,
} from "@/lib/actions/exercises";
import { MUSCLE_GROUP_LABELS } from "@/lib/labels";
import type { Exercise, MuscleGroup } from "@/lib/supabase/models";

const initial: ExerciseFormState = { error: null };

export function EditExerciseForm({ exercise }: { exercise: Exercise }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(updateExercise, initial);
  const [deleting, startDelete] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  return (
    <form action={action} className="mt-5 grid gap-3 border-t border-ga-border pt-5">
      <h3 className="text-sm font-medium">Modifier</h3>
      <input type="hidden" name="exercise_id" value={exercise.id} />
      <label className="text-sm">
        <span className="mb-1.5 block text-ga-muted">Nom</span>
        <input
          name="name"
          required
          defaultValue={exercise.name}
          className="w-full rounded-lg border border-ga-border bg-ga-elevated px-3 py-2 outline-none focus:border-ga-lime"
        />
      </label>
      <label className="text-sm">
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
      <label className="text-sm">
        <span className="mb-1.5 block text-ga-muted">URL vidéo / GIF</span>
        <input
          name="video_url"
          type="url"
          defaultValue={exercise.video_url ?? ""}
          className="w-full rounded-lg border border-ga-border bg-ga-elevated px-3 py-2 outline-none focus:border-ga-lime"
        />
      </label>
      <label className="text-sm">
        <span className="mb-1.5 block text-ga-muted">Consignes (une par ligne)</span>
        <textarea
          name="cues"
          rows={4}
          defaultValue={exercise.cues.join("\n")}
          className="w-full rounded-lg border border-ga-border bg-ga-elevated px-3 py-2 outline-none focus:border-ga-lime"
        />
      </label>
      <label className="text-sm">
        <span className="mb-1.5 block text-ga-muted">Points de vigilance</span>
        <textarea
          name="vigilance_points"
          rows={3}
          defaultValue={exercise.vigilance_points}
          className="w-full rounded-lg border border-ga-border bg-ga-elevated px-3 py-2 outline-none focus:border-ga-lime"
        />
      </label>
      {state.error || deleteError ? (
        <p className="text-sm text-ga-red">{state.error ?? deleteError}</p>
      ) : null}
      <div className="flex flex-col gap-2">
        <button
          type="submit"
          disabled={pending || deleting}
          className="rounded-lg bg-ga-lime px-3 py-2 text-sm font-semibold text-black hover:bg-lime-300 disabled:opacity-60"
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
              router.refresh();
            });
          }}
          className="rounded-lg border border-ga-red/40 px-3 py-2 text-sm text-ga-red hover:bg-ga-red/10 disabled:opacity-60"
        >
          {deleting ? "Suppression…" : "Supprimer"}
        </button>
      </div>
    </form>
  );
}
