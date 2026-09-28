"use server";

import { revalidatePath } from "next/cache";
import { requireAthlete } from "@/lib/auth";
import { todayISO } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import type { AthleteBodyLog } from "@/lib/supabase/models";

export type AthleteProfileFormState = {
  error: string | null;
  ok?: boolean;
};

export async function getAthleteBodyLogs(
  athleteId: string,
): Promise<AthleteBodyLog[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("athlete_body_logs")
    .select("*")
    .eq("athlete_id", athleteId)
    .order("recorded_on", { ascending: true });
  return (data ?? []) as AthleteBodyLog[];
}

export async function updateAthleteSelfProfile(
  _prev: AthleteProfileFormState,
  formData: FormData,
): Promise<AthleteProfileFormState> {
  const { athlete } = await requireAthlete();
  if (!athlete) return { error: "Profil sportif introuvable." };

  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();
  const goal = String(formData.get("goal") ?? "").trim();
  const heightRaw = String(formData.get("height_cm") ?? "").trim();
  const heightCm =
    heightRaw === ""
      ? null
      : Number(heightRaw);

  if (!firstName) return { error: "Le prénom est obligatoire." };
  if (
    heightCm != null &&
    (!Number.isFinite(heightCm) || heightCm < 100 || heightCm > 250)
  ) {
    return { error: "Taille invalide (100–250 cm)." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("athletes")
    .update({
      first_name: firstName,
      last_name: lastName,
      goal,
      height_cm: heightCm,
    })
    .eq("id", athlete.id);

  if (error) return { error: error.message };

  revalidatePath("/app/moi");
  return { error: null, ok: true };
}

export async function addBodyWeightLog(
  _prev: AthleteProfileFormState,
  formData: FormData,
): Promise<AthleteProfileFormState> {
  const { athlete } = await requireAthlete();
  if (!athlete) return { error: "Profil sportif introuvable." };

  const weightRaw = String(formData.get("weight_kg") ?? "").trim();
  const recordedOn =
    String(formData.get("recorded_on") ?? "").trim() || todayISO();
  const weightKg = Number(weightRaw);

  if (!Number.isFinite(weightKg) || weightKg <= 0 || weightKg >= 500) {
    return { error: "Poids invalide." };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(recordedOn)) {
    return { error: "Date invalide." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("athlete_body_logs").upsert(
    {
      athlete_id: athlete.id,
      recorded_on: recordedOn,
      weight_kg: weightKg,
    },
    { onConflict: "athlete_id,recorded_on" },
  );

  if (error) return { error: error.message };

  revalidatePath("/app/moi");
  return { error: null, ok: true };
}
