import { createClient } from "@/lib/supabase/server";
import { isoWeekday, todayISO, yesterdayISO } from "@/lib/dates";
import type {
  Athlete,
  Exercise,
  ProgramWeek,
  Session,
  SessionExercise,
  SessionExerciseLog,
  SessionLog,
  SetLog,
} from "@/lib/supabase/models";
import type {
  AthleteDay,
  AthleteExercise,
  AthleteProgram,
  AthleteSessionView,
  DayKind,
} from "@/lib/athlete-types";

export type {
  AthleteDay,
  AthleteExercise,
  AthleteProgram,
  AthleteSessionView,
  DayKind,
} from "@/lib/athlete-types";

function dayDate(session: Session): string | null {
  return session.scheduled_date;
}

function isToday(session: Session, today: string): boolean {
  if (session.scheduled_date) return session.scheduled_date === today;
  return session.weekday === isoWeekday(today);
}

function isPast(session: Session, today: string): boolean {
  if (session.scheduled_date) return session.scheduled_date < today;
  return session.weekday < isoWeekday(today);
}

function kindFor(session: AthleteSessionView, today: string): DayKind {
  if (session.session_type === "rest") return "rest";
  if (session.log?.status === "completed" || session.log?.status === "skipped") {
    return "completed";
  }
  if (isToday(session, today)) return "today";
  if (isPast(session, today) && session.session_type === "workout") return "missed";
  return "upcoming";
}

async function loadWeekDays(
  athlete: Athlete,
): Promise<{ week: ProgramWeek | null; days: AthleteDay[] }> {
  const supabase = await createClient();
  const today = todayISO();

  const { data: weeks } = await supabase
    .from("program_weeks")
    .select("*")
    .eq("athlete_id", athlete.id)
    .eq("status", "published")
    .order("week_number");

  const published = weeks ?? [];
  const week =
    published.find((item) => item.week_number === athlete.current_week) ??
    published.at(-1) ??
    null;

  if (!week) return { week: null, days: [] };

  const { data: sessions } = await supabase
    .from("sessions")
    .select("*")
    .eq("program_week_id", week.id)
    .order("weekday");

  const sessionRows = sessions ?? [];
  if (sessionRows.length === 0) return { week, days: [] };

  const sessionIds = sessionRows.map((session) => session.id);

  const [{ data: logs }, { data: sessionExercises }] = await Promise.all([
    supabase.from("session_logs").select("*").eq("athlete_id", athlete.id).in("session_id", sessionIds),
    supabase
      .from("session_exercises")
      .select("*")
      .in("session_id", sessionIds)
      .order("sort_order"),
  ]);

  const exerciseIds = [
    ...new Set((sessionExercises ?? []).map((item) => item.exercise_id)),
  ];
  const { data: exercises } =
    exerciseIds.length > 0
      ? await supabase.from("exercises").select("*").in("id", exerciseIds)
      : { data: [] };

  const exerciseById = new Map((exercises ?? []).map((item) => [item.id, item]));
  const logBySession = new Map((logs ?? []).map((item) => [item.session_id, item]));

  const days: AthleteDay[] = sessionRows.map((session) => {
    const view: AthleteSessionView = {
      ...session,
      log: logBySession.get(session.id) ?? null,
      exercises: (sessionExercises ?? [])
        .filter((item) => item.session_id === session.id)
        .map((item) => ({
          ...item,
          exercise: exerciseById.get(item.exercise_id) ?? null,
          log: null,
          sets: [],
        })),
    };
    return { session: view, kind: kindFor(view, today) };
  });

  return { week, days };
}

export async function getAthleteProgram(
  athlete: Athlete,
): Promise<AthleteProgram> {
  const supabase = await createClient();
  const today = todayISO();
  const yesterday = yesterdayISO();

  const { data: coach } = await supabase
    .from("profiles")
    .select("first_name")
    .eq("id", athlete.coach_id)
    .maybeSingle();

  const { week, days } = await loadWeekDays(athlete);
  const todayDay = days.find((day) => isToday(day.session, today)) ?? null;
  const overdue =
    days.find(
      (day) =>
        day.session.session_type === "workout" &&
        dayDate(day.session) === yesterday &&
        day.kind === "missed",
    ) ??
    days.find((day) => day.kind === "missed") ??
    null;

  const programJustPublished = Boolean(
    week?.published_at &&
      Date.now() - new Date(week.published_at).getTime() < 7 * 24 * 60 * 60 * 1000,
  );

  return {
    athlete,
    coachFirstName: coach?.first_name || "ton coach",
    week,
    days,
    today: todayDay,
    overdue,
    programJustPublished,
  };
}

export async function getAthleteSession(
  athlete: Athlete,
  sessionId: string,
): Promise<AthleteSessionView | null> {
  const supabase = await createClient();
  const { data: session } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();
  if (!session) return null;

  const { data: week } = await supabase
    .from("program_weeks")
    .select("*")
    .eq("id", session.program_week_id)
    .maybeSingle();
  if (!week || week.athlete_id !== athlete.id || week.status !== "published") {
    return null;
  }

  const [{ data: sessionExercises }, { data: log }] = await Promise.all([
    supabase
      .from("session_exercises")
      .select("*")
      .eq("session_id", session.id)
      .order("sort_order"),
    supabase
      .from("session_logs")
      .select("*")
      .eq("session_id", session.id)
      .eq("athlete_id", athlete.id)
      .maybeSingle(),
  ]);

  const items = sessionExercises ?? [];
  const ids = items.map((item) => item.id);
  const exerciseIds = [...new Set(items.map((item) => item.exercise_id))];

  const [{ data: exercises }, { data: setLogs }, { data: exerciseLogs }] =
    await Promise.all([
      exerciseIds.length
        ? supabase.from("exercises").select("*").in("id", exerciseIds)
        : Promise.resolve({ data: [] }),
      ids.length
        ? supabase
            .from("set_logs")
            .select("*")
            .eq("athlete_id", athlete.id)
            .in("session_exercise_id", ids)
            .order("set_number")
        : Promise.resolve({ data: [] }),
      ids.length
        ? supabase
            .from("session_exercise_logs")
            .select("*")
            .eq("athlete_id", athlete.id)
            .in("session_exercise_id", ids)
        : Promise.resolve({ data: [] }),
    ]);

  const exerciseById = new Map((exercises ?? []).map((item) => [item.id, item]));
  const feedbackById = new Map(
    (exerciseLogs ?? []).map((item) => [item.session_exercise_id, item]),
  );

  return {
    ...session,
    log: log ?? null,
    exercises: items.map((item) => ({
      ...item,
      exercise: exerciseById.get(item.exercise_id) ?? null,
      log: feedbackById.get(item.id) ?? null,
      sets: (setLogs ?? []).filter((set) => set.session_exercise_id === item.id),
    })),
  };
}
