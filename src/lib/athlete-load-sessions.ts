import { createClient } from "@/lib/supabase/server";
import { sessionPerformedDate } from "@/lib/dates";
import type { CumulativeLoadSession } from "@/components/athlete/CumulativeLoadChart";
import type {
  Session,
  SessionExercise,
  SessionLog,
  SetLog,
} from "@/lib/supabase/models";

/** Séances avec tonnage pour la courbe de charges cumulées (pdv sportif/coach). */
export async function getAthleteCumulativeLoadSessions(
  athleteId: string,
): Promise<CumulativeLoadSession[]> {
  const supabase = await createClient();

  const { data: setLogs } = await supabase
    .from("set_logs")
    .select("session_exercise_id, weight_kg, reps, completed")
    .eq("athlete_id", athleteId)
    .eq("completed", true);

  const setRows = (setLogs ?? []) as Pick<
    SetLog,
    "session_exercise_id" | "weight_kg" | "reps" | "completed"
  >[];
  if (setRows.length === 0) return [];

  const seIds = [...new Set(setRows.map((set) => set.session_exercise_id))];
  const { data: sessionExercises } = await supabase
    .from("session_exercises")
    .select("id, session_id")
    .in("id", seIds);

  const seRows = (sessionExercises ?? []) as Pick<
    SessionExercise,
    "id" | "session_id"
  >[];
  const sessionIds = [...new Set(seRows.map((item) => item.session_id))];
  if (sessionIds.length === 0) return [];

  const [{ data: sessions }, { data: logs }] = await Promise.all([
    supabase
      .from("sessions")
      .select("id, scheduled_date")
      .in("id", sessionIds),
    supabase
      .from("session_logs")
      .select("session_id, started_at, completed_at")
      .eq("athlete_id", athleteId)
      .in("session_id", sessionIds),
  ]);

  const sessionById = new Map(
    ((sessions ?? []) as Pick<Session, "id" | "scheduled_date">[]).map(
      (session) => [session.id, session],
    ),
  );
  const logBySession = new Map(
    ((logs ?? []) as Pick<
      SessionLog,
      "session_id" | "started_at" | "completed_at"
    >[]).map((log) => [log.session_id, log]),
  );
  const sessionIdBySe = new Map(seRows.map((row) => [row.id, row.session_id]));

  const tonnageBySession = new Map<string, number>();
  for (const set of setRows) {
    if (set.weight_kg == null || set.reps == null) continue;
    const sessionId = sessionIdBySe.get(set.session_exercise_id);
    if (!sessionId) continue;
    tonnageBySession.set(
      sessionId,
      (tonnageBySession.get(sessionId) ?? 0) + set.weight_kg * set.reps,
    );
  }

  const result: CumulativeLoadSession[] = [];
  for (const [sessionId, tonnageKg] of tonnageBySession) {
    if (tonnageKg <= 0) continue;
    const session = sessionById.get(sessionId);
    const date = sessionPerformedDate(
      logBySession.get(sessionId),
      session?.scheduled_date ?? null,
    );
    result.push({
      sessionId,
      date,
      tonnageKg: Math.round(tonnageKg),
    });
  }

  return result.sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
}
