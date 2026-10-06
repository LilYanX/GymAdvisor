"use server";

import { revalidatePath } from "next/cache";
import { requireAthlete } from "@/lib/auth";
import { loggingRepsForExercise } from "@/lib/athlete-sets";
import {
  assertEndAfterStart,
  parseDatetimeLocal,
} from "@/lib/session-timing";
import { maybeAutoPublishNextDraftWeek } from "@/lib/actions/program";
import { createClient } from "@/lib/supabase/server";

function refresh() {
  revalidatePath("/app");
  revalidatePath("/app/programme");
  revalidatePath("/app/seance");
  revalidatePath("/");
}

async function athleteOrError() {
  const { athlete } = await requireAthlete();
  if (!athlete) return { error: "Ton espace n’est pas encore lié à un coach.", athlete: null };
  return { error: null, athlete };
}

export async function startSession(sessionId: string) {
  const owned = await athleteOrError();
  if (owned.error || !owned.athlete) return { error: owned.error ?? "Erreur." };
  const supabase = await createClient();

  const { data: existingLog } = await supabase
    .from("session_logs")
    .select("status, started_at")
    .eq("session_id", sessionId)
    .eq("athlete_id", owned.athlete.id)
    .maybeSingle();

  if (existingLog?.status !== "completed" && existingLog?.status !== "skipped") {
    if (existingLog) {
      const { error } = await supabase
        .from("session_logs")
        .update({ status: "in_progress" })
        .eq("session_id", sessionId)
        .eq("athlete_id", owned.athlete.id);
      if (error) return { error: error.message };
    } else {
      const { error } = await supabase.from("session_logs").insert({
        session_id: sessionId,
        athlete_id: owned.athlete.id,
        status: "in_progress",
      });
      if (error) return { error: error.message };
    }
  }

  const { data: items } = await supabase
    .from("session_exercises")
    .select("*")
    .eq("session_id", sessionId)
    .order("sort_order");

  for (const item of items ?? []) {
    const { data: existingSets } = await supabase
      .from("set_logs")
      .select("set_number")
      .eq("session_exercise_id", item.id)
      .eq("athlete_id", owned.athlete.id);

    const existingNumbers = new Set(
      (existingSets ?? []).map((set) => set.set_number),
    );

    const missingNumbers = Array.from(
      { length: item.sets_count },
      (_, index) => index + 1,
    ).filter((setNumber) => !existingNumbers.has(setNumber));

    if (missingNumbers.length === 0) continue;

    const rows = missingNumbers.map((setNumber) => ({
      session_exercise_id: item.id,
      athlete_id: owned.athlete.id,
      set_number: setNumber,
      weight_kg: item.target_weight_kg,
      reps: loggingRepsForExercise(item),
      completed: false,
    }));
    const { error: setError } = await supabase.from("set_logs").insert(rows);
    if (setError) return { error: setError.message };
  }

  return { error: null };
}

export async function saveWorkoutDrafts(
  exercises: Array<{
    sessionExerciseId: string;
    sets: Array<{
      setNumber: number;
      weightKg: number | null;
      reps: number | null;
      completed: boolean;
    }>;
    rpe: number | null;
    comment: string;
  }>,
) {
  const owned = await athleteOrError();
  if (owned.error || !owned.athlete) return { error: owned.error ?? "Erreur." };
  const supabase = await createClient();

  for (const exercise of exercises) {
    for (const set of exercise.sets) {
      const { error } = await supabase.from("set_logs").upsert(
        {
          session_exercise_id: exercise.sessionExerciseId,
          athlete_id: owned.athlete.id,
          set_number: set.setNumber,
          weight_kg: set.weightKg,
          reps: set.reps,
          completed: set.completed,
        },
        { onConflict: "session_exercise_id,set_number" },
      );
      if (error) return { error: error.message };
    }

    const { error: feedbackError } = await supabase.from("session_exercise_logs").upsert(
      {
        session_exercise_id: exercise.sessionExerciseId,
        athlete_id: owned.athlete.id,
        rpe: exercise.rpe,
        comment: exercise.comment,
      },
      { onConflict: "session_exercise_id" },
    );
    if (feedbackError) return { error: feedbackError.message };
  }

  refresh();
  return { error: null };
}

export async function saveSetLog(input: {
  sessionExerciseId: string;
  setNumber: number;
  weightKg: number | null;
  reps: number | null;
  completed: boolean;
}) {
  const owned = await athleteOrError();
  if (owned.error || !owned.athlete) return { error: owned.error ?? "Erreur." };
  const supabase = await createClient();

  const { error } = await supabase.from("set_logs").upsert(
    {
      session_exercise_id: input.sessionExerciseId,
      athlete_id: owned.athlete.id,
      set_number: input.setNumber,
      weight_kg: input.weightKg,
      reps: input.reps,
      completed: input.completed,
    },
    { onConflict: "session_exercise_id,set_number" },
  );
  if (error) return { error: error.message };
  refresh();
  return { error: null };
}

export async function saveExerciseFeedback(input: {
  sessionExerciseId: string;
  rpe: number | null;
  comment: string;
}) {
  const owned = await athleteOrError();
  if (owned.error || !owned.athlete) return { error: owned.error ?? "Erreur." };
  const supabase = await createClient();

  const { error } = await supabase.from("session_exercise_logs").upsert(
    {
      session_exercise_id: input.sessionExerciseId,
      athlete_id: owned.athlete.id,
      rpe: input.rpe,
      comment: input.comment,
    },
    { onConflict: "session_exercise_id" },
  );
  if (error) return { error: error.message };
  refresh();
  return { error: null };
}

export async function completeSession(
  sessionId: string,
  completedAtLocal: string,
  finalRpe: number,
) {
  const owned = await athleteOrError();
  if (owned.error || !owned.athlete) return { error: owned.error ?? "Erreur." };
  const supabase = await createClient();

  const endDate = parseDatetimeLocal(completedAtLocal);
  if (!endDate) {
    return { error: "Indique une heure de fin valide." };
  }
  if (
    !Number.isInteger(finalRpe) ||
    finalRpe < 1 ||
    finalRpe > 10
  ) {
    return { error: "Indique un RPE final entre 1 et 10." };
  }

  const { data: log } = await supabase
    .from("session_logs")
    .select("started_at")
    .eq("session_id", sessionId)
    .eq("athlete_id", owned.athlete.id)
    .maybeSingle();

  if (!log?.started_at) {
    return { error: "L’heure de début de séance est manquante." };
  }

  const completedAt = endDate.toISOString();
  const timingError = assertEndAfterStart(log.started_at, completedAt);
  if (timingError) return { error: timingError };

  const { error } = await supabase
    .from("session_logs")
    .update({
      status: "completed",
      completed_at: completedAt,
      final_rpe: finalRpe,
    })
    .eq("session_id", sessionId)
    .eq("athlete_id", owned.athlete.id);
  if (error) return { error: error.message };
  await maybeAutoPublishNextDraftWeek(owned.athlete.id, sessionId);
  refresh();
  return { error: null };
}

export async function setSessionStartedAt(
  sessionId: string,
  startedAtLocal: string,
) {
  const owned = await athleteOrError();
  if (owned.error || !owned.athlete) return { error: owned.error ?? "Erreur." };

  const startedDate = parseDatetimeLocal(startedAtLocal);
  if (!startedDate) return { error: "Indique une heure de début valide." };

  const supabase = await createClient();
  const { error } = await supabase.from("session_logs").upsert(
    {
      session_id: sessionId,
      athlete_id: owned.athlete.id,
      status: "in_progress",
      started_at: startedDate.toISOString(),
    },
    { onConflict: "session_id" },
  );
  if (error) return { error: error.message };
  refresh();
  revalidatePath(`/app/seance/${sessionId}`);
  return { error: null };
}

export async function skipSession(sessionId: string) {
  const owned = await athleteOrError();
  if (owned.error || !owned.athlete) return { error: owned.error ?? "Erreur." };
  const supabase = await createClient();

  const { error } = await supabase.from("session_logs").upsert(
    {
      session_id: sessionId,
      athlete_id: owned.athlete.id,
      status: "skipped",
      completed_at: new Date().toISOString(),
    },
    { onConflict: "session_id" },
  );
  if (error) return { error: error.message };
  await maybeAutoPublishNextDraftWeek(owned.athlete.id, sessionId);
  refresh();
  return { error: null };
}
