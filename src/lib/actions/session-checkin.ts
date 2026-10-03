"use server";

import { revalidatePath } from "next/cache";
import { requireAthlete } from "@/lib/auth";
import {
  mcleanNeedsAttention,
  mcleanTotal,
  type McLeanScores,
} from "@/lib/mclean";
import { parseDatetimeLocal } from "@/lib/session-timing";
import { createClient } from "@/lib/supabase/server";

export type SessionCheckInState = {
  error: string | null;
  ok: boolean;
};

function parseItem(formData: FormData, key: string): number {
  return Number(formData.get(key));
}

export async function submitSessionCheckIn(
  _prev: SessionCheckInState,
  formData: FormData,
): Promise<SessionCheckInState> {
  const { athlete } = await requireAthlete();
  if (!athlete) {
    return { error: "Ton espace n’est pas encore lié à un coach.", ok: false };
  }

  const sessionId = String(formData.get("session_id") ?? "");
  const scores: McLeanScores = {
    fatigue: parseItem(formData, "fatigue"),
    sleep: parseItem(formData, "sleep"),
    soreness: parseItem(formData, "soreness"),
    stress: parseItem(formData, "stress"),
    mood: parseItem(formData, "mood"),
  };
  const comment = String(formData.get("comment") ?? "").trim();
  const startedAtLocal = String(formData.get("started_at") ?? "").trim();

  if (!sessionId) {
    return { error: "Séance introuvable.", ok: false };
  }

  if (
    !Object.values(scores).every(
      (value) => Number.isInteger(value) && value >= 1 && value <= 5,
    )
  ) {
    return {
      error: "Réponds aux 5 questions McLean (1 à 5).",
      ok: false,
    };
  }

  const startedDate = parseDatetimeLocal(startedAtLocal);
  if (!startedDate) {
    return { error: "Indique l’heure de début de séance.", ok: false };
  }

  const supabase = await createClient();

  const { data: history } = await supabase
    .from("session_check_ins")
    .select("fatigue, sleep, soreness, stress, mood")
    .eq("athlete_id", athlete.id)
    .neq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(28);

  const historyTotals = (history ?? []).map((row) =>
    mcleanTotal({
      fatigue: row.fatigue,
      sleep: row.sleep,
      soreness: row.soreness,
      stress: row.stress,
      mood: row.mood,
    }),
  );
  const total = mcleanTotal(scores);
  const needsAttention = mcleanNeedsAttention(total, historyTotals);

  const { error } = await supabase.from("session_check_ins").upsert(
    {
      athlete_id: athlete.id,
      session_id: sessionId,
      fatigue: scores.fatigue,
      sleep: scores.sleep,
      soreness: scores.soreness,
      stress: scores.stress,
      mood: scores.mood,
      comment,
      needs_attention: needsAttention,
    },
    { onConflict: "athlete_id,session_id" },
  );

  if (error) return { error: error.message, ok: false };

  const { error: logError } = await supabase.from("session_logs").upsert(
    {
      session_id: sessionId,
      athlete_id: athlete.id,
      status: "in_progress",
      started_at: startedDate.toISOString(),
    },
    { onConflict: "session_id" },
  );
  if (logError) return { error: logError.message, ok: false };

  revalidatePath(`/app/seance/${sessionId}`);
  revalidatePath("/app");
  revalidatePath(`/sportifs`);
  return { error: null, ok: true };
}
