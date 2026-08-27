import { createClient } from "@/lib/supabase/server";
import { firstOfMonthISO, todayISO, addDaysISO } from "@/lib/dates";
import type {
  Athlete,
  CheckIn,
  Payment,
  Session,
  SessionExercise,
  SessionExerciseLog,
  SessionLog,
  SetLog,
  Exercise,
} from "@/lib/supabase/models";
import type {
  AthleteFollowUp,
  FeedbackItem,
  TonnageExercise,
  TonnageSession,
} from "@/lib/athlete-followup-types";

export type {
  AthleteFollowUp,
  FeedbackItem,
  TonnageExercise,
  TonnageSession,
} from "@/lib/athlete-followup-types";

/** Échéance le 25 du mois, grâce jusqu’au 30 (J+5). */
export function paymentWindow(isoDate: string = todayISO()): {
  periodStart: string;
  dueDate: string;
  graceEnd: string;
} {
  const ym = isoDate.slice(0, 7);
  return {
    periodStart: `${ym}-01`,
    dueDate: `${ym}-25`,
    graceEnd: `${ym}-30`,
  };
}

export function isPaymentBlocked(
  payment: Payment | null | undefined,
  today: string = todayISO(),
): boolean {
  const { dueDate, graceEnd } = paymentWindow(today);
  if (today < dueDate) return false;
  if (payment?.status === "paid") return false;
  return today > graceEnd;
}

export async function getAthleteFollowUp(
  coachId: string,
  athleteId: string,
): Promise<AthleteFollowUp | null> {
  const supabase = await createClient();
  const today = todayISO();
  const { periodStart, dueDate, graceEnd } = paymentWindow(today);

  const { data: athlete } = await supabase
    .from("athletes")
    .select("*")
    .eq("id", athleteId)
    .eq("coach_id", coachId)
    .maybeSingle();

  if (!athlete) return null;

  const [
    { data: payment },
    { data: checkIns },
    { data: weeks },
  ] = await Promise.all([
    supabase
      .from("payments")
      .select("*")
      .eq("athlete_id", athleteId)
      .eq("period_start", periodStart)
      .maybeSingle(),
    supabase
      .from("check_ins")
      .select("*")
      .eq("athlete_id", athleteId)
      .order("week_start_date", { ascending: false })
      .limit(8),
    supabase
      .from("program_weeks")
      .select("id")
      .eq("athlete_id", athleteId)
      .eq("status", "published"),
  ]);

  const weekIds = (weeks ?? []).map((week) => week.id);
  const { data: sessionsData } = weekIds.length
    ? await supabase
        .from("sessions")
        .select("*")
        .in("program_week_id", weekIds)
        .eq("session_type", "workout")
        .order("scheduled_date", { ascending: false })
    : { data: [] as Session[] };

  const sessions = (sessionsData ?? []) as Session[];
  const sessionIds = sessions.map((session) => session.id);

  const [{ data: logs }, { data: sessionExercises }] = await Promise.all([
    sessionIds.length
      ? supabase.from("session_logs").select("*").in("session_id", sessionIds)
      : Promise.resolve({ data: [] as SessionLog[] }),
    sessionIds.length
      ? supabase
          .from("session_exercises")
          .select("*")
          .in("session_id", sessionIds)
          .order("sort_order")
      : Promise.resolve({ data: [] as SessionExercise[] }),
  ]);

  const seIds = (sessionExercises ?? []).map((item) => item.id);
  const exerciseIds = [
    ...new Set((sessionExercises ?? []).map((item) => item.exercise_id)),
  ];

  const [{ data: setLogs }, { data: exerciseLogs }, { data: exercises }] =
    await Promise.all([
      seIds.length
        ? supabase.from("set_logs").select("*").in("session_exercise_id", seIds)
        : Promise.resolve({ data: [] as SetLog[] }),
      seIds.length
        ? supabase
            .from("session_exercise_logs")
            .select("*")
            .in("session_exercise_id", seIds)
        : Promise.resolve({ data: [] as SessionExerciseLog[] }),
      exerciseIds.length
        ? supabase.from("exercises").select("*").in("id", exerciseIds)
        : Promise.resolve({ data: [] as Exercise[] }),
    ]);

  const exerciseById = new Map(
    ((exercises ?? []) as Exercise[]).map((exercise) => [exercise.id, exercise]),
  );
  const setsBySe = new Map<string, SetLog[]>();
  for (const set of (setLogs ?? []) as SetLog[]) {
    const list = setsBySe.get(set.session_exercise_id) ?? [];
    list.push(set);
    setsBySe.set(set.session_exercise_id, list);
  }
  const logBySe = new Map(
    ((exerciseLogs ?? []) as SessionExerciseLog[]).map((log) => [
      log.session_exercise_id,
      log,
    ]),
  );
  const sessionLogBySession = new Map(
    ((logs ?? []) as SessionLog[]).map((log) => [log.session_id, log]),
  );

  const feedbacks: FeedbackItem[] = [];
  const tonnageSessions: TonnageSession[] = [];

  for (const session of sessions) {
    const ses = ((sessionExercises ?? []) as SessionExercise[]).filter(
      (item) => item.session_id === session.id,
    );
    const exercisesTonnage: TonnageExercise[] = [];
    let sessionTonnage = 0;
    const rpes: number[] = [];

    for (const se of ses) {
      const exercise = exerciseById.get(se.exercise_id);
      const sets = setsBySe.get(se.id) ?? [];
      let tonnage = 0;
      let setsCompleted = 0;
      for (const set of sets) {
        if (!set.completed) continue;
        setsCompleted += 1;
        if (set.weight_kg != null && set.reps != null) {
          tonnage += set.weight_kg * set.reps;
        }
      }
      sessionTonnage += tonnage;
      exercisesTonnage.push({
        exerciseId: se.exercise_id,
        exerciseName: exercise?.name ?? "Exercice",
        tonnageKg: Math.round(tonnage),
        setsCompleted,
      });

      const elog = logBySe.get(se.id);
      if (elog?.rpe != null) rpes.push(elog.rpe);
      if (elog && (elog.rpe != null || elog.comment)) {
        feedbacks.push({
          sessionId: session.id,
          sessionTitle: session.title,
          sessionDate: session.scheduled_date,
          exerciseName: exercise?.name ?? "Exercice",
          rpe: elog.rpe,
          comment: elog.comment,
        });
      }
    }

    const avgRpe =
      rpes.length > 0 ? rpes.reduce((a, b) => a + b, 0) / rpes.length : 0;
    const minutes = session.estimated_minutes ?? 0;
    const loadUnits = Math.round(minutes * (avgRpe / 10) * 10) / 10;
    const completed = sessionLogBySession.get(session.id)?.status === "completed";

    if (completed || sessionTonnage > 0 || loadUnits > 0) {
      tonnageSessions.push({
        sessionId: session.id,
        title: session.title,
        date: session.scheduled_date,
        tonnageKg: Math.round(sessionTonnage),
        loadUnits,
        exercises: exercisesTonnage.filter((item) => item.tonnageKg > 0),
      });
    }
  }

  const totals = tonnageSessions.reduce(
    (acc, session) => ({
      tonnageKg: acc.tonnageKg + session.tonnageKg,
      loadUnits: acc.loadUnits + session.loadUnits,
    }),
    { tonnageKg: 0, loadUnits: 0 },
  );
  totals.loadUnits = Math.round(totals.loadUnits * 10) / 10;

  return {
    athlete: athlete as Athlete,
    payment: (payment as Payment | null) ?? null,
    paymentBlocked: isPaymentBlocked(payment as Payment | null, today),
    paymentDueDate: dueDate,
    paymentGraceEnd: graceEnd,
    checkIns: (checkIns ?? []) as CheckIn[],
    feedbacks,
    sessions: tonnageSessions,
    totals,
  };
}

export function daysUntil(isoDate: string, from: string = todayISO()): number {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${isoDate}T00:00:00Z`);
  return Math.round((b - a) / 86_400_000);
}

export { firstOfMonthISO, addDaysISO, todayISO };
