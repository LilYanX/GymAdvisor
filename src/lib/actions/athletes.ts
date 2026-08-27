"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCoach } from "@/lib/auth";
import { firstOfMonthISO } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import type { PaymentStatus } from "@/lib/supabase/models";

export type AthleteFormState = {
  error: string | null;
};

export async function createAthlete(
  _prev: AthleteFormState,
  formData: FormData,
): Promise<AthleteFormState> {
  const { profile } = await requireCoach();
  const supabase = await createClient();

  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const goal = String(formData.get("goal") ?? "").trim();

  if (!firstName || !email) {
    return { error: "Le prénom et l’e-mail sont obligatoires." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Session expirée. Reconnecte-toi." };
  }

  let athleteId: string | null = null;

  const rpc = await supabase.rpc("coach_create_athlete", {
    p_first_name: firstName,
    p_last_name: lastName,
    p_email: email,
    p_goal: goal,
  });

  if (rpc.error) {
    const rpcMissing =
      rpc.error.code === "PGRST202" ||
      rpc.error.message.includes("Could not find the function");

    if (!rpcMissing) {
      if (rpc.error.code === "23505") {
        return { error: "Un sportif avec cet e-mail existe déjà." };
      }
      return { error: rpc.error.message };
    }

    const { data: athlete, error: insertError } = await supabase
      .from("athletes")
      .insert({
        coach_id: user.id,
        first_name: firstName,
        last_name: lastName,
        email,
        goal,
      })
      .select("id")
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        return { error: "Un sportif avec cet e-mail existe déjà." };
      }
      if (insertError.code === "42501") {
        return {
          error:
            "Création bloquée par Supabase. Exécute la migration supabase/migrations/20260814213000_coach_create_athlete.sql dans le SQL Editor.",
        };
      }
      return { error: insertError.message };
    }

    athleteId = athlete?.id ?? null;
  } else {
    athleteId = rpc.data;
  }

  if (athleteId) {
    await supabase.from("payments").upsert(
      {
        athlete_id: athleteId,
        period_start: firstOfMonthISO(),
        status: "pending",
      },
      { onConflict: "athlete_id,period_start" },
    );
  }

  void profile;

  revalidatePath("/");
  revalidatePath("/sportifs");
  const redirectTo = String(formData.get("redirect_to") ?? "").trim();
  if (redirectTo.startsWith("/")) {
    redirect(redirectTo);
  }
  return { error: null };
}

export async function updateAthlete(
  _prev: AthleteFormState,
  formData: FormData,
): Promise<AthleteFormState> {
  const { profile } = await requireCoach();
  const supabase = await createClient();

  const athleteId = String(formData.get("athlete_id") ?? "");
  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const goal = String(formData.get("goal") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const currentWeek = Number(formData.get("current_week") ?? 1);
  const totalWeeks = Number(formData.get("total_weeks") ?? 12);

  if (!athleteId || !firstName || !email) {
    return { error: "Le prénom et l’e-mail sont obligatoires." };
  }

  const { error } = await supabase
    .from("athletes")
    .update({
      first_name: firstName,
      last_name: lastName,
      email,
      goal,
      notes,
      current_week: Number.isFinite(currentWeek) && currentWeek >= 1 ? currentWeek : 1,
      total_weeks: Number.isFinite(totalWeeks) && totalWeeks >= 1 ? totalWeeks : 12,
    })
    .eq("id", athleteId)
    .eq("coach_id", profile.id);

  if (error) {
    if (error.code === "23505") {
      return { error: "Un sportif avec cet e-mail existe déjà." };
    }
    return { error: error.message };
  }

  revalidatePath("/");
  revalidatePath("/sportifs");
  revalidatePath(`/sportifs/${athleteId}`);
  return { error: null };
}

export async function archiveAthlete(
  athleteId: string,
): Promise<{ error: string | null }> {
  const { profile } = await requireCoach();
  const supabase = await createClient();

  const { error } = await supabase
    .from("athletes")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", athleteId)
    .eq("coach_id", profile.id);

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/sportifs");
  return { error: null };
}

export async function setPaymentStatus(
  athleteId: string,
  status: PaymentStatus,
): Promise<{ error: string | null }> {
  const { profile } = await requireCoach();
  const supabase = await createClient();

  const { data: athlete } = await supabase
    .from("athletes")
    .select("id")
    .eq("id", athleteId)
    .eq("coach_id", profile.id)
    .maybeSingle();

  if (!athlete) return { error: "Sportif introuvable." };

  const periodStart = firstOfMonthISO();
  const { error } = await supabase.from("payments").upsert(
    {
      athlete_id: athleteId,
      period_start: periodStart,
      status,
    },
    { onConflict: "athlete_id,period_start" },
  );

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath(`/sportifs/${athleteId}`);
  revalidatePath("/paiements");
  return { error: null };
}
