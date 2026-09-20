import { createClient } from "@/lib/supabase/server";
import {
  addDaysISO,
  firstOfMonthISO,
  mondayOfWeekISO,
  todayISO,
} from "@/lib/dates";
import {
  sessionDurationMinutes,
  sessionLoadUnits,
} from "@/lib/session-timing";
import type {
  Exercise,
  MuscleGroup,
  Session,
  SessionCheckIn,
  SessionExercise,
  SessionExerciseLog,
  SessionLog,
  SetLog,
} from "@/lib/supabase/models";
import { MUSCLE_GROUP_LABELS } from "@/lib/labels";

export type DashboardPeriod = "week" | "month";

export type FeelingAverages = {
  energy: number | null;
  sleep: number | null;
  pain: number | null;
  motivation: number | null;
  count: number;
};

export type FeelingSeriesPoint = {
  key: string;
  label: string;
  energy: number | null;
  sleep: number | null;
  pain: number | null;
  motivation: number | null;
  count: number;
};

export type ZoneLoad = {
  zone: MuscleGroup;
  label: string;
  tonnageKg: number;
  percent: number;
};

export type UaSeriesPoint = {
  key: string;
  label: string;
  ua: number;
  avgRpe: number | null;
};

/** Ratio de charge aiguë (7 j) / chronique (moy. hebdo sur 28 j). */
export type AcuteChronicRatio = {
  acute: number;
  chronic: number;
  ratio: number | null;
};

export type DashboardKpis = {
  sessionsCompleted: number;
  sessionsPlanned: number;
  volumeKg: number;
  avgRpe: number | null;
  feelingScore: number | null;
};

export type AthleteDashboardMetrics = {
  period: DashboardPeriod;
  from: string;
  to: string;
  kpis: DashboardKpis;
  feeling: FeelingAverages;
  feelingSeries: FeelingSeriesPoint[];
  zones: ZoneLoad[];
  uaTotal: number;
  uaSeries: UaSeriesPoint[];
  acwr: AcuteChronicRatio;
};

export type AthleteDashboardBundle = {
  week: AthleteDashboardMetrics;
  month: AthleteDashboardMetrics;
};

type SessionUa = {
  sessionId: string;
  title: string;
  date: string;
  ua: number;
  avgRpe: number;
};

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function avg(values: number[]): number | null {
  if (values.length === 0) return null;
  return round1(values.reduce((a, b) => a + b, 0) / values.length);
}

export function periodRange(
  period: DashboardPeriod,
  today: string = todayISO(),
): { from: string; to: string } {
  if (period === "week") {
    const from = mondayOfWeekISO(today);
    return { from, to: addDaysISO(from, 6) };
  }
  const from = firstOfMonthISO();
  const [year, month] = from.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { from, to: `${from.slice(0, 7)}-${String(lastDay).padStart(2, "0")}` };
}

function feelingBucketKey(isoDate: string, period: DashboardPeriod): string {
  if (period === "week") return isoDate;
  return mondayOfWeekISO(isoDate);
}

function feelingBucketLabel(key: string, period: DashboardPeriod): string {
  if (period === "week") {
    return new Intl.DateTimeFormat("fr-FR", {
      weekday: "short",
      day: "2-digit",
    }).format(new Date(`${key}T12:00:00`));
  }
  const end = addDaysISO(key, 6);
  const fmt = new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
  });
  return `${fmt.format(new Date(`${key}T12:00:00`))}–${fmt.format(new Date(`${end}T12:00:00`))}`;
}

function emptyFeelingSeries(
  period: DashboardPeriod,
  from: string,
  to: string,
): FeelingSeriesPoint[] {
  const feeling: FeelingSeriesPoint[] = [];
  if (period === "week") {
    for (let i = 0; i < 7; i += 1) {
      const key = addDaysISO(from, i);
      feeling.push({
        key,
        label: feelingBucketLabel(key, period),
        energy: null,
        sleep: null,
        pain: null,
        motivation: null,
        count: 0,
      });
    }
  } else {
    let cursor = mondayOfWeekISO(from);
    while (cursor <= to) {
      feeling.push({
        key: cursor,
        label: feelingBucketLabel(cursor, period),
        energy: null,
        sleep: null,
        pain: null,
        motivation: null,
        count: 0,
      });
      cursor = addDaysISO(cursor, 7);
    }
  }
  return feeling;
}

function shortWeekday(isoDate: string): string {
  return new Intl.DateTimeFormat("fr-FR", { weekday: "short" }).format(
    new Date(`${isoDate}T12:00:00`),
  );
}

function truncateLabel(value: string, max = 14): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

function computeAcwr(sessions: SessionUa[], today: string): AcuteChronicRatio {
  const acuteFrom = addDaysISO(today, -6);
  const chronicFrom = addDaysISO(today, -27);

  let acute = 0;
  let chronicSum = 0;
  for (const session of sessions) {
    if (session.date < chronicFrom || session.date > today) continue;
    chronicSum += session.ua;
    if (session.date >= acuteFrom) acute += session.ua;
  }

  const chronic = round1(chronicSum / 4);
  acute = round1(acute);
  return {
    acute,
    chronic,
    ratio: chronic > 0 ? round1(acute / chronic) : null,
  };
}

export async function computeAthleteDashboard(
  athleteId: string,
  period: DashboardPeriod,
): Promise<AthleteDashboardMetrics> {
  const today = todayISO();
  const { from, to } = periodRange(period, today);
  const supabase = await createClient();

  const [{ data: checkIns }, { data: setLogs }, { data: sessionLogs }, { data: weeks }] =
    await Promise.all([
      supabase
        .from("session_check_ins")
        .select("*")
        .eq("athlete_id", athleteId),
      supabase
        .from("set_logs")
        .select("*")
        .eq("athlete_id", athleteId)
        .eq("completed", true),
      supabase
        .from("session_logs")
        .select("*")
        .eq("athlete_id", athleteId),
      supabase
        .from("program_weeks")
        .select("id")
        .eq("athlete_id", athleteId),
    ]);

  const weekIds = (weeks ?? []).map((week) => week.id);
  const { data: plannedSessionsData } = weekIds.length
    ? await supabase
        .from("sessions")
        .select("id, scheduled_date, session_type")
        .in("program_week_id", weekIds)
        .gte("scheduled_date", from)
        .lte("scheduled_date", to)
    : { data: [] as Pick<Session, "id" | "scheduled_date" | "session_type">[] };

  const plannedSessions = (
    (plannedSessionsData ?? []) as Pick<
      Session,
      "id" | "scheduled_date" | "session_type"
    >[]
  ).filter(
    (session) =>
      session.session_type === "workout" || session.session_type === "optional",
  );

  const checkInRows = (checkIns ?? []) as SessionCheckIn[];
  const setRows = (setLogs ?? []) as SetLog[];
  const logRows = (sessionLogs ?? []) as SessionLog[];
  const seIds = [...new Set(setRows.map((set) => set.session_exercise_id))];
  const checkInSessionIds = [
    ...new Set(
      checkInRows
        .map((item) => item.session_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const logSessionIds = [...new Set(logRows.map((item) => item.session_id))];
  const sessionIdsForDates = [
    ...new Set([...checkInSessionIds, ...logSessionIds]),
  ];

  const [{ data: sessionExercises }, { data: datedSessions }] =
    await Promise.all([
      seIds.length
        ? supabase.from("session_exercises").select("*").in("id", seIds)
        : Promise.resolve({ data: [] as SessionExercise[] }),
      sessionIdsForDates.length
        ? supabase
            .from("sessions")
            .select("id, title, scheduled_date, estimated_minutes")
            .in("id", sessionIdsForDates)
        : Promise.resolve({
            data: [] as Pick<
              Session,
              "id" | "title" | "scheduled_date" | "estimated_minutes"
            >[],
          }),
    ]);

  const seRows = (sessionExercises ?? []) as SessionExercise[];
  const exerciseIds = [...new Set(seRows.map((item) => item.exercise_id))];
  const sessionIds = [...new Set(seRows.map((item) => item.session_id))];

  const [{ data: exercises }, { data: sessions }, { data: exerciseLogs }] =
    await Promise.all([
      exerciseIds.length
        ? supabase.from("exercises").select("*").in("id", exerciseIds)
        : Promise.resolve({ data: [] as Exercise[] }),
      sessionIds.length
        ? supabase
            .from("sessions")
            .select("id, title, scheduled_date, estimated_minutes")
            .in("id", sessionIds)
        : Promise.resolve({
            data: [] as Pick<
              Session,
              "id" | "title" | "scheduled_date" | "estimated_minutes"
            >[],
          }),
      seIds.length
        ? supabase
            .from("session_exercise_logs")
            .select("*")
            .eq("athlete_id", athleteId)
            .in("session_exercise_id", seIds)
        : Promise.resolve({ data: [] as SessionExerciseLog[] }),
    ]);

  const exerciseById = new Map(
    ((exercises ?? []) as Exercise[]).map((item) => [item.id, item]),
  );
  const sessionMetaById = new Map<
    string,
    {
      title: string;
      date: string | null;
      estimatedMinutes: number | null;
    }
  >();
  for (const session of [
    ...((sessions ?? []) as Pick<
      Session,
      "id" | "title" | "scheduled_date" | "estimated_minutes"
    >[]),
    ...((datedSessions ?? []) as Pick<
      Session,
      "id" | "title" | "scheduled_date" | "estimated_minutes"
    >[]),
  ]) {
    sessionMetaById.set(session.id, {
      title: session.title,
      date: session.scheduled_date,
      estimatedMinutes: session.estimated_minutes,
    });
  }
  const seById = new Map(seRows.map((item) => [item.id, item]));
  const rpeBySe = new Map(
    ((exerciseLogs ?? []) as SessionExerciseLog[]).map((log) => [
      log.session_exercise_id,
      log.rpe,
    ]),
  );
  const logBySession = new Map(logRows.map((log) => [log.session_id, log]));

  const feelingBuckets = new Map<
    string,
    { energy: number[]; sleep: number[]; pain: number[]; motivation: number[] }
  >();
  const allEnergy: number[] = [];
  const allSleep: number[] = [];
  const allPain: number[] = [];
  const allMotivation: number[] = [];

  for (const row of checkInRows) {
    const date =
      (row.session_id ? sessionMetaById.get(row.session_id)?.date : null) ??
      row.created_at.slice(0, 10);
    if (date < from || date > to) continue;
    const key = feelingBucketKey(date, period);
    const bucket = feelingBuckets.get(key) ?? {
      energy: [],
      sleep: [],
      pain: [],
      motivation: [],
    };
    bucket.energy.push(row.energy);
    bucket.sleep.push(row.sleep);
    bucket.pain.push(row.pain);
    bucket.motivation.push(row.motivation);
    feelingBuckets.set(key, bucket);
    allEnergy.push(row.energy);
    allSleep.push(row.sleep);
    allPain.push(row.pain);
    allMotivation.push(row.motivation);
  }

  const feelingSeries = emptyFeelingSeries(period, from, to).map((point) => {
    const bucket = feelingBuckets.get(point.key);
    if (!bucket) return point;
    return {
      ...point,
      energy: avg(bucket.energy),
      sleep: avg(bucket.sleep),
      pain: avg(bucket.pain),
      motivation: avg(bucket.motivation),
      count: bucket.energy.length,
    };
  });

  const zoneTonnage = new Map<MuscleGroup, number>();
  const rpesBySession = new Map<string, number[]>();

  for (const set of setRows) {
    if (set.weight_kg == null || set.reps == null) continue;
    const se = seById.get(set.session_exercise_id);
    if (!se) continue;
    const date = sessionMetaById.get(se.session_id)?.date;
    if (!date || date < from || date > to) continue;

    const tonnage = set.weight_kg * set.reps;
    const exercise = exerciseById.get(se.exercise_id);
    if (exercise) {
      zoneTonnage.set(
        exercise.muscle_group,
        (zoneTonnage.get(exercise.muscle_group) ?? 0) + tonnage,
      );
    }
  }

  for (const [seId, rpe] of rpeBySe) {
    if (rpe == null) continue;
    const se = seById.get(seId);
    if (!se) continue;
    const list = rpesBySession.get(se.session_id) ?? [];
    list.push(rpe);
    rpesBySession.set(se.session_id, list);
  }

  // UA par séance sur 28 j (pour ACWR) + période affichée
  const acwrFrom = addDaysISO(today, -27);
  const allSessionUas: SessionUa[] = [];

  const candidateSessionIds = new Set<string>([
    ...rpesBySession.keys(),
    ...logRows.map((log) => log.session_id),
  ]);

  for (const sessionId of candidateSessionIds) {
    const meta = sessionMetaById.get(sessionId);
    const date = meta?.date;
    if (!date || date < acwrFrom || date > today) continue;

    const rpes = rpesBySession.get(sessionId) ?? [];
    if (rpes.length === 0) continue;
    const avgRpe = rpes.reduce((a, b) => a + b, 0) / rpes.length;

    const log = logBySession.get(sessionId);
    const actualMinutes = sessionDurationMinutes(
      log?.started_at,
      log?.completed_at,
    );
    const minutes = actualMinutes ?? meta?.estimatedMinutes ?? 0;
    const ua = sessionLoadUnits(minutes, avgRpe);
    if (ua <= 0) continue;

    allSessionUas.push({
      sessionId,
      title: meta?.title ?? "Séance",
      date,
      ua,
      avgRpe: round1(avgRpe),
    });
  }

  allSessionUas.sort((a, b) =>
    a.date === b.date
      ? a.title.localeCompare(b.title, "fr")
      : a.date.localeCompare(b.date),
  );

  const periodSessions = allSessionUas.filter(
    (session) => session.date >= from && session.date <= to,
  );
  const uaTotal = round1(
    periodSessions.reduce((sum, session) => sum + session.ua, 0),
  );

  let uaSeries: UaSeriesPoint[];
  if (period === "week") {
    uaSeries = periodSessions.map((session) => ({
      key: session.sessionId,
      label: `${shortWeekday(session.date)} ${truncateLabel(session.title, 10)}`,
      ua: round1(session.ua),
      avgRpe: session.avgRpe,
    }));
  } else {
    const weekBuckets = new Map<
      string,
      { ua: number; rpes: number[]; label: string }
    >();
    let cursor = mondayOfWeekISO(from);
    while (cursor <= to) {
      weekBuckets.set(cursor, {
        ua: 0,
        rpes: [],
        label: feelingBucketLabel(cursor, "month"),
      });
      cursor = addDaysISO(cursor, 7);
    }
    for (const session of periodSessions) {
      const key = mondayOfWeekISO(session.date);
      const bucket = weekBuckets.get(key);
      if (!bucket) continue;
      bucket.ua += session.ua;
      bucket.rpes.push(session.avgRpe);
    }
    uaSeries = [...weekBuckets.entries()].map(([key, bucket]) => ({
      key,
      label: bucket.label,
      ua: round1(bucket.ua),
      avgRpe: avg(bucket.rpes),
    }));
  }

  const zonesTotal = [...zoneTonnage.values()].reduce((a, b) => a + b, 0);
  const zones: ZoneLoad[] = [...zoneTonnage.entries()]
    .map(([zone, tonnageKg]) => ({
      zone,
      label: MUSCLE_GROUP_LABELS[zone],
      tonnageKg: Math.round(tonnageKg),
      percent:
        zonesTotal > 0
          ? Math.round((tonnageKg / zonesTotal) * 1000) / 10
          : 0,
    }))
    .sort((a, b) => b.tonnageKg - a.tonnageKg);

  const completedIds = new Set(
    logRows
      .filter((log) => log.status === "completed")
      .map((log) => log.session_id),
  );
  const sessionsPlanned = plannedSessions.length;
  const sessionsCompleted = plannedSessions.filter((session) =>
    completedIds.has(session.id),
  ).length;

  const periodRpes = periodSessions.map((session) => session.avgRpe);
  const feelingScoreValues: number[] = [];
  for (let i = 0; i < allEnergy.length; i += 1) {
    feelingScoreValues.push(
      (allEnergy[i] +
        allSleep[i] +
        allMotivation[i] +
        (6 - allPain[i])) /
        4,
    );
  }

  return {
    period,
    from,
    to,
    kpis: {
      sessionsCompleted,
      sessionsPlanned,
      volumeKg: Math.round(zonesTotal),
      avgRpe: avg(periodRpes),
      feelingScore: avg(feelingScoreValues),
    },
    feeling: {
      energy: avg(allEnergy),
      sleep: avg(allSleep),
      pain: avg(allPain),
      motivation: avg(allMotivation),
      count: allEnergy.length,
    },
    feelingSeries,
    zones,
    uaTotal,
    uaSeries,
    acwr: computeAcwr(allSessionUas, today),
  };
}

export async function getAthleteDashboardBundle(
  athleteId: string,
): Promise<AthleteDashboardBundle> {
  const [week, month] = await Promise.all([
    computeAthleteDashboard(athleteId, "week"),
    computeAthleteDashboard(athleteId, "month"),
  ]);
  return { week, month };
}
