"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { AthleteDay, AthleteProgram } from "@/lib/athlete-types";
import { weekdayLabel } from "@/lib/labels";
import { formatDayMonth } from "@/lib/dates";
import { AthleteActivitiesSection } from "@/components/athlete/AthleteActivitiesSection";
import {
  MonthCalendar,
  monthStartFromISO,
} from "@/components/calendar/MonthCalendar";

function isTrackable(day: AthleteDay): boolean {
  return (
    day.session.session_type === "workout" ||
    day.session.session_type === "optional"
  );
}

function sessionDateLabel(day: AthleteDay): string {
  const date = day.session.scheduled_date;
  if (date) {
    const weekday = weekdayLabel(day.session.weekday).slice(0, 3).toLowerCase();
    return `${weekday} ${formatDayMonth(date)}`;
  }
  return weekdayLabel(day.session.weekday);
}

export function AthleteHome({ data }: { data: AthleteProgram }) {
  const [monthStart, setMonthStart] = useState(() =>
    monthStartFromISO(data.todayISO),
  );

  const trackable = data.days.filter(isTrackable);
  const plannedCount = trackable.length;
  const todoThisWeek = trackable.filter((day) => day.kind !== "completed");
  const nextSession =
    trackable.find((day) => day.kind === "today" || day.kind === "upcoming") ??
    trackable.find((day) => day.kind === "missed") ??
    null;

  const markers = useMemo(() => {
    const result: Record<
      string,
      { activityCount?: number; hasPlannedSession?: boolean }
    > = {};
    for (const [date, marker] of Object.entries(data.calendarMarkers)) {
      result[date] = {
        activityCount: marker.activityCount,
        hasPlannedSession: marker.hasPlannedSession,
      };
    }
    return result;
  }, [data.calendarMarkers]);

  return (
    <div className="px-5 pb-10 pt-8">
      <header className="ga-fade-in">
        <h1 className="mt-1 text-5xl font-semibold tracking-tight">
          Bonjour, {data.athlete.first_name}
        </h1>
        <p className="mt-2.5 text-lg text-ga-muted">
          Semaine {data.athlete.current_week} / {data.athlete.total_weeks}
        </p>
      </header>

      {data.programJustPublished ? (
        <section className="mt-6 rounded-2xl border border-ga-lime/40 bg-ga-lime/10 px-5 py-4 text-base text-ga-fg">
          Nouveau programme disponible
        </section>
      ) : null}

      <section className="mt-6 rounded-2xl border border-ga-lime/35 bg-ga-lime/10 px-5 py-5">
        {plannedCount > 0 ? (
          <>
            <p className="text-5xl font-semibold text-ga-lime">{plannedCount}</p>
            <p className="mt-2 text-lg leading-snug text-ga-fg">
              séance{plannedCount > 1 ? "s" : ""} programmée
              {plannedCount > 1 ? "s" : ""} cette semaine
              {nextSession ? (
                <>
                  . Prochaine : {nextSession.session.title} —{" "}
                  {sessionDateLabel(nextSession)}
                </>
              ) : (
                "."
              )}
            </p>
          </>
        ) : (
          <>
            <p className="text-lg font-medium">Aucune séance cette semaine</p>
            <Link
              href="/app/programme"
              className="mt-3 inline-flex text-base font-medium text-ga-lime hover:underline"
            >
              Voir le programme →
            </Link>
          </>
        )}
      </section>

      <section className="mt-7">
        <MonthCalendar
          monthStart={monthStart}
          onMonthChange={setMonthStart}
          markers={markers}
          showLegend
          size="lg"
        />
      </section>

      {todoThisWeek.length > 0 ? (
        <section className="mt-7 rounded-2xl border border-ga-border bg-ga-card p-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-ga-muted">
            À faire cette semaine
          </p>
          <ul className="mt-3 flex flex-col gap-3">
            {todoThisWeek.map((day) => (
              <li key={day.session.id}>
                <Link
                  href={`/app/seance/${day.session.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg py-1.5 text-lg hover:text-ga-lime"
                >
                  <span className="font-semibold text-ga-fg">
                    {day.session.title}
                  </span>
                  <span className="shrink-0 text-sm text-ga-muted">
                    {sessionDateLabel(day)} →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <AthleteActivitiesSection
        activities={data.activities}
        defaultDate={data.todayISO}
        size="lg"
      />
    </div>
  );
}
