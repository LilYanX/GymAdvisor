"use server";

import { revalidatePath } from "next/cache";
import { requireAthlete } from "@/lib/auth";
import { todayISO } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";

function refreshAthlete() {
  revalidatePath("/app");
  revalidatePath("/app/programme");
  revalidatePath("/app/moi");
  revalidatePath("/sportifs");
}

export async function createAthleteActivity(input: {
  name: string;
  durationMinutes: number;
  rpe: number | null;
  performedOn?: string;
  recurrence?: {
    weekdays: number[];
    timesPerWeek: number | null;
  } | null;
}): Promise<{ error: string | null }> {
  const { athlete } = await requireAthlete();
  if (!athlete) return { error: "Ton espace n’est pas encore lié à un coach." };

  const name = input.name.trim();
  if (!name) return { error: "Indique un nom d’activité." };
  if (!Number.isInteger(input.durationMinutes) || input.durationMinutes <= 0) {
    return { error: "La durée doit être un nombre positif." };
  }
  if (
    input.rpe != null &&
    (!Number.isInteger(input.rpe) || input.rpe < 1 || input.rpe > 10)
  ) {
    return { error: "Le RPE doit être entre 1 et 10." };
  }

  const performedOn = input.performedOn ?? todayISO();
  const supabase = await createClient();
  let recurrenceId: string | null = null;

  if (input.recurrence) {
    const weekdays = input.recurrence.weekdays.filter(
      (day) => day >= 1 && day <= 7,
    );
    const timesPerWeek = input.recurrence.timesPerWeek;
    if (weekdays.length === 0 && timesPerWeek == null) {
      return {
        error: "Choisis des jours de la semaine et/ou un nombre de fois par semaine.",
      };
    }
    if (
      timesPerWeek != null &&
      (!Number.isInteger(timesPerWeek) || timesPerWeek < 1 || timesPerWeek > 7)
    ) {
      return { error: "Le nombre de fois par semaine doit être entre 1 et 7." };
    }

    const { data: recurrence, error: recurrenceError } = await supabase
      .from("athlete_activity_recurrences")
      .insert({
        athlete_id: athlete.id,
        name,
        duration_minutes: input.durationMinutes,
        rpe_default: input.rpe,
        weekdays,
        times_per_week: timesPerWeek,
        active: true,
      })
      .select("id")
      .single();

    if (recurrenceError || !recurrence) {
      return { error: recurrenceError?.message ?? "Impossible de créer la récurrence." };
    }
    recurrenceId = recurrence.id;
  }

  const { error } = await supabase.from("athlete_activities").insert({
    athlete_id: athlete.id,
    recurrence_id: recurrenceId,
    name,
    duration_minutes: input.durationMinutes,
    rpe: input.rpe,
    performed_on: performedOn,
  });

  if (error) return { error: error.message };
  refreshAthlete();
  return { error: null };
}

export async function deleteAthleteActivity(
  activityId: string,
): Promise<{ error: string | null }> {
  const { athlete } = await requireAthlete();
  if (!athlete) return { error: "Ton espace n’est pas encore lié à un coach." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("athlete_activities")
    .delete()
    .eq("id", activityId)
    .eq("athlete_id", athlete.id);

  if (error) return { error: error.message };
  refreshAthlete();
  return { error: null };
}
