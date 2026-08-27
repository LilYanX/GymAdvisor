import Link from "next/link";
import type { AthleteProgram } from "@/lib/athlete-types";
import { weekdayShort } from "@/lib/labels";

function formatTime(value: string | null): string | null {
  if (!value) return null;
  const [hours, minutes] = value.split(":");
  if (minutes === "00") return `${Number(hours)}h`;
  return `${Number(hours)}h${minutes}`;
}

export function AthleteHome({ data }: { data: AthleteProgram }) {
  const today = data.today;
  const workout = today?.session;

  return (
    <div className="px-5 pb-6 pt-8">
      <h1 className="text-3xl font-semibold">
        Semaine {data.athlete.current_week}/{data.athlete.total_weeks}
      </h1>

      {data.programJustPublished ? (
        <section className="mt-4 rounded-xl border border-ga-lime/40 bg-ga-lime/10 p-4 text-sm">
          Nouveau programme
        </section>
      ) : null}

      {workout ? (
        <section className="mt-6 rounded-2xl border border-ga-border bg-ga-card p-5">
          <span className="rounded-full bg-ga-lime/15 px-2.5 py-1 text-xs font-medium text-ga-lime">
            {today?.kind === "completed" ? "Fait" : "Aujourd’hui"}
          </span>
          <h2 className="mt-3 text-2xl font-semibold">{workout.title}</h2>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-ga-muted">
            {formatTime(workout.suggested_time) ? (
              <span>{formatTime(workout.suggested_time)} suggéré</span>
            ) : null}
            {workout.estimated_minutes ? (
              <span>~ {workout.estimated_minutes} min</span>
            ) : null}
            <span>
              {workout.session_type === "rest"
                ? "Repos"
                : `${workout.exercises.length} exercice${workout.exercises.length > 1 ? "s" : ""}`}
            </span>
          </div>
          {today?.kind === "completed" ? null : workout.session_type === "rest" ? (
            workout.rest_details ? (
              <p className="mt-4 text-sm text-ga-muted">{workout.rest_details}</p>
            ) : null
          ) : (
            <Link
              href={`/app/seance/${workout.id}`}
              className="mt-5 flex w-full items-center justify-center rounded-xl bg-ga-lime py-3 text-sm font-semibold text-black hover:bg-lime-300"
            >
              Commencer
            </Link>
          )}
        </section>
      ) : null}

      {data.days.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-base font-semibold">Cette semaine</h2>
          <div className="mt-4 flex justify-between">
            {data.days.map((day) => (
              <div key={day.session.id} className="flex flex-col items-center gap-1">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium ${
                    day.kind === "completed"
                      ? "bg-ga-lime text-black"
                      : day.kind === "today"
                        ? "border border-ga-lime text-ga-fg"
                        : day.kind === "rest"
                          ? "border border-dashed border-ga-muted text-ga-muted"
                          : "bg-ga-elevated text-ga-muted"
                  }`}
                >
                  {weekdayShort(day.session.weekday)}
                </span>
                {day.kind === "rest" ? (
                  <span className="text-[10px] text-ga-muted">repos</span>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {data.overdue ? (
        <section className="mt-8 rounded-xl border border-ga-amber/40 bg-ga-amber/10 p-4">
          <Link
            href={`/app/seance/${data.overdue.session.id}`}
            className="text-sm font-medium text-ga-amber"
          >
            Compléter la séance →
          </Link>
        </section>
      ) : null}
    </div>
  );
}
