import { createClient } from "@/lib/supabase/server";
import {
  currentMonthLabel,
  firstOfMonthISO,
  formatDayMonth,
  formatWeekdayLong,
  todayISO,
} from "@/lib/dates";
import type {
  Athlete,
  Payment,
  ProgramWeek,
  Session,
  SessionCheckIn,
  SessionLog,
} from "@/lib/supabase/models";
import type { AthleteStatus } from "@/lib/dashboard-types";

export type { AthleteStatus } from "@/lib/dashboard-types";

export type DashboardAthleteRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  goal: string;
  initials: string;
  lastSessionLabel: string | null;
  status: AthleteStatus;
  weekDone: number;
  weekTotal: number;
  sessionsLeft: number;
  nextWeekNumber: number;
  overdueSince: string | null;
  needsProgram: boolean;
};

export type DashboardTodo = {
  id: string;
  athleteId: string;
  kind: Exclude<AthleteStatus, "up_to_date">;
  title: string;
  detail: string;
  href: string;
};

export type DashboardData = {
  athletes: DashboardAthleteRow[];
  todos: DashboardTodo[];
  kpis: {
    active: number;
    upToDate: number;
    late: number;
    toPrepare: number;
  };
};

export async function getDashboardData(coachId: string): Promise<DashboardData> {
  const supabase = await createClient();
  const today = todayISO();
  const periodStart = firstOfMonthISO();

  const { data: athletesData, error: athletesError } = await supabase
    .from("athletes")
    .select("*")
    .eq("coach_id", coachId)
    .is("archived_at", null)
    .order("first_name");

  if (athletesError) {
    throw new Error(athletesError.message);
  }

  const athletes = (athletesData ?? []) as Athlete[];
  if (athletes.length === 0) {
    return {
      athletes: [],
      todos: [],
      kpis: { active: 0, upToDate: 0, late: 0, toPrepare: 0 },
    };
  }

  const athleteIds = athletes.map((athlete) => athlete.id);

  const [
    { data: weeksData },
    { data: logsData },
    { data: paymentsData },
    { data: feelingsData },
  ] = await Promise.all([
    supabase.from("program_weeks").select("*").in("athlete_id", athleteIds),
    supabase.from("session_logs").select("*").in("athlete_id", athleteIds),
    supabase
      .from("payments")
      .select("*")
      .in("athlete_id", athleteIds)
      .eq("period_start", periodStart),
    supabase
      .from("session_check_ins")
      .select("*")
      .in("athlete_id", athleteIds)
      .eq("needs_attention", true)
      .order("created_at", { ascending: false }),
  ]);

  const weeks = (weeksData ?? []) as ProgramWeek[];
  const logs = (logsData ?? []) as SessionLog[];
  const payments = (paymentsData ?? []) as Payment[];
  const attentionFeelings = (feelingsData ?? []) as SessionCheckIn[];
  const latestAttentionByAthlete = new Map<string, SessionCheckIn>();
  for (const feeling of attentionFeelings) {
    if (!latestAttentionByAthlete.has(feeling.athlete_id)) {
      latestAttentionByAthlete.set(feeling.athlete_id, feeling);
    }
  }

  const weekIds = weeks.map((week) => week.id);
  const { data: sessionsData } = weekIds.length
    ? await supabase.from("sessions").select("*").in("program_week_id", weekIds)
    : { data: [] as Session[] };

  const sessions = (sessionsData ?? []) as Session[];

  const rows = athletes.map((athlete) =>
    buildAthleteRow(
      athlete,
      weeks,
      sessions,
      logs,
      payments,
      today,
      latestAttentionByAthlete.has(athlete.id),
    ),
  );

  const todos: DashboardTodo[] = [];
  for (const row of rows) {
    if (row.overdueSince) {
      todos.push({
        id: `late-${row.id}`,
        athleteId: row.id,
        kind: "late",
        title: `Relancer ${row.firstName}`,
        detail: `Pas de retour depuis ${formatWeekdayLong(row.overdueSince).toLowerCase()}`,
        href: `/sportifs/${row.id}`,
      });
    }
    if (latestAttentionByAthlete.has(row.id)) {
      todos.push({
        id: `feeling-${row.id}`,
        athleteId: row.id,
        kind: "feeling",
        title: `Ressenti bas — ${row.firstName}`,
        detail: "Énergie, sommeil, motivation ou douleurs à surveiller",
        href: `/sportifs/${row.id}`,
      });
    }
    if (row.needsProgram) {
      todos.push({
        id: `prepare-${row.id}`,
        athleteId: row.id,
        kind: "prepare",
        title: `Préparer la semaine ${row.nextWeekNumber} de ${row.firstName}`,
        detail: "La suite du programme n’est pas encore prête",
        href: `/editeur?athlete=${row.id}`,
      });
    } else if (row.sessionsLeft > 0 && row.sessionsLeft <= 2 && row.weekTotal > 0) {
      todos.push({
        id: `two-left-${row.id}`,
        athleteId: row.id,
        kind: "two_left",
        title: `Plus que ${row.sessionsLeft} séance${row.sessionsLeft > 1 ? "s" : ""} pour ${row.firstName}`,
        detail: "Prépare la suite du programme avant la fin de la semaine",
        href: `/editeur?athlete=${row.id}`,
      });
    }
    if (row.status === "payment") {
      todos.push({
        id: `pay-${row.id}`,
        athleteId: row.id,
        kind: "payment",
        title: `${row.firstName} - paiement ${currentMonthLabel()} en attente`,
        detail: "Relancer ou vérifier le règlement",
        href: `/sportifs/${row.id}`,
      });
    }
  }

  return {
    athletes: rows,
    todos,
    kpis: {
      active: rows.length,
      upToDate: rows.filter((row) => row.status === "up_to_date").length,
      late: rows.filter((row) => row.overdueSince).length,
      toPrepare: rows.filter((row) => row.needsProgram).length,
    },
  };
}

function buildAthleteRow(
  athlete: Athlete,
  weeks: ProgramWeek[],
  sessions: Session[],
  logs: SessionLog[],
  payments: Payment[],
  today: string,
  lowFeeling: boolean,
): DashboardAthleteRow {
  const pendingPayment = hasPendingPayment(athlete.id, payments);
  const overdue = oldestOverdueDate(athlete, weeks, sessions, logs, today);
  const prepare = needsPrepare(athlete, weeks, sessions, today);
  const { done, total } = weekProgress(athlete, weeks, sessions, logs);
  const sessionsLeft = Math.max(total - done, 0);

  let status: AthleteStatus = "up_to_date";
  if (pendingPayment) status = "payment";
  else if (overdue) status = "late";
  else if (lowFeeling) status = "feeling";
  else if (prepare || (sessionsLeft > 0 && sessionsLeft <= 2 && total > 0)) {
    status = prepare ? "prepare" : "two_left";
  }

  const lastSession = lastCompletedDate(athlete.id, sessions, logs);

  return {
    id: athlete.id,
    firstName: athlete.first_name,
    lastName: athlete.last_name,
    email: athlete.email,
    goal: athlete.goal,
    initials: initials(athlete.first_name, athlete.last_name),
    lastSessionLabel: lastSession ? formatDayMonth(lastSession) : null,
    status,
    weekDone: done,
    weekTotal: total,
    sessionsLeft,
    nextWeekNumber: nextWeekNumber(athlete, weeks),
    overdueSince: overdue,
    needsProgram: prepare,
  };
}

function initials(firstName: string, lastName: string): string {
  const first = firstName.trim().charAt(0);
  const last = lastName.trim().charAt(0);
  if (first && last) return `${first}${last}`.toUpperCase();
  return firstName.trim().slice(0, 2).toUpperCase() || "?";
}

function athleteWeeks(athleteId: string, weeks: ProgramWeek[]): ProgramWeek[] {
  return weeks.filter((week) => week.athlete_id === athleteId);
}

function publishedWeeks(athleteId: string, weeks: ProgramWeek[]): ProgramWeek[] {
  return athleteWeeks(athleteId, weeks).filter(
    (week) => week.status === "published",
  );
}

function maxPublishedWeek(athleteId: string, weeks: ProgramWeek[]): number {
  const published = publishedWeeks(athleteId, weeks);
  if (published.length === 0) return 0;
  return Math.max(...published.map((week) => week.week_number));
}

function nextWeekNumber(athlete: Athlete, weeks: ProgramWeek[]): number {
  return maxPublishedWeek(athlete.id, weeks) + 1;
}

function weekSessions(
  week: ProgramWeek | undefined,
  sessions: Session[],
): Session[] {
  if (!week) return [];
  return sessions.filter((session) => session.program_week_id === week.id);
}

function needsPrepare(
  athlete: Athlete,
  weeks: ProgramWeek[],
  sessions: Session[],
  today: string,
): boolean {
  const all = athleteWeeks(athlete.id, weeks);
  const maxPub = maxPublishedWeek(athlete.id, weeks);
  if (maxPub === 0) return true;
  if (all.some((week) => week.week_number > maxPub)) return false;

  const lastWeek = publishedWeeks(athlete.id, weeks).find(
    (week) => week.week_number === maxPub,
  );
  const dates = weekSessions(lastWeek, sessions)
    .map((session) => session.scheduled_date)
    .filter((date): date is string => Boolean(date));

  if (dates.length > 0) {
    return dates.every((date) => date <= today);
  }

  return athlete.current_week >= maxPub;
}

function hasPendingPayment(athleteId: string, payments: Payment[]): boolean {
  return payments.some(
    (payment) => payment.athlete_id === athleteId && payment.status === "pending",
  );
}

function oldestOverdueDate(
  athlete: Athlete,
  weeks: ProgramWeek[],
  sessions: Session[],
  logs: SessionLog[],
  today: string,
): string | null {
  const publishedIds = new Set(
    publishedWeeks(athlete.id, weeks).map((week) => week.id),
  );
  const overdueDates: string[] = [];

  for (const session of sessions) {
    if (!publishedIds.has(session.program_week_id)) continue;
    if (session.session_type !== "workout") continue;
    if (!session.scheduled_date || session.scheduled_date >= today) continue;

    const log = logs.find((item) => item.session_id === session.id);
    if (log?.status === "completed" || log?.status === "skipped") continue;
    overdueDates.push(session.scheduled_date);
  }

  if (overdueDates.length === 0) return null;
  return overdueDates.sort()[0];
}

function lastCompletedDate(
  athleteId: string,
  sessions: Session[],
  logs: SessionLog[],
): string | null {
  const completed = logs.filter(
    (log) => log.athlete_id === athleteId && log.status === "completed",
  );
  const dates: string[] = [];
  for (const log of completed) {
    if (log.completed_at) {
      dates.push(log.completed_at.slice(0, 10));
      continue;
    }
    const session = sessions.find((item) => item.id === log.session_id);
    if (session?.scheduled_date) dates.push(session.scheduled_date);
  }
  if (dates.length === 0) return null;
  return dates.sort().at(-1) ?? null;
}

function weekProgress(
  athlete: Athlete,
  weeks: ProgramWeek[],
  sessions: Session[],
  logs: SessionLog[],
): { done: number; total: number } {
  const published = publishedWeeks(athlete.id, weeks);
  const current =
    published.find((week) => week.week_number === athlete.current_week) ??
    published.find(
      (week) => week.week_number === maxPublishedWeek(athlete.id, weeks),
    );
  const workouts = weekSessions(current, sessions).filter(
    (session) => session.session_type === "workout",
  );
  const done = workouts.filter((session) =>
    logs.some(
      (log) => log.session_id === session.id && log.status === "completed",
    ),
  ).length;
  return { done, total: workouts.length };
}
