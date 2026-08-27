"use client";

import { useActionState, useState } from "react";
import {
  createExercise,
  type ExerciseFormState,
} from "@/lib/actions/exercises";
import { MUSCLE_GROUP_LABELS } from "@/lib/labels";
import { uploadExerciseVideo } from "@/lib/storage/exercise-videos";
import type { MuscleGroup } from "@/lib/supabase/models";

const initial: ExerciseFormState = { error: null };

export function ExerciseForm() {
  const [state, formAction, pending] = useActionState(createExercise, initial);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setUploadError(null);
    const file = formData.get("video_file");
    if (file instanceof File && file.size > 0) {
      setUploading(true);
      const result = await uploadExerciseVideo(file);
      setUploading(false);
      if ("error" in result) {
        setUploadError(result.error);
        return;
      }
      formData.set("video_url", result.url);
    }
    formData.delete("video_file");
    await formAction(formData);
  }

  const busy = pending || uploading;

  return (
    <form
      action={handleSubmit}
      className="grid gap-3 rounded-xl border border-ga-border bg-ga-card p-5 md:grid-cols-2"
    >
      <label className="text-sm">
        <span className="mb-1.5 block text-ga-muted">Nom</span>
        <input
          name="name"
          required
          placeholder="Squat arrière"
          className="w-full rounded-lg border border-ga-border bg-ga-elevated px-3 py-2 outline-none focus:border-ga-lime"
        />
      </label>
      <label className="text-sm">
        <span className="mb-1.5 block text-ga-muted">Groupe</span>
        <select
          name="muscle_group"
          className="w-full rounded-lg border border-ga-border bg-ga-elevated px-3 py-2 outline-none focus:border-ga-lime"
          defaultValue="jambes"
        >
          {(Object.keys(MUSCLE_GROUP_LABELS) as MuscleGroup[]).map((group) => (
            <option key={group} value={group}>
              {MUSCLE_GROUP_LABELS[group]}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm md:col-span-2">
        <span className="mb-1.5 block text-ga-muted">
          Vidéo MP4 depuis ton appareil
        </span>
        <input
          name="video_file"
          type="file"
          accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm,.m4v"
          disabled={busy}
          onChange={(event) =>
            setFileName(event.target.files?.[0]?.name ?? null)
          }
          className="w-full rounded-lg border border-ga-border bg-ga-elevated px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-ga-lime file:px-3 file:py-1 file:text-sm file:font-semibold file:text-black"
        />
        <span className="mt-1.5 block text-xs text-ga-muted">
          MP4, jusqu’à 50 Mo
          {fileName ? ` · ${fileName}` : ""}
        </span>
      </label>
      <label className="text-sm md:col-span-2">
        <span className="mb-1.5 block text-ga-muted">
          Ou URL (YouTube, GIF, lien)
        </span>
        <input
          name="video_url"
          type="url"
          placeholder="https://"
          className="w-full rounded-lg border border-ga-border bg-ga-elevated px-3 py-2 outline-none focus:border-ga-lime"
        />
      </label>
      <label className="text-sm md:col-span-2">
        <span className="mb-1.5 block text-ga-muted">
          Consignes (une par ligne)
        </span>
        <textarea
          name="cues"
          rows={3}
          className="w-full rounded-lg border border-ga-border bg-ga-elevated px-3 py-2 outline-none focus:border-ga-lime"
        />
      </label>
      <label className="text-sm md:col-span-2">
        <span className="mb-1.5 block text-ga-muted">Points de vigilance</span>
        <textarea
          name="vigilance_points"
          rows={2}
          className="w-full rounded-lg border border-ga-border bg-ga-elevated px-3 py-2 outline-none focus:border-ga-lime"
        />
      </label>
      {uploadError || state.error ? (
        <p className="text-sm text-ga-red md:col-span-2">
          {uploadError ?? state.error}
        </p>
      ) : null}
      <div className="md:col-span-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-ga-lime px-4 py-2 text-sm font-semibold text-black hover:bg-lime-300 disabled:opacity-60"
        >
          {uploading
            ? "Envoi de la vidéo…"
            : pending
              ? "Ajout…"
              : "Ajouter à la bibliothèque"}
        </button>
      </div>
    </form>
  );
}
