import { requireCoach } from "@/lib/auth";
import { bestEstimatedOneRm } from "@/lib/one-rm-formula";
import { createClient } from "@/lib/supabase/server";
import type {
  EditorData,
  EditorOverviewAthlete,
  EditorWeek,
  PreviousWeekPerf,
} from "@/lib/editor-types";
import type { Exercise, SessionExercise, SetLog } from "@/lib/supabase/models";

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

  const [{ data: exercises }, { data: weeks }, { data: athleteSetLogs }] =
    await Promise.all([
      supabase.from("exercises").select("*").order("name"),
      supabase
        .from("program_weeks")
        .select("week_number")
        .eq("athlete_id", athleteFull.id)
        .order("week_number"),
      supabase
        .from("set_logs")
        .select("weight_kg, reps, completed, session_exercise_id")
        .eq("athlete_id", athleteFull.id)
        .eq("completed", true),
    ]);

  const setLogRows = (athleteSetLogs ?? []) as Pick<
    SetLog,
    "weight_kg" | "reps" | "completed" | "session_exercise_id"
  >[];
  const seIdsForOneRm = [
    ...new Set(setLogRows.map((set) => set.session_exercise_id)),
  ];
  const { data: seForOneRm } = seIdsForOneRm.length
    ? await supabase
        .from("session_exercises")
        .select("id, exercise_id")
        .in("id", seIdsForOneRm)
    : { data: [] as Pick<SessionExercise, "id" | "exercise_id">[] };

  const exerciseIdBySe = new Map(
    ((seForOneRm ?? []) as Pick<SessionExercise, "id" | "exercise_id">[]).map(
      (row) => [row.id, row.exercise_id],
    ),
  );
  const exerciseByIdForOneRm = new Map(
    ((exercises ?? []) as Exercise[]).map((item) => [item.id, item]),
  );
  const setsByExerciseId = new Map<
    string,
    Array<{ weight_kg: number | null; reps: number | null }>
  >();
  for (const set of setLogRows) {
    const exerciseId = exerciseIdBySe.get(set.session_exercise_id);
    if (!exerciseId) continue;
    const list = setsByExerciseId.get(exerciseId) ?? [];
    list.push({ weight_kg: set.weight_kg, reps: set.reps });
    setsByExerciseId.set(exerciseId, list);
  }
  const estimatedOneRmByExerciseId: Record<string, number> = {};
  for (const [exerciseId, sets] of setsByExerciseId) {
    const formula = exerciseByIdForOneRm.get(exerciseId)?.one_rm_formula;
    const best = bestEstimatedOneRm(formula, sets);
    if (best != null) estimatedOneRmByExerciseId[exerciseId] = best;
  }

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

  const previousWeekPerf = await loadPreviousWeekPerf(
    supabase,
    athleteFull.id,
    weekNumber - 1,
    (exercises ?? []) as Exercise[],
  );

  return {
    ok: true,
    data: {
      athlete: athleteFull,
      athletes: list,
      exercises: exercises ?? [],
      estimatedOneRmByExerciseId,
      week,
      weekNumber,
      availableWeeks,
      previousWeekPerf,
    },
  };
}

async function loadPreviousWeekPerf(
  supabase: Awaited<ReturnType<typeof createClient>>,
  athleteId: string,
  previousWeekNumber: number,
  exercises: Exercise[],
): Promise<PreviousWeekPerf | null> {
  if (previousWeekNumber < 1) return null;

  const { data: prevWeek } = await supabase
    .from("program_weeks")
    .select("id, week_number")
    .eq("athlete_id", athleteId)
    .eq("week_number", previousWeekNumber)
    .maybeSingle();

  if (!prevWeek) return null;

  const { data: sessions } = await supabase
    .from("sessions")
    .select("*")
    .eq("program_week_id", prevWeek.id)
    .in("session_type", ["workout", "optional"])
    .order("weekday");

  const sessionRows = sessions ?? [];
  if (sessionRows.length === 0) {
    return { weekNumber: previousWeekNumber, sessions: [] };
  }

  const sessionIds = sessionRows.map((session) => session.id);
  const { data: sessionExercises } = await supabase
    .from("session_exercises")
    .select("*")
    .in("session_id", sessionIds)
    .order("sort_order");

  const seRows = sessionExercises ?? [];
  const seIds = seRows.map((item) => item.id);

  const { data: setLogs } = seIds.length
    ? await supabase
        .from("set_logs")
        .select("*")
        .eq("athlete_id", athleteId)
        .in("session_exercise_id", seIds)
        .order("set_number")
    : { data: [] };

  const exerciseById = new Map(exercises.map((item) => [item.id, item]));
  const setsBySe = new Map<string, SetLog[]>();
  for (const set of (setLogs ?? []) as SetLog[]) {
    const list = setsBySe.get(set.session_exercise_id) ?? [];
    list.push(set);
    setsBySe.set(set.session_exercise_id, list);
  }

  return {
    weekNumber: previousWeekNumber,
    sessions: sessionRows.map((session) => ({
      sessionId: session.id,
      title: session.title,
      weekday: session.weekday,
      scheduledDate: session.scheduled_date,
      exercises: seRows
        .filter((item) => item.session_id === session.id)
        .map((item) => {
          const sets = setsBySe.get(item.id) ?? [];
          return {
            sessionExerciseId: item.id,
            exerciseName:
              exerciseById.get(item.exercise_id)?.name ?? "Exercice",
            prescribedSets: item.sets_count,
            prescribedReps: item.target_reps,
            prescribedUnit: item.target_unit ?? "reps",
            prescribedWeightKg: item.target_weight_kg,
            sets: sets.map((set) => ({
              setNumber: set.set_number,
              weightKg: set.weight_kg,
              reps: set.reps,
              completed: set.completed,
            })),
          };
        }),
    })),
  };
}
