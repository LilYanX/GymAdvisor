"use server";

import { revalidatePath } from "next/cache";
import { requireAthlete } from "@/lib/auth";
import { mondayOfWeekISO } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";

export type CheckInState = {
  error: string | null;
  ok: boolean;
};

export async function submitCheckIn(
  _prev: CheckInState,
  formData: FormData,
): Promise<CheckInState> {
  const { athlete } = await requireAthlete();
  if (!athlete) {
    return { error: "Ton espace n’est pas encore lié à un coach.", ok: false };
  }

  const energy = Number(formData.get("energy"));
  const sleep = Number(formData.get("sleep"));
  const pain = Number(formData.get("pain"));
  const comment = String(formData.get("comment") ?? "").trim();

  if (![energy, sleep, pain].every((value) => value >= 1 && value <= 5)) {
    return { error: "Indique énergie, sommeil et douleurs (1 à 5).", ok: false };
  }

  const supabase = await createClient();
  const weekStart = mondayOfWeekISO();

  const { error } = await supabase.from("check_ins").upsert(
    {
      athlete_id: athlete.id,
      week_start_date: weekStart,
      energy,
      sleep,
      pain,
      comment,
    },
    { onConflict: "athlete_id,week_start_date" },
  );

  if (error) return { error: error.message, ok: false };
  revalidatePath("/app/moi");
  return { error: null, ok: true };
}
