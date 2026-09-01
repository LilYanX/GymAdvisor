"use server";

import { revalidatePath } from "next/cache";
import { requireCoach } from "@/lib/auth";
import { addDaysISO, mondayOfWeekISO } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import type { SessionType } from "@/lib/supabase/models";

function revalidateEditor() {
  revalidatePath("/editeur");
  revalidatePath("/");
  revalidatePath("/sportifs");
}

async function getOwnedAthlete(athleteId: string) {
  const { profile } = await requireCoach();
  const supabase = await createClient();
  const { data: athlete } = await supabase
    .from("athletes")
    .select("*")
    .eq("id", athleteId)
    .eq("coach_id", profile.id)
    .maybeSingle();

  if (!athlete) {
    return { error: "Sportif introuvable." as const, athlete: null, supabase, profile };
  }
  return { error: null, athlete, supabase, profile };
}

export async function ensureDraftWeek(athleteId: string, weekNumber: number) {
  const owned = await getOwnedAthlete(athleteId);
  if (owned.error || !owned.athlete) return { error: owned.error ?? "Erreur." };

  const { supabase } = owned;
  const { data: existing } = await supabase
    .from("program_weeks")
    .select("id")
    .eq("athlete_id", athleteId)
    .eq("week_number", weekNumber)
    .maybeSingle();

  if (existing) {
    revalidateEditor();
    return { error: null, weekId: existing.id };
  }

  const { data, error } = await supabase
    .from("program_weeks")
    .insert({
      athlete_id: athleteId,
      week_number: weekNumber,
      status: "draft",
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Impossible de créer la semaine." };
  }

  revalidateEditor();
  return { error: null, weekId: data.id };
}

export async function addSession(weekId: string, weekday: number, title: string) {
  const { profile } = await requireCoach();
  const supabase = await createClient();

  const { data: week } = await supabase
    .from("program_weeks")
    .select("id, athlete_id")
    .eq("id", weekId)
    .maybeSingle();
  if (!week) return { error: "Semaine introuvable." };

  const owned = await getOwnedAthlete(week.athlete_id);
  if (owned.error) return { error: owned.error };

  const { count } = await supabase
    .from("sessions")
    .select("id", { count: "exact", head: true })
    .eq("program_week_id", weekId);

  const { error } = await supabase.from("sessions").insert({
    program_week_id: weekId,
    weekday,
    title: title.trim() || `Jour ${(count ?? 0) + 1}`,
    session_type: "workout",
    sort_order: weekday,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Ce jour existe déjà dans la semaine." };
    }
    return { error: error.message };
  }

  void profile;
  return { error: null };
}

export async function updateSession(
  sessionId: string,
  patch: { title?: string; session_type?: SessionType; rest_details?: string },
) {
  await requireCoach();
  const supabase = await createClient();
  const { error } = await supabase.from("sessions").update(patch).eq("id", sessionId);
  if (error) return { error: error.message };
  return { error: null };
}

export async function deleteSession(sessionId: string) {
  await requireCoach();
  const supabase = await createClient();
  const { error } = await supabase.from("sessions").delete().eq("id", sessionId);
  if (error) return { error: error.message };
  return { error: null };
}

async function applySessionExerciseOrder(
  supabase: Awaited<ReturnType<typeof createClient>>,
  targetSessionId: string,
  orderedIds: string[],
  movedId: string,
  fromSessionId: string,
  previousSupersetGroupId: string | null,
) {
  const crossSession = fromSessionId !== targetSessionId;
  const tempOffset = 100_000;

  for (let index = 0; index < orderedIds.length; index += 1) {
    const id = orderedIds[index];
    const patch: {
      sort_order: number;
      session_id?: string;
      superset_group_id?: null;
    } = { sort_order: tempOffset + index };

    if (id === movedId && crossSession) {
      patch.session_id = targetSessionId;
      patch.superset_group_id = null;
    }

    const { error } = await supabase
      .from("session_exercises")
      .update(patch)
      .eq("id", id);
    if (error) return { error: error.message };
  }

  for (let index = 0; index < orderedIds.length; index += 1) {
    const { error } = await supabase
      .from("session_exercises")
      .update({ sort_order: index })
      .eq("id", orderedIds[index]);
    if (error) return { error: error.message };
  }

  if (crossSession && previousSupersetGroupId) {
    const { data: siblings } = await supabase
      .from("session_exercises")
      .select("id")
      .eq("superset_group_id", previousSupersetGroupId)
      .neq("id", movedId);
    if (siblings?.length === 1) {
      await supabase
        .from("session_exercises")
        .update({ superset_group_id: null })
        .eq("id", siblings[0].id);
    }
  }

  return { error: null };
}

export async function moveSessionExercise(
  sessionExerciseId: string,
  targetSessionId: string,
  beforeExerciseId: string | null = null,
) {
  await requireCoach();
  const supabase = await createClient();

  const { data: item } = await supabase
    .from("session_exercises")
    .select("id, session_id, sort_order, superset_group_id")
    .eq("id", sessionExerciseId)
    .maybeSingle();
  if (!item) return { error: "Exercice introuvable." };
  if (beforeExerciseId === sessionExerciseId) {
    return { error: null };
  }

  const { data: targetItems } = await supabase
    .from("session_exercises")
    .select("id, sort_order")
    .eq("session_id", targetSessionId)
    .order("sort_order");

  const ordered = (targetItems ?? [])
    .filter((row) => row.id !== sessionExerciseId)
    .map((row) => row.id);

  let insertIndex = ordered.length;
  if (beforeExerciseId) {
    const index = ordered.indexOf(beforeExerciseId);
    if (index >= 0) insertIndex = index;
  }

  ordered.splice(insertIndex, 0, sessionExerciseId);

  const result = await applySessionExerciseOrder(
    supabase,
    targetSessionId,
    ordered,
    sessionExerciseId,
    item.session_id,
    item.superset_group_id,
  );
  if (result.error) return result;

  return { error: null };
}

export async function addExerciseToSession(
  sessionId: string,
  exerciseId: string,
  beforeExerciseId: string | null = null,
) {
  const { profile } = await requireCoach();
  void profile;
  const supabase = await createClient();

  const { data: exercise } = await supabase
    .from("exercises")
    .select("id")
    .eq("id", exerciseId)
    .maybeSingle();
  if (!exercise) return { error: "Exercice introuvable." };

  const { data: targetItems } = await supabase
    .from("session_exercises")
    .select("sort_order")
    .eq("session_id", sessionId);

  const maxOrder = (targetItems ?? []).reduce(
    (max, row) => Math.max(max, row.sort_order),
    -1,
  );

  const { data: inserted, error } = await supabase
    .from("session_exercises")
    .insert({
      session_id: sessionId,
      exercise_id: exerciseId,
      sort_order: maxOrder + 1,
      sets_count: 4,
      target_reps: 8,
      rest_seconds: 120,
    })
    .select("id")
    .single();

  if (error || !inserted) return { error: error?.message ?? "Insertion impossible." };

  const moveResult = await moveSessionExercise(
    inserted.id,
    sessionId,
    beforeExerciseId,
  );
  return moveResult;
}

export async function updateSessionExercise(
  id: string,
  patch: {
    sets_count?: number;
    target_reps?: number;
    target_weight_kg?: number | null;
    target_percent?: number | null;
    target_rpe?: number | null;
    rest_seconds?: number | null;
    coach_note?: string;
    superset_group_id?: string | null;
  },
) {
  await requireCoach();
  const supabase = await createClient();
  const { error } = await supabase.from("session_exercises").update(patch).eq("id", id);
  if (error) return { error: error.message };
  return { error: null };
}

export async function removeSessionExercise(id: string) {
  await requireCoach();
  const supabase = await createClient();

  const { data: item } = await supabase
    .from("session_exercises")
    .select("superset_group_id")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("session_exercises").delete().eq("id", id);
  if (error) return { error: error.message };

  if (item?.superset_group_id) {
    const { data: siblings } = await supabase
      .from("session_exercises")
      .select("id")
      .eq("superset_group_id", item.superset_group_id);
    if (siblings?.length === 1) {
      await supabase
        .from("session_exercises")
        .update({ superset_group_id: null })
        .eq("id", siblings[0].id);
    }
  }

  return { error: null };
}

export type WeekDraftPayload = {
  sessions: Array<{
    id: string;
    title: string;
    session_type: SessionType;
    rest_details: string | null;
    session_exercises: Array<{
      id: string;
      sets_count: number;
      target_reps: number;
      target_weight_kg: number | null;
      target_percent: number | null;
      target_rpe: number | null;
      rest_seconds: number | null;
      coach_note: string;
    }>;
  }>;
};

export async function saveWeekDraft(weekId: string, payload: WeekDraftPayload) {
  const { profile } = await requireCoach();
  const supabase = await createClient();

  const { data: week } = await supabase
    .from("program_weeks")
    .select("athlete_id")
    .eq("id", weekId)
    .maybeSingle();
  if (!week) return { error: "Semaine introuvable." };

  const owned = await getOwnedAthlete(week.athlete_id);
  if (owned.error) return { error: owned.error };

  for (const session of payload.sessions) {
    const { error: sessionError } = await supabase
      .from("sessions")
      .update({
        title: session.title.trim() || session.title,
        session_type: session.session_type,
        rest_details: session.rest_details ?? undefined,
      })
      .eq("id", session.id);
    if (sessionError) return { error: sessionError.message };

    for (const exercise of session.session_exercises) {
      const { error: exerciseError } = await supabase
        .from("session_exercises")
        .update({
          sets_count: exercise.sets_count,
          target_reps: exercise.target_reps,
          target_weight_kg: exercise.target_weight_kg,
          target_percent: exercise.target_percent,
          target_rpe: exercise.target_rpe,
          rest_seconds: exercise.rest_seconds,
          coach_note: exercise.coach_note,
        })
        .eq("id", exercise.id);
      if (exerciseError) return { error: exerciseError.message };
    }
  }

  const { error: weekError } = await supabase
    .from("program_weeks")
    .update({ status: "draft", published_at: null })
    .eq("id", weekId);
  if (weekError) return { error: weekError.message };

  void profile;
  return { error: null };
}

export async function fetchEditorWeek(weekId: string) {
  await requireCoach();
  const supabase = await createClient();

  const { data: weekRow } = await supabase
    .from("program_weeks")
    .select("*")
    .eq("id", weekId)
    .maybeSingle();
  if (!weekRow) return { error: "Semaine introuvable.", week: null };

  const owned = await getOwnedAthlete(weekRow.athlete_id);
  if (owned.error) return { error: owned.error, week: null };

  const [{ data: sessions }, { data: exercises }] = await Promise.all([
    supabase
      .from("sessions")
      .select("*")
      .eq("program_week_id", weekId)
      .order("weekday"),
    supabase.from("exercises").select("*"),
  ]);

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

  return {
    error: null,
    week: {
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
    },
  };
}

export async function linkSupersetWithPrevious(sessionExerciseId: string) {
  await requireCoach();
  const supabase = await createClient();

  const { data: current } = await supabase
    .from("session_exercises")
    .select("id, session_id, sort_order, superset_group_id")
    .eq("id", sessionExerciseId)
    .maybeSingle();
  if (!current) return { error: "Exercice introuvable." };

  const { data: previous } = await supabase
    .from("session_exercises")
    .select("id, superset_group_id")
    .eq("session_id", current.session_id)
    .lt("sort_order", current.sort_order)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!previous) {
    return { error: "Aucun exercice précédent dans cette séance." };
  }

  const groupId = previous.superset_group_id ?? crypto.randomUUID();
  const ids = previous.superset_group_id
    ? [sessionExerciseId]
    : [previous.id, sessionExerciseId];

  const { error } = await supabase
    .from("session_exercises")
    .update({ superset_group_id: groupId })
    .in("id", ids);

  if (error) return { error: error.message };
  return { error: null };
}

export async function unlinkFromSuperset(sessionExerciseId: string) {
  await requireCoach();
  const supabase = await createClient();

  const { data: current } = await supabase
    .from("session_exercises")
    .select("superset_group_id")
    .eq("id", sessionExerciseId)
    .maybeSingle();
  if (!current?.superset_group_id) return { error: null };

  const groupId = current.superset_group_id;
  const { error } = await supabase
    .from("session_exercises")
    .update({ superset_group_id: null })
    .eq("id", sessionExerciseId);
  if (error) return { error: error.message };

  const { data: siblings } = await supabase
    .from("session_exercises")
    .select("id")
    .eq("superset_group_id", groupId);
  if (siblings?.length === 1) {
    await supabase
      .from("session_exercises")
      .update({ superset_group_id: null })
      .eq("id", siblings[0].id);
  }

  return { error: null };
}

export async function publishWeek(weekId: string) {
  const owned = await requireCoach();
  const supabase = await createClient();

  const { data: week } = await supabase
    .from("program_weeks")
    .select("*")
    .eq("id", weekId)
    .maybeSingle();
  if (!week) return { error: "Semaine introuvable." };

  const athleteResult = await getOwnedAthlete(week.athlete_id);
  if (athleteResult.error || !athleteResult.athlete) {
    return { error: athleteResult.error ?? "Sportif introuvable." };
  }

  const { data: sessions } = await supabase
    .from("sessions")
    .select("*")
    .eq("program_week_id", weekId);

  if (!sessions || sessions.length === 0) {
    return { error: "Ajoute au moins un jour avant de publier." };
  }

  const monday = mondayOfWeekISO();
  const offsetWeeks = week.week_number - athleteResult.athlete.current_week;
  const weekMonday = addDaysISO(monday, offsetWeeks * 7);

  for (const session of sessions) {
    const { error } = await supabase
      .from("sessions")
      .update({ scheduled_date: addDaysISO(weekMonday, session.weekday - 1) })
      .eq("id", session.id);
    if (error) return { error: error.message };
  }

  const { error: weekError } = await supabase
    .from("program_weeks")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", weekId);
  if (weekError) return { error: weekError.message };

  await supabase.from("reminder_logs").insert({
    athlete_id: week.athlete_id,
    kind: "week_prepare",
    channel: "email",
    program_week_id: weekId,
  });

  void owned;
  revalidateEditor();
  return { error: null };
}
