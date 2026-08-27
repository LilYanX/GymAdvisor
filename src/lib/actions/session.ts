"use server";

import { revalidatePath } from "next/cache";
import { requireAthlete } from "@/lib/auth";
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
    .select("status")
    .eq("session_id", sessionId)
    .eq("athlete_id", owned.athlete.id)
    .maybeSingle();

  if (existingLog?.status !== "completed" && existingLog?.status !== "skipped") {
    const { error } = await supabase.from("session_logs").upsert(
      {
        session_id: sessionId,
        athlete_id: owned.athlete.id,
        status: "in_progress",
        started_at: new Date().toISOString(),
      },
      { onConflict: "session_id" },
    );
    if (error) return { error: error.message };
  }

  const { data: items } = await supabase
    .from("session_exercises")
    .select("*")
    .eq("session_id", sessionId)
    .order("sort_order");

  for (const item of items ?? []) {
    const { data: existing } = await supabase
      .from("set_logs")
      .select("id")
      .eq("session_exercise_id", item.id)
      .eq("athlete_id", owned.athlete.id)
      .limit(1);
    if (existing && existing.length > 0) continue;

    const rows = Array.from({ length: item.sets_count }, (_, index) => ({
      session_exercise_id: item.id,
      athlete_id: owned.athlete.id,
      set_number: index + 1,
      weight_kg: item.target_weight_kg,
      reps: item.target_reps,
      completed: false,
    }));
    const { error: setError } = await supabase.from("set_logs").insert(rows);
    if (setError) return { error: setError.message };
  }

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

export async function completeSession(sessionId: string) {
  const owned = await athleteOrError();
  if (owned.error || !owned.athlete) return { error: owned.error ?? "Erreur." };
  const supabase = await createClient();

  const { error } = await supabase.from("session_logs").upsert(
    {
      session_id: sessionId,
      athlete_id: owned.athlete.id,
      status: "completed",
      completed_at: new Date().toISOString(),
    },
    { onConflict: "session_id" },
  );
  if (error) return { error: error.message };
  refresh();
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
  refresh();
  return { error: null };
}
