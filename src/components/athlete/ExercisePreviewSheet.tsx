"use client";

import { useEffect } from "react";
import { ExerciseMedia } from "@/components/media/ExerciseMedia";

type Props = {
  open: boolean;
  onClose: () => void;
  name: string;
  videoUrl: string | null | undefined;
  prescription: string;
  details?: string | null;
  cues?: string[] | null;
};

export function ExercisePreviewSheet({
  open,
  onClose,
  name,
  videoUrl,
  prescription,
  details,
  cues,
}: Props) {
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Fermer"
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={name}
        className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-ga-border bg-ga-card p-4 shadow-xl sm:rounded-2xl sm:p-5"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold">{name}</h2>
            <p className="mt-0.5 text-sm font-medium text-ga-fg">{prescription}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-ga-border bg-ga-elevated px-2.5 py-1 text-sm text-ga-muted hover:text-ga-fg"
          >
            Fermer
          </button>
        </div>

        <div className="overflow-hidden rounded-xl bg-ga-elevated">
          <ExerciseMedia
            url={videoUrl}
            name={name}
            className="aspect-video w-full"
          />
        </div>

        {details ? (
          <p className="mt-3 text-sm text-ga-muted">{details}</p>
        ) : null}

        {cues && cues.length > 0 ? (
          <ol className="mt-3 list-decimal space-y-1 pl-4 text-sm text-ga-muted">
            {cues.slice(0, 8).map((cue) => (
              <li key={cue}>{cue}</li>
            ))}
          </ol>
        ) : null}
      </div>
    </div>
  );
}
