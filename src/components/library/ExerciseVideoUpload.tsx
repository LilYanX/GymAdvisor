"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateExerciseVideo } from "@/lib/actions/exercises";
import {
  removeStoredExerciseVideo,
  uploadExerciseVideo,
} from "@/lib/storage/exercise-videos";

export function ExerciseVideoUpload({
  exerciseId,
  currentUrl,
}: {
  exerciseId: string;
  currentUrl: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const busy = pending || uploading;

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setUploading(true);
    const uploaded = await uploadExerciseVideo(file);
    if ("error" in uploaded) {
      setUploading(false);
      setError(uploaded.error);
      return;
    }
    startTransition(async () => {
      const result = await updateExerciseVideo(exerciseId, uploaded.url);
      setUploading(false);
      if (result.error) {
        setError(result.error);
        await removeStoredExerciseVideo(uploaded.url);
        return;
      }
      if (currentUrl) await removeStoredExerciseVideo(currentUrl);
      router.refresh();
    });
  }

  return (
    <div className="mt-3">
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm,.m4v"
        className="hidden"
        disabled={busy}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          void onFile(file);
        }}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="w-full rounded-lg border border-ga-border bg-ga-elevated px-3 py-2 text-sm hover:border-ga-lime disabled:opacity-60"
      >
        {uploading
          ? "Envoi de la vidéo…"
          : currentUrl
            ? "Remplacer par un MP4"
            : "Ajouter une vidéo MP4"}
      </button>
      {error ? <p className="mt-1.5 text-sm text-ga-red">{error}</p> : null}
    </div>
  );
}
