import Link from "next/link";
import type { AthleteDay, AthleteProgram } from "@/lib/athlete-types";
import { weekdayShort } from "@/lib/labels";
import { AthleteActivitiesSection } from "@/components/athlete/AthleteActivitiesSection";

function formatTime(value: string | null): string | null {
  if (!value) return null;
  const [hours, minutes] = value.split(":");
  if (minutes === "00") return `${Number(hours)}h`;
  return `${Number(hours)}h${minutes}`;
}

function isTrackable(day: AthleteDay): boolean {
  return (
    day.session.session_type === "workout" ||
    day.session.session_type === "optional"
  );
}

function dayPillLabel(day: AthleteDay): string {
  if (day.kind === "rest") return "repos";
  if (day.kind === "completed") return "fait";
  if (day.session.session_type === "optional") return "opt.";
  const title = day.session.title.trim();
  if (!title) return "séance";
  return title.length > 8 ? `${title.slice(0, 7)}…` : title;
}

export function AthleteHome({ data }: { data: AthleteProgram }) {
  const today = data.today;
  const workout = today?.session;
  const trackable = data.days.filter(isTrackable);
  const completed = trackable.filter((day) => day.kind === "completed").length;
  const total = trackable.length;
  const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const canStart =
    workout &&
    today?.kind !== "completed" &&
    (workout.session_type === "workout" || workout.session_type === "optional");

  return (
    <div className="px-5 pb-8 pt-8">
      <header className="ga-fade-in">
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Bonjour, {data.athlete.first_name}
        </h1>
        <p className="mt-1.5 text-sm text-ga-muted">
          Semaine {data.athlete.current_week} / {data.athlete.total_weeks}
        </p>
      </header>

      {total > 0 ? (
        <section className="mt-5">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-xs font-medium uppercase tracking-wide text-ga-muted">
              Progression
            </p>
            <p className="text-sm text-ga-muted">
              <span className="font-semibold text-ga-fg">{completed}</span>
              {" / "}
              {total} séances
            </p>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ga-elevated">
            <div
              className="h-full rounded-full bg-ga-lime transition-[width] duration-500 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </section>
      ) : null}

      {data.programJustPublished ? (
        <section className="mt-5 rounded-xl border border-ga-lime/40 bg-ga-lime/10 px-4 py-3 text-sm text-ga-fg">
          Nouveau programme disponible
        </section>
      ) : null}

      {workout ? (
        <section className="ga-fade-in mt-6 rounded-2xl border border-ga-lime/35 bg-ga-elevated p-5 shadow-[0_0_0_1px_rgba(200,241,53,0.06)]">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                today?.kind === "completed"
                  ? "bg-ga-lime text-black"
                  : "bg-ga-lime/15 text-ga-lime"
              }`}
            >
              {today?.kind === "completed"
                ? "Fait"
                : workout.session_type === "rest"
                  ? "Repos"
                  : workout.session_type === "optional"
                    ? "Optionnel"
                    : "Aujourd’hui"}
            </span>
          </div>

          <h2 className="mt-3 text-2xl font-semibold leading-tight tracking-tight">
            {workout.title}
          </h2>

          <div className="mt-4 flex flex-wrap gap-2">
            {formatTime(workout.suggested_time) ? (
              <span className="rounded-lg bg-ga-card px-2.5 py-1 text-xs text-ga-muted">
                {formatTime(workout.suggested_time)} suggéré
              </span>
            ) : null}
            {workout.estimated_minutes ? (
              <span className="rounded-lg bg-ga-card px-2.5 py-1 text-xs text-ga-muted">
                ~ {workout.estimated_minutes} min
              </span>
            ) : null}
            {workout.session_type !== "rest" ? (
              <span className="rounded-lg bg-ga-card px-2.5 py-1 text-xs text-ga-muted">
                {workout.exercises.length} exercice
                {workout.exercises.length > 1 ? "s" : ""}
              </span>
            ) : null}
          </div>

          {today?.kind === "completed" ? (
            <p className="mt-5 text-sm text-ga-muted">
              Séance terminée — bravo.
            </p>
          ) : workout.session_type === "rest" ? (
            workout.rest_details ? (
              <p className="mt-5 text-sm leading-relaxed text-ga-muted">
                {workout.rest_details}
              </p>
            ) : (
              <p className="mt-5 text-sm text-ga-muted">Journée de récupération.</p>
            )
          ) : canStart ? (
            <Link
              href={`/app/seance/${workout.id}`}
              className="mt-5 flex w-full items-center justify-center rounded-xl bg-ga-lime py-3.5 text-sm font-semibold text-black transition hover:bg-lime-300 active:scale-[0.98]"
            >
              Commencer
            </Link>
          ) : null}
        </section>
      ) : (
        <section className="mt-6 rounded-2xl border border-dashed border-ga-border bg-ga-card p-5">
          <p className="font-medium">Pas de séance prévue aujourd’hui</p>
          <Link
            href="/app/programme"
            className="mt-4 inline-flex text-sm font-medium text-ga-lime hover:underline"
          >
            Voir le programme →
          </Link>
        </section>
      )}

      {data.days.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ga-muted">
            Cette semaine
          </h2>
          <div className="mt-4 flex justify-between gap-1">
            {data.days.map((day) => {
              const href =
                day.session.session_type === "workout" ||
                day.session.session_type === "optional"
                  ? `/app/seance/${day.session.id}`
                  : undefined;
              const pill = (
                <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition ${
                      day.kind === "completed"
                        ? "bg-ga-lime text-black"
                        : day.kind === "today"
                          ? "border-2 border-ga-lime bg-ga-lime/10 text-ga-fg"
                          : day.kind === "rest"
                            ? "border border-dashed border-ga-muted text-ga-muted"
                            : day.kind === "missed"
                              ? "border border-ga-amber/50 bg-ga-amber/10 text-ga-amber"
                              : "bg-ga-elevated text-ga-muted"
                    }`}
                  >
                    {weekdayShort(day.session.weekday)}
                  </span>
                  <span className="max-w-[3.25rem] truncate text-center text-[10px] leading-tight text-ga-muted">
                    {dayPillLabel(day)}
                  </span>
                </div>
              );

              return href ? (
                <Link
                  key={day.session.id}
                  href={href}
                  className="min-w-0 flex-1 rounded-lg outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ga-lime/50"
                >
                  {pill}
                </Link>
              ) : (
                <div key={day.session.id} className="min-w-0 flex-1">
                  {pill}
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="mt-8 rounded-2xl border border-dashed border-ga-border bg-ga-card p-5">
          <p className="font-medium">Aucune semaine publiée</p>
          <p className="mt-1.5 text-sm text-ga-muted">
            Ton coach n’a pas encore publié de programme.
          </p>
        </section>
      )}

      {data.overdue ? (
        <section className="mt-8 rounded-2xl border border-ga-amber/40 bg-ga-amber/10 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-ga-amber">
            Séance en retard
          </p>
          <p className="mt-1.5 font-medium text-ga-fg">
            {data.overdue.session.title}
          </p>
          <Link
            href={`/app/seance/${data.overdue.session.id}`}
            className="mt-3 inline-flex text-sm font-medium text-ga-amber transition hover:underline"
          >
            Compléter la séance →
          </Link>
        </section>
      ) : null}

      <AthleteActivitiesSection
        activities={data.activities}
        defaultDate={data.todayISO}
      />
    </div>
  );
}
