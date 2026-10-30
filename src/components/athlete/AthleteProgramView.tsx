"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type {
  AthleteDay,
  AthleteExercise,
  AthleteProgram,
} from "@/lib/athlete-types";
import {
  groupWorkoutExercises,
  workoutGroupItems,
  type WorkoutGroup,
} from "@/lib/workout-groups";
import { formatPrescriptionQuantity, weekdayLabel } from "@/lib/labels";
import { formatDayMonth } from "@/lib/dates";
import { FixedBottomBar } from "@/components/layout/FixedBottomBar";
import { ExercisePreviewSheet } from "@/components/athlete/ExercisePreviewSheet";
import { IconPlay } from "@/components/icons";

function isTrackable(day: AthleteDay): boolean {
  return (
    day.session.session_type === "workout" ||
    day.session.session_type === "optional"
  );
}

function blocLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

function tabLabel(day: AthleteDay, index: number): string {
  const letter = blocLetter(index);
  if (day.session.scheduled_date) {
    const weekday = weekdayLabel(day.session.weekday)
      .slice(0, 3)
      .toLowerCase();
    return `${letter} - ${weekday}. ${formatDayMonth(day.session.scheduled_date)}`;
  }
  return `${letter} - ${weekdayLabel(day.session.weekday).slice(0, 3).toLowerCase()}.`;
}

function dateHeading(day: AthleteDay): string {
  if (day.session.scheduled_date) {
    return `${weekdayLabel(day.session.weekday)} ${formatDayMonth(day.session.scheduled_date)}`;
  }
  return weekdayLabel(day.session.weekday);
}

function ctaLabel(day: AthleteDay): string {
  if (day.kind === "completed") return "Revoir la séance";
  if (day.session.log?.started_at) return "Continuer la séance";
  return "Commencer la séance";
}

export function AthleteProgramView({ data }: { data: AthleteProgram }) {
  const searchParams = useSearchParams();
  const trackable = useMemo(() => data.days.filter(isTrackable), [data.days]);
  const requestedId = searchParams.get("session");
  const [selectedId, setSelectedId] = useState<string | null>(
    () =>
      (requestedId &&
        trackable.find((day) => day.session.id === requestedId)?.session.id) ||
      trackable.find((day) => day.kind === "today")?.session.id ||
      trackable.find((day) => day.kind === "upcoming" || day.kind === "missed")
        ?.session.id ||
      trackable[0]?.session.id ||
      null,
  );
  const [preview, setPreview] = useState<AthleteExercise | null>(null);

  const selected =
    trackable.find((day) => day.session.id === selectedId) ?? trackable[0] ?? null;

  const groups = useMemo(
    () =>
      selected ? groupWorkoutExercises(selected.session.exercises) : [],
    [selected],
  );

  if (trackable.length === 0) {
    return (
      <div className="px-5 pb-8 pt-8">
        <h1 className="text-5xl font-semibold tracking-tight">Programme</h1>
        <p className="mt-2.5 text-lg text-ga-muted">
          Semaine {data.week?.week_number ?? data.athlete.current_week} /{" "}
          {data.athlete.total_weeks}
        </p>
        <p className="mt-8 text-lg text-ga-muted">
          Aucune séance programmée cette semaine.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="px-5 pb-44 pt-8">
        <h1 className="text-5xl font-semibold tracking-tight">Programme</h1>
        <p className="mt-2.5 text-lg text-ga-muted">
          Semaine {data.week?.week_number ?? data.athlete.current_week} /{" "}
          {data.athlete.total_weeks} · {trackable.length} séance
          {trackable.length > 1 ? "s" : ""}
        </p>

        <div className="ga-scrollbar-hidden mt-6 flex gap-3 overflow-x-auto pb-1">
          {trackable.map((day, index) => {
            const active = day.session.id === selected?.session.id;
            return (
              <button
                key={day.session.id}
                type="button"
                onClick={() => setSelectedId(day.session.id)}
                className={`shrink-0 rounded-2xl px-5 py-3 text-base font-semibold transition ${
                  active
                    ? "bg-ga-lime text-black"
                    : "bg-ga-elevated text-ga-muted hover:text-ga-fg"
                }`}
              >
                {tabLabel(day, index)}
              </button>
            );
          })}
        </div>

        {selected ? (
          <section className="mt-7">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-3xl font-semibold leading-tight">
                {selected.session.title}
              </h2>
              <p className="shrink-0 pt-1.5 text-base text-ga-muted">
                {dateHeading(selected)}
              </p>
            </div>

            <div className="mt-6 space-y-5">
              {groups.map((group, groupIndex) => (
                <BlocSummary
                  key={
                    group.kind === "single"
                      ? group.item.id
                      : group.items.map((item) => item.id).join("-")
                  }
                  group={group}
                  groupIndex={groupIndex}
                  onSelect={setPreview}
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>

      {selected ? (
        <FixedBottomBar offsetClass="bottom-20" variant="athlete">
          <Link
            href={`/app/seance/${selected.session.id}`}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-ga-lime py-4 text-lg font-semibold text-black hover:bg-lime-300"
          >
            ▶ {ctaLabel(selected)}
          </Link>
        </FixedBottomBar>
      ) : null}

      <ExercisePreviewSheet
        open={preview != null}
        onClose={() => setPreview(null)}
        name={preview?.exercise?.name ?? "Exercice"}
        videoUrl={preview?.exercise?.video_url}
        prescription=""
        details={null}
        cues={preview?.exercise?.cues}
      />
    </>
  );
}

function BlocSummary({
  group,
  groupIndex,
  onSelect,
}: {
  group: WorkoutGroup;
  groupIndex: number;
  onSelect: (item: AthleteExercise) => void;
}) {
  const letter = blocLetter(groupIndex);
  const items = workoutGroupItems(group);
  const isSuperset = group.kind === "superset";

  return (
    <div>
      <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-ga-muted">
        Bloc {groupIndex + 1}
        {isSuperset ? " — Superset" : ""}
      </p>
      <ul className="space-y-2">
        {items.map((item, itemIndex) => {
          const prescription = formatPrescriptionQuantity(
            item.sets_count,
            item.target_reps,
            item.target_unit ?? "reps",
            item.target_secondary_reps ?? null,
          );
          return (
            <li key={item.id} className="flex items-center gap-2.5">
              <span className="min-w-0 flex-1 text-lg text-ga-fg">
                <span className="text-ga-muted">
                  {letter}
                  {itemIndex + 1}){" "}
                </span>
                <span className="font-medium">
                  {item.exercise?.name ?? "Exercice"}
                </span>
                <span className="mt-0.5 block text-base text-ga-muted">
                  {prescription}
                </span>
              </span>
              <button
                type="button"
                onClick={() => onSelect(item)}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                  item.exercise?.video_url
                    ? "bg-ga-lime/15 text-ga-lime"
                    : "bg-ga-elevated text-ga-muted"
                }`}
                title="Voir la vidéo"
              >
                <IconPlay className="h-5 w-5" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
