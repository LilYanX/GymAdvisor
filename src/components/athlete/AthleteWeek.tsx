import Link from "next/link";
import type { AthleteProgram } from "@/lib/athlete-types";
import { weekdayLabel } from "@/lib/labels";

export function AthleteWeek({ data }: { data: AthleteProgram }) {
  return (
    <div className="px-5 pb-6 pt-8">
      <p className="text-sm text-ga-muted">Ton programme</p>
      <h1 className="mt-1 text-3xl font-semibold">
        Semaine {data.week?.week_number ?? data.athlete.current_week}
      </h1>

      {data.days.length === 0 ? (
        <p className="mt-6 text-sm text-ga-muted">
          Aucun programme publié pour le moment.
        </p>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {data.days.map((day) => {
            const session = day.session;
            const href =
              session.session_type === "workout"
                ? `/app/seance/${session.id}`
                : undefined;
            const badge =
              day.kind === "completed"
                ? { label: "Fait", className: "bg-ga-lime/15 text-ga-lime" }
                : day.kind === "rest"
                  ? { label: "Repos", className: "border border-dashed border-ga-muted text-ga-muted" }
                  : day.kind === "today"
                    ? { label: "Aujourd’hui", className: "bg-ga-lime/15 text-ga-lime" }
                    : { label: "À venir", className: "bg-ga-elevated text-ga-muted" };

            const details =
              session.session_type === "rest"
                ? session.rest_details || "Récupération"
                : day.kind === "completed"
                  ? `${session.exercises.length} exercices`
                  : `${session.exercises.length} exercices${session.estimated_minutes ? ` · ~${session.estimated_minutes} min` : ""}`;

            const content = (
              <article className="rounded-2xl border border-ga-border bg-ga-card p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-ga-muted">
                    {weekdayLabel(session.weekday).slice(0, 3)}
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-xs ${badge.className}`}>
                    {badge.label}
                  </span>
                </div>
                <h2 className="mt-2 font-semibold">{session.title}</h2>
                <p className="mt-1 text-sm text-ga-muted">{details}</p>
              </article>
            );

            return href ? (
              <Link key={session.id} href={href}>
                {content}
              </Link>
            ) : (
              <div key={session.id}>{content}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
