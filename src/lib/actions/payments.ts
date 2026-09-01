"use server";

import { revalidatePath } from "next/cache";
import { requireCoach } from "@/lib/auth";
import { firstOfMonthISO } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import type { PaymentStatus } from "@/lib/supabase/models";

function revalidatePayments(athleteId?: string) {
  revalidatePath("/paiements");
  revalidatePath("/");
  revalidatePath("/sportifs");
  revalidatePath("/app");
  if (athleteId) revalidatePath(`/sportifs/${athleteId}`);
}

async function assertOwnedAthlete(athleteId: string) {
  const { profile } = await requireCoach();
  const supabase = await createClient();
  const { data: athlete } = await supabase
    .from("athletes")
    .select("id")
    .eq("id", athleteId)
    .eq("coach_id", profile.id)
    .maybeSingle();

  if (!athlete) return { error: "Sportif introuvable." as const, supabase, profile };
  return { error: null, supabase, profile };
}

export async function updatePaymentSettings(
  dueDay: number,
  blockAfterDays: number,
): Promise<{ error: string | null }> {
  const { profile } = await requireCoach();

  if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 28) {
    return { error: "Le jour d'échéance doit être entre 1 et 28." };
  }
  if (!Number.isInteger(blockAfterDays) || blockAfterDays < 0 || blockAfterDays > 60) {
    return { error: "Le délai de blocage doit être entre 0 et 60 jours." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      payment_due_day: dueDay,
      payment_block_after_days: blockAfterDays,
    })
    .eq("id", profile.id);

  if (error) return { error: error.message };

  revalidatePayments();
  return { error: null };
}

export async function setPaymentStatusForPeriod(
  athleteId: string,
  periodStart: string,
  status: PaymentStatus,
): Promise<{ error: string | null }> {
  const owned = await assertOwnedAthlete(athleteId);
  if (owned.error) return { error: owned.error };

  const { error } = await owned.supabase.from("payments").upsert(
    {
      athlete_id: athleteId,
      period_start: periodStart,
      status,
    },
    { onConflict: "athlete_id,period_start" },
  );

  if (error) return { error: error.message };

  revalidatePayments(athleteId);
  return { error: null };
}

export async function setPaymentStatus(
  athleteId: string,
  status: PaymentStatus,
): Promise<{ error: string | null }> {
  return setPaymentStatusForPeriod(athleteId, firstOfMonthISO(), status);
}

/** Réactive l'accès en marquant tous les paiements en attente comme payés. */
export async function reactivateAthleteAccess(
  athleteId: string,
): Promise<{ error: string | null }> {
  const owned = await assertOwnedAthlete(athleteId);
  if (owned.error) return { error: owned.error };

  const { data: pendingPayments, error: fetchError } = await owned.supabase
    .from("payments")
    .select("period_start")
    .eq("athlete_id", athleteId)
    .eq("status", "pending");

  if (fetchError) return { error: fetchError.message };

  const periods = (pendingPayments ?? []).map((payment) => payment.period_start);
  if (periods.length === 0) {
    return setPaymentStatus(athleteId, "paid");
  }

  const { error } = await owned.supabase.from("payments").upsert(
    periods.map((periodStart) => ({
      athlete_id: athleteId,
      period_start: periodStart,
      status: "paid" as const,
    })),
    { onConflict: "athlete_id,period_start" },
  );

  if (error) return { error: error.message };

  revalidatePayments(athleteId);
  return { error: null };
}
