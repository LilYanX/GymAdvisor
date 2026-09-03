import { createClient } from "@/lib/supabase/server";
import { firstOfMonthISO, todayISO, addDaysISO, formatPeriodLabel } from "@/lib/dates";
import {
  getAthletePaymentState,
  paymentSettingsFromProfile,
  paymentWindow,
} from "@/lib/payments";
import type {
  Athlete,
  AthleteActivity,
  Exercise,
  Payment,
  Session,
  SessionCheckIn,
  SessionExercise,
  SessionExerciseLog,
  SessionLog,
  SetLog,
} from "@/lib/supabase/models";
import type {
  AthleteFollowUp,
  FeedbackItem,
  SessionFeeling,
  TonnageExercise,
  TonnageSession,
} from "@/lib/athlete-followup-types";

export type {
  AthleteFollowUp,
  FeedbackItem,
  TonnageExercise,
  TonnageSession,
} from "@/lib/athlete-followup-types";

export {
  isPaymentBlocked,
  paymentWindow,
  getPaymentDisplayStatus,
  getAthletePaymentState,
  paymentSettingsFromProfile,
  PAYMENT_DISPLAY_LABELS,
} from "@/lib/payments";
export type { PaymentDisplayStatus, PaymentSettings } from "@/lib/payments";

export async function getAthleteFollowUp(
  coachId: string,
  athleteId: string,
): Promise<AthleteFollowUp | null> {
  const supabase = await createClient();
  const today = todayISO();

  const { data: athlete } = await supabase
    .from("athletes")
    .select("*")
    .eq("id", athleteId)
    .eq("coach_id", coachId)
    .maybeSingle();

  if (!athlete) return null;

  const { data: coachProfile } = await supabase
    .from("profiles")
    .select("payment_due_day, payment_block_after_days")
    .eq("id", coachId)
    .maybeSingle();

  const paymentSettings = paymentSettingsFromProfile(coachProfile);
  const { dueDate, graceEnd } = paymentWindow(today, paymentSettings);

  const [
    { data: athletePayments },
    { data: sessionFeelingsData },
    { data: activitiesData },
    { data: weeks },
  ] = await Promise.all([
    supabase
      .from("payments")
      .select("*")
      .eq("athlete_id", athleteId)
      .order("period_start", { ascending: false }),
    supabase
      .from("session_check_ins")
      .select("*")
      .eq("athlete_id", athleteId)
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("athlete_activities")
      .select("*")
      .eq("athlete_id", athleteId)
      .order("performed_on", { ascending: false })
      .limit(20),
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
        .in("session_type", ["workout", "optional"])
        .order("scheduled_date", { ascending: false })
    : { data: [] as Session[] };

  const sessions = (sessionsData ?? []) as Session[];
  const sessionIds = sessions.map((session) => session.id);
  const sessionById = new Map(sessions.map((session) => [session.id, session]));

  const feelings: SessionFeeling[] = (
    (sessionFeelingsData ?? []) as SessionCheckIn[]
  ).map((item) => {
    const session = sessionById.get(item.session_id);
    return {
      ...item,
      sessionTitle: session?.title ?? "Séance",
      sessionDate: session?.scheduled_date ?? null,
    };
  });

  // Enrich titles for check-ins whose sessions weren't in the published workout list
  const missingFeelingSessionIds = feelings
    .filter((item) => item.sessionTitle === "Séance")
    .map((item) => item.session_id);
  if (missingFeelingSessionIds.length > 0) {
    const { data: extraSessions } = await supabase
      .from("sessions")
      .select("id, title, scheduled_date")
      .in("id", missingFeelingSessionIds);
    for (const session of extraSessions ?? []) {
      sessionById.set(session.id, session as Session);
    }
    for (const feeling of feelings) {
      const session = sessionById.get(feeling.session_id);
      if (session) {
        feeling.sessionTitle = session.title;
        feeling.sessionDate = session.scheduled_date;
      }
    }
  }

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

  const payments = (athletePayments ?? []) as Payment[];
  const paymentState = getAthletePaymentState(payments, today, paymentSettings);

  return {
    athlete: athlete as Athlete,
    payment: paymentState.currentPayment,
    paymentBlocked: paymentState.blocked,
    paymentDisplayStatus: paymentState.displayStatus,
    overdueMonthLabels: paymentState.overduePeriods.map(formatPeriodLabel),
    paymentDueDate: dueDate,
    paymentGraceEnd: graceEnd,
    sessionFeelings: feelings,
    activities: (activitiesData ?? []) as AthleteActivity[],
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
