import { createClient } from "@/lib/supabase/server";
import {
  addDaysISO,
  mondayOfWeekISO,
  todayISO,
} from "@/lib/dates";
import {
  mean as mcleanMean,
  mcleanTotal,
  stdDev,
  type McLeanScores,
} from "@/lib/mclean";
import {
  sessionDurationMinutes,
  sessionLoadUnits,
} from "@/lib/session-timing";
import type {
  AthleteActivity,
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

export type DashboardPeriod = "day" | "week" | "month";

export type FeelingAverages = {
  fatigue: number | null;
  sleep: number | null;
  soreness: number | null;
  stress: number | null;
  mood: number | null;
  /** Score McLean moyen sur la période (5–25). */
  totalScore: number | null;
  /** Moyenne personnelle (historique ~28 check-ins). */
  baselineMean: number | null;
  /** Écart-type personnel. */
  baselineSd: number | null;
  /** Seuil d’alerte = moyenne − 1 écart-type. */
  alertThreshold: number | null;
  alert: boolean;
  count: number;
};

export type FeelingSeriesPoint = {
  key: string;
  label: string;
  totalScore: number | null;
  fatigue: number | null;
  sleep: number | null;
  soreness: number | null;
  stress: number | null;
  mood: number | null;
  count: number;
};

export type ZoneLoad = {
  zone: MuscleGroup;
  label: string;
  tonnageKg: number;
  percent: number;
  setsCount: number;
};

export type UaSeriesPoint = {
  key: string;
  label: string;
  /** UA complémentaire : durée × RPE moyen exercices. */
  ua: number;
  /** UA principale Foster : durée × RPE de séance (final ou activité). */
  uaFinal: number;
  avgRpe: number | null;
  finalRpe: number | null;
};

/** Ratio de charge aiguë (7 j) / chronique (moy. hebdo sur 28 j). */
export type AcuteChronicRatio = {
  acute: number;
  chronic: number;
  ratio: number | null;
  /** false si < 4 semaines avec charge dans la fenêtre 28 j. */
  sufficientData: boolean;
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
  /** Somme des UA Foster (RPE séance) sur la période. */
  uaFinalTotal: number;
  uaSeries: UaSeriesPoint[];
  acwr: AcuteChronicRatio;
};

export type AthleteDashboardBundle = {
  day: AthleteDashboardMetrics;
  week: AthleteDashboardMetrics;
  month: AthleteDashboardMetrics;
  referenceDate: string;
};

type SessionUa = {
  sessionId: string;
  title: string;
  date: string;
  ua: number;
  uaFinal: number;
  /** Charge pour ACWR (Foster prioritaire). */
  load: number;
  avgRpe: number | null;
  finalRpe: number | null;
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
  referenceDate: string = todayISO(),
): { from: string; to: string } {
  if (period === "day") {
    return { from: referenceDate, to: referenceDate };
  }
  if (period === "week") {
    const from = mondayOfWeekISO(referenceDate);
    return { from, to: addDaysISO(from, 6) };
  }
  const from = `${referenceDate.slice(0, 7)}-01`;
  const [year, month] = from.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { from, to: `${from.slice(0, 7)}-${String(lastDay).padStart(2, "0")}` };
}

function feelingBucketKey(isoDate: string, _period: DashboardPeriod): string {
  return isoDate;
}

function feelingBucketLabel(key: string, period: DashboardPeriod): string {
  if (period === "day" || period === "week") {
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
  const blank = {
    totalScore: null as number | null,
    fatigue: null as number | null,
    sleep: null as number | null,
    soreness: null as number | null,
    stress: null as number | null,
    mood: null as number | null,
    count: 0,
  };
  if (period === "day") {
    feeling.push({
      key: from,
      label: feelingBucketLabel(from, period),
      ...blank,
    });
    return feeling;
  }
  if (period === "week") {
    for (let i = 0; i < 7; i += 1) {
      const key = addDaysISO(from, i);
      feeling.push({
        key,
        label: feelingBucketLabel(key, period),
        ...blank,
      });
    }
  } else {
    // Mensuel : une courbe quotidienne pour le score McLean
    let cursor = from;
    while (cursor <= to) {
      feeling.push({
        key: cursor,
        label: feelingBucketLabel(cursor, "day"),
        ...blank,
      });
      cursor = addDaysISO(cursor, 1);
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
  const weeksWithLoad = new Set<string>();

  for (const session of sessions) {
    if (session.date < chronicFrom || session.date > today) continue;
    const load = session.load;
    if (load <= 0) continue;
    chronicSum += load;
    weeksWithLoad.add(mondayOfWeekISO(session.date));
    if (session.date >= acuteFrom) acute += load;
  }

  const sufficientData = weeksWithLoad.size >= 4;
  const chronic = round1(chronicSum / 4);
  acute = round1(acute);
  return {
    acute,
    chronic,
    sufficientData,
    ratio:
      sufficientData && chronic > 0 ? round1(acute / chronic) : null,
  };
}

export async function computeAthleteDashboard(
  athleteId: string,
  period: DashboardPeriod,
  referenceDate: string = todayISO(),
): Promise<AthleteDashboardMetrics> {
  const today = referenceDate;
  const { from, to } = periodRange(period, referenceDate);
  const supabase = await createClient();
  const acwrWindowStart = addDaysISO(today, -27);
  const activitiesFrom = from < acwrWindowStart ? from : acwrWindowStart;
  const activitiesTo = to > today ? to : today;

  const [{ data: checkIns }, { data: setLogs }, { data: sessionLogs }, { data: weeks }, { data: activitiesData }] =
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
      supabase
        .from("athlete_activities")
        .select("*")
        .eq("athlete_id", athleteId)
        .gte("performed_on", activitiesFrom)
        .lte("performed_on", activitiesTo),
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
    {
      fatigue: number[];
      sleep: number[];
      soreness: number[];
      stress: number[];
      mood: number[];
      totals: number[];
    }
  >();
  const periodTotals: number[] = [];
  const allFatigue: number[] = [];
  const allSleep: number[] = [];
  const allSoreness: number[] = [];
  const allStress: number[] = [];
  const allMood: number[] = [];

  const historyTotals: number[] = [];
  for (const row of checkInRows) {
    const scores: McLeanScores = {
      fatigue: row.fatigue,
      sleep: row.sleep,
      soreness: row.soreness,
      stress: row.stress,
      mood: row.mood,
    };
    historyTotals.push(mcleanTotal(scores));
  }
  const baselineMean = mcleanMean(historyTotals);
  const baselineSd = stdDev(historyTotals);
  const alertThreshold =
    baselineMean != null && baselineSd != null
      ? round1(baselineMean - baselineSd)
      : null;

  for (const row of checkInRows) {
    const date =
      (row.session_id ? sessionMetaById.get(row.session_id)?.date : null) ??
      row.created_at.slice(0, 10);
    if (date < from || date > to) continue;
    const scores: McLeanScores = {
      fatigue: row.fatigue,
      sleep: row.sleep,
      soreness: row.soreness,
      stress: row.stress,
      mood: row.mood,
    };
    const total = mcleanTotal(scores);
    const key = feelingBucketKey(date, period);
    const bucket = feelingBuckets.get(key) ?? {
      fatigue: [],
      sleep: [],
      soreness: [],
      stress: [],
      mood: [],
      totals: [],
    };
    bucket.fatigue.push(scores.fatigue);
    bucket.sleep.push(scores.sleep);
    bucket.soreness.push(scores.soreness);
    bucket.stress.push(scores.stress);
    bucket.mood.push(scores.mood);
    bucket.totals.push(total);
    feelingBuckets.set(key, bucket);
    allFatigue.push(scores.fatigue);
    allSleep.push(scores.sleep);
    allSoreness.push(scores.soreness);
    allStress.push(scores.stress);
    allMood.push(scores.mood);
    periodTotals.push(total);
  }

  const feelingSeries = emptyFeelingSeries(period, from, to).map((point) => {
    const bucket = feelingBuckets.get(point.key);
    if (!bucket) return point;
    return {
      ...point,
      totalScore: avg(bucket.totals),
      fatigue: avg(bucket.fatigue),
      sleep: avg(bucket.sleep),
      soreness: avg(bucket.soreness),
      stress: avg(bucket.stress),
      mood: avg(bucket.mood),
      count: bucket.totals.length,
    };
  });

  const periodFeelingScore = avg(periodTotals);
  const feelingAlert =
    periodFeelingScore != null &&
    alertThreshold != null &&
    periodFeelingScore < alertThreshold;

  const zoneTonnage = new Map<MuscleGroup, number>();
  const zoneSets = new Map<MuscleGroup, number>();
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
      zoneSets.set(
        exercise.muscle_group,
        (zoneSets.get(exercise.muscle_group) ?? 0) + 1,
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

  // UA Foster (primaire = RPE séance) + UA moy. exercices (complémentaire)
  // + activités libres, sur 28 j (ACWR) + période affichée
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
    const avgRpe =
      rpes.length > 0
        ? rpes.reduce((a, b) => a + b, 0) / rpes.length
        : null;

    const log = logBySession.get(sessionId);
    const finalRpe =
      log?.final_rpe != null && Number.isFinite(log.final_rpe)
        ? Number(log.final_rpe)
        : null;

    const actualMinutes = sessionDurationMinutes(
      log?.started_at,
      log?.completed_at,
    );
    const minutes = actualMinutes ?? meta?.estimatedMinutes ?? 0;
    const ua = avgRpe != null ? sessionLoadUnits(minutes, avgRpe) : 0;
    const uaFinal =
      finalRpe != null ? sessionLoadUnits(minutes, finalRpe) : 0;
    const load = uaFinal > 0 ? uaFinal : ua;
    if (load <= 0) continue;

    allSessionUas.push({
      sessionId,
      title: meta?.title ?? "Séance",
      date,
      ua,
      uaFinal,
      load,
      avgRpe: avgRpe != null ? round1(avgRpe) : null,
      finalRpe,
    });
  }

  const activityRows = (activitiesData ?? []) as AthleteActivity[];
  for (const activity of activityRows) {
    if (activity.rpe == null || activity.rpe <= 0) continue;
    if (
      activity.performed_on < acwrFrom ||
      activity.performed_on > today
    ) {
      continue;
    }
    const uaFinal = sessionLoadUnits(
      activity.duration_minutes,
      activity.rpe,
    );
    if (uaFinal <= 0) continue;
    allSessionUas.push({
      sessionId: `activity:${activity.id}`,
      title: activity.name,
      date: activity.performed_on,
      ua: 0,
      uaFinal,
      load: uaFinal,
      avgRpe: null,
      finalRpe: activity.rpe,
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
  const uaFinalTotal = round1(
    periodSessions.reduce((sum, session) => sum + session.uaFinal, 0),
  );

  let uaSeries: UaSeriesPoint[];
  if (period === "day" || period === "week") {
    uaSeries = periodSessions.map((session) => ({
      key: session.sessionId,
      label: `${shortWeekday(session.date)} ${truncateLabel(session.title, 10)}`,
      ua: round1(session.ua),
      uaFinal: round1(session.uaFinal),
      avgRpe: session.avgRpe,
      finalRpe: session.finalRpe,
    }));
  } else {
    const weekBuckets = new Map<
      string,
      {
        ua: number;
        uaFinal: number;
        rpes: number[];
        finalRpes: number[];
        label: string;
      }
    >();
    let cursor = mondayOfWeekISO(from);
    while (cursor <= to) {
      weekBuckets.set(cursor, {
        ua: 0,
        uaFinal: 0,
        rpes: [],
        finalRpes: [],
        label: feelingBucketLabel(cursor, "month"),
      });
      cursor = addDaysISO(cursor, 7);
    }
    for (const session of periodSessions) {
      const key = mondayOfWeekISO(session.date);
      const bucket = weekBuckets.get(key);
      if (!bucket) continue;
      bucket.ua += session.ua;
      bucket.uaFinal += session.uaFinal;
      if (session.avgRpe != null) bucket.rpes.push(session.avgRpe);
      if (session.finalRpe != null) bucket.finalRpes.push(session.finalRpe);
    }
    uaSeries = [...weekBuckets.entries()].map(([key, bucket]) => ({
      key,
      label: bucket.label,
      ua: round1(bucket.ua),
      uaFinal: round1(bucket.uaFinal),
      avgRpe: avg(bucket.rpes),
      finalRpe: avg(bucket.finalRpes),
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
      setsCount: zoneSets.get(zone) ?? 0,
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

  const periodFinalRpes = periodSessions
    .map((session) => session.finalRpe)
    .filter((value): value is number => value != null);

  return {
    period,
    from,
    to,
    kpis: {
      sessionsCompleted,
      sessionsPlanned,
      volumeKg: Math.round(zonesTotal),
      avgRpe: avg(periodFinalRpes),
      feelingScore: periodFeelingScore,
    },
    feeling: {
      fatigue: avg(allFatigue),
      sleep: avg(allSleep),
      soreness: avg(allSoreness),
      stress: avg(allStress),
      mood: avg(allMood),
      totalScore: periodFeelingScore,
      baselineMean: baselineMean != null ? round1(baselineMean) : null,
      baselineSd: baselineSd != null ? round1(baselineSd) : null,
      alertThreshold,
      alert: feelingAlert,
      count: periodTotals.length,
    },
    feelingSeries,
    zones,
    uaTotal,
    uaFinalTotal,
    uaSeries,
    acwr: computeAcwr(allSessionUas, today),
  };
}

export async function getAthleteDashboardBundle(
  athleteId: string,
  referenceDate: string = todayISO(),
): Promise<AthleteDashboardBundle> {
  const [day, week, month] = await Promise.all([
    computeAthleteDashboard(athleteId, "day", referenceDate),
    computeAthleteDashboard(athleteId, "week", referenceDate),
    computeAthleteDashboard(athleteId, "month", referenceDate),
  ]);
  return { day, week, month, referenceDate };
}
