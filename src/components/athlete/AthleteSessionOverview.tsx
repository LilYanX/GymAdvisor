"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { AthleteExercise, AthleteSessionView } from "@/lib/athlete-types";
import {
  groupWorkoutExercises,
  workoutGroupItems,
  type WorkoutGroup,
} from "@/lib/workout-groups";
import { formatPrescriptionQuantity, weekdayLabel } from "@/lib/labels";
import { FixedBottomBar } from "@/components/layout/FixedBottomBar";
import { ExercisePreviewSheet } from "@/components/athlete/ExercisePreviewSheet";
import { IconPlay } from "@/components/icons";

function prescriptionMain(item: AthleteExercise): string {
  return formatPrescriptionQuantity(
    item.sets_count,
    item.target_reps,
    item.target_unit ?? "reps",
    item.target_secondary_reps ?? null,
  );
}

function prescriptionDetails(item: AthleteExercise): string {
  const parts: string[] = [];
  if (item.tempo) parts.push(`tempo ${item.tempo}`);
  if (item.target_weight_kg != null) parts.push(`vise ${item.target_weight_kg} kg`);
  if (item.target_rpe != null) parts.push(`RPE ${item.target_rpe}`);
  if (item.coach_note) parts.push(item.coach_note);
  return parts.join(" · ");
}

function ExerciseRow({
  item,
  onSelect,
}: {
  item: AthleteExercise;
  onSelect: () => void;
}) {
  const details = prescriptionDetails(item);
  const hasMedia = Boolean(item.exercise?.video_url);

  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-start gap-3 rounded-xl border border-ga-border bg-ga-card p-3 text-left transition hover:border-ga-lime/50"
    >
      <span
        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          hasMedia
            ? "bg-ga-lime/15 text-ga-lime"
            : "bg-ga-elevated text-ga-muted"
        }`}
      >
        <IconPlay className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium">
          {item.exercise?.name ?? "Exercice"}
        </span>
        <span className="mt-0.5 block text-sm text-ga-muted">
          {prescriptionMain(item)}
          {details ? ` · ${details}` : ""}
        </span>
      </span>
    </button>
  );
}

function GroupBlock({
  group,
  index,
  onSelect,
}: {
  group: WorkoutGroup;
  index: number;
  onSelect: (item: AthleteExercise) => void;
}) {
  if (group.kind === "single") {
    return (
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ga-muted">
          Exercice {index + 1}
        </p>
        <ExerciseRow item={group.item} onSelect={() => onSelect(group.item)} />
      </div>
    );
  }

  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ga-blue">
        Superset {index + 1} · {group.items.length} exos
      </p>
      <div className="space-y-2 rounded-2xl border border-ga-blue/30 bg-ga-blue/5 p-2">
        {group.items.map((item) => (
          <ExerciseRow
            key={item.id}
            item={item}
            onSelect={() => onSelect(item)}
          />
        ))}
      </div>
    </div>
  );
}

export function AthleteSessionOverview({
  session,
}: {
  session: AthleteSessionView;
}) {
  const groups = useMemo(
    () => groupWorkoutExercises(session.exercises),
    [session.exercises],
  );
  const [preview, setPreview] = useState<AthleteExercise | null>(null);

  const exerciseCount = useMemo(
    () => groups.reduce((sum, group) => sum + workoutGroupItems(group).length, 0),
    [groups],
  );

  const ctaLabel =
    session.log?.status === "completed"
      ? "Revoir la séance"
      : session.log?.started_at
        ? "Continuer"
        : "Commencer";

  return (
    <>
      <div className="px-5 pb-32 pt-8">
        <Link
          href="/app/programme"
          className="text-sm text-ga-muted hover:text-ga-fg"
        >
          ← Programme
        </Link>

        <p className="mt-4 text-sm text-ga-muted">
          {weekdayLabel(session.weekday)}
          {session.estimated_minutes
            ? ` · ~${session.estimated_minutes} min`
            : ""}
          {exerciseCount > 0 ? ` · ${exerciseCount} exercices` : ""}
        </p>
        <h1 className="mt-1 text-3xl font-semibold">{session.title}</h1>

        {groups.length === 0 ? (
          <p className="mt-8 text-sm text-ga-muted">
            Aucun exercice dans cette séance.
          </p>
        ) : (
          <div className="mt-6 flex flex-col gap-5">
            {groups.map((group, index) => (
              <GroupBlock
                key={
                  group.kind === "single"
                    ? group.item.id
                    : group.items.map((item) => item.id).join("-")
                }
                group={group}
                index={index}
                onSelect={setPreview}
              />
            ))}
          </div>
        )}
      </div>

      <FixedBottomBar offsetClass="bottom-14" variant="athlete">
        <Link
          href={`/app/seance/${session.id}`}
          className="flex w-full items-center justify-center rounded-xl bg-ga-lime py-3 text-sm font-semibold text-black hover:bg-lime-300"
        >
          {ctaLabel}
        </Link>
      </FixedBottomBar>

      <ExercisePreviewSheet
        open={preview != null}
        onClose={() => setPreview(null)}
        name={preview?.exercise?.name ?? "Exercice"}
        videoUrl={preview?.exercise?.video_url}
        prescription={preview ? prescriptionMain(preview) : ""}
        details={preview ? prescriptionDetails(preview) : null}
        cues={preview?.exercise?.cues}
      />
    </>
  );
}
