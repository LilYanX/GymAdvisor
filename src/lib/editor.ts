import { requireCoach } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { EditorData, EditorOverviewAthlete, EditorWeek } from "@/lib/editor-types";

export type {
  EditorData,
  EditorSession,
  EditorSessionExercise,
  EditorWeek,
} from "@/lib/editor-types";

export async function getEditorData(
  athleteId: string | undefined,
  requestedWeek?: number,
): Promise<
  | { ok: true; data: EditorData }
  | { ok: false; overview: EditorOverviewAthlete[] }
> {
  const { profile } = await requireCoach();
  const supabase = await createClient();

  const { data: athletes } = await supabase
    .from("athletes")
    .select("id, first_name, last_name, email, current_week, total_weeks")
    .eq("coach_id", profile.id)
    .is("archived_at", null)
    .order("first_name");

  const overviewRows = athletes ?? [];
  const athleteIds = overviewRows.map((athlete) => athlete.id);

  const { data: weekRows } = athleteIds.length
    ? await supabase
        .from("program_weeks")
        .select("athlete_id, week_number, status")
        .in("athlete_id", athleteIds)
        .order("week_number", { ascending: false })
    : { data: [] };

  const latestStatusByAthlete = new Map<string, "draft" | "published">();
  for (const week of weekRows ?? []) {
    if (!latestStatusByAthlete.has(week.athlete_id)) {
      latestStatusByAthlete.set(week.athlete_id, week.status);
    }
  }

  const overview = overviewRows.map((athlete) => ({
    ...athlete,
    latestWeekStatus: latestStatusByAthlete.get(athlete.id) ?? null,
  }));

  if (!athleteId) {
    return { ok: false, overview };
  }

  const athlete = overviewRows.find((item) => item.id === athleteId);
  if (!athlete) {
    return { ok: false, overview };
  }

  const { data: athleteFull } = await supabase
    .from("athletes")
    .select("*")
    .eq("id", athleteId)
    .eq("coach_id", profile.id)
    .maybeSingle();

  if (!athleteFull) {
    return { ok: false, overview };
  }

  const list = overviewRows.map(({ id, first_name, last_name }) => ({
    id,
    first_name,
    last_name,
  }));

  const [{ data: exercises }, { data: weeks }] = await Promise.all([
    supabase
      .from("exercises")
      .select("*")
      .eq("coach_id", profile.id)
      .order("name"),
    supabase
      .from("program_weeks")
      .select("week_number")
      .eq("athlete_id", athleteFull.id)
      .order("week_number"),
  ]);

  const availableWeeks = (weeks ?? []).map((week) => week.week_number);
  const maxWeek = availableWeeks.length > 0 ? Math.max(...availableWeeks) : 0;
  const weekNumber =
    requestedWeek && requestedWeek > 0
      ? requestedWeek
      : maxWeek > 0
        ? maxWeek
        : athleteFull.current_week;

  const { data: weekRow } = await supabase
    .from("program_weeks")
    .select("*")
    .eq("athlete_id", athleteFull.id)
    .eq("week_number", weekNumber)
    .maybeSingle();

  let week: EditorWeek | null = null;
  if (weekRow) {
    const { data: sessions } = await supabase
      .from("sessions")
      .select("*")
      .eq("program_week_id", weekRow.id)
      .order("weekday");

    const sessionRows = sessions ?? [];
    const sessionIds = sessionRows.map((session) => session.id);

    const { data: sessionExercises } = sessionIds.length
      ? await supabase
          .from("session_exercises")
          .select("*")
          .in("session_id", sessionIds)
          .order("sort_order")
      : { data: [] };

    const exerciseById = new Map((exercises ?? []).map((item) => [item.id, item]));

    week = {
      ...weekRow,
      sessions: sessionRows.map((session) => ({
        ...session,
        session_exercises: (sessionExercises ?? [])
          .filter((item) => item.session_id === session.id)
          .map((item) => ({
            ...item,
            exercise: exerciseById.get(item.exercise_id) ?? null,
          })),
      })),
    };
  }

  return {
    ok: true,
    data: {
      athlete: athleteFull,
      athletes: list,
      exercises: exercises ?? [],
      week,
      weekNumber,
      availableWeeks,
    },
  };
}
