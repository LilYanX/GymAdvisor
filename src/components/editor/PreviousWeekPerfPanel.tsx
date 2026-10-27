"use client";

import type { PreviousWeekPerf } from "@/lib/editor-types";
import { formatPrescriptionQuantity, weekdayLabel } from "@/lib/labels";
import { formatDayMonth } from "@/lib/dates";

type Props = {
  open: boolean;
  onClose: () => void;
  previousWeekPerf: PreviousWeekPerf | null;
  currentWeekNumber: number;
};

function formatSetLine(set: {
  setNumber: number;
  weightKg: number | null;
  reps: number | null;
  completed: boolean;
}): string {
  const parts: string[] = [`S${set.setNumber}`];
  if (set.weightKg != null) parts.push(`${set.weightKg} kg`);
  if (set.reps != null) parts.push(`${set.reps} reps`);
  if (!set.completed) parts.push("(non fait)");
  return parts.join(" · ");
}

export function PreviousWeekPerfPanel({
  open,
  onClose,
  previousWeekPerf,
  currentWeekNumber,
}: Props) {
  if (!open) return null;

  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-ga-border bg-ga-panel xl:w-96">
      <div className="flex items-center justify-between gap-2 border-b border-ga-border px-4 py-3">
        <div>
          <p className="text-sm font-semibold">
            Réalisé — semaine {previousWeekPerf?.weekNumber ?? currentWeekNumber - 1}
          </p>
          <p className="text-xs text-ga-muted">
            Charges / reps / séries pour ajuster la semaine {currentWeekNumber}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-ga-border px-2 py-1 text-xs text-ga-muted hover:text-ga-fg"
        >
          Fermer
        </button>
      </div>

      <div className="ga-scrollbar-hidden min-h-0 flex-1 overflow-y-auto p-4">
        {!previousWeekPerf ? (
          <p className="text-sm text-ga-muted">
            Pas de semaine {currentWeekNumber - 1} pour ce sportif.
          </p>
        ) : previousWeekPerf.sessions.length === 0 ? (
          <p className="text-sm text-ga-muted">
            Aucune séance trackable sur la semaine précédente.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {previousWeekPerf.sessions.map((session) => (
              <section
                key={session.sessionId}
                className="rounded-xl border border-ga-border bg-ga-card p-3"
              >
                <h3 className="text-sm font-semibold">{session.title}</h3>
                <p className="mt-0.5 text-[11px] text-ga-muted">
                  {weekdayLabel(session.weekday)}
                  {session.scheduledDate
                    ? ` · ${formatDayMonth(session.scheduledDate)}`
                    : ""}
                </p>

                {session.exercises.length === 0 ? (
                  <p className="mt-2 text-xs text-ga-muted">Aucun exercice.</p>
                ) : (
                  <ul className="mt-3 flex flex-col gap-3">
                    {session.exercises.map((exercise) => {
                      const prescribed = formatPrescriptionQuantity(
                        exercise.prescribedSets,
                        exercise.prescribedReps,
                        exercise.prescribedUnit,
                        null,
                      );
                      const hasLogs = exercise.sets.length > 0;
                      return (
                        <li key={exercise.sessionExerciseId}>
                          <p className="text-xs font-medium text-ga-fg">
                            {exercise.exerciseName}
                          </p>
                          <p className="mt-0.5 text-[11px] text-ga-muted">
                            Prescrit : {prescribed}
                            {exercise.prescribedWeightKg != null
                              ? ` · ${exercise.prescribedWeightKg} kg`
                              : ""}
                          </p>
                          {hasLogs ? (
                            <ul className="mt-1.5 space-y-0.5">
                              {exercise.sets.map((set) => (
                                <li
                                  key={set.setNumber}
                                  className={`text-[11px] ${
                                    set.completed
                                      ? "text-ga-fg"
                                      : "text-ga-muted"
                                  }`}
                                >
                                  {formatSetLine(set)}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="mt-1 text-[11px] text-ga-amber">
                              Pas de saisie
                            </p>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
