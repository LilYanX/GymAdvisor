"use server";

import { revalidatePath } from "next/cache";
import { requireAthlete } from "@/lib/auth";
import { parseDatetimeLocal } from "@/lib/session-timing";
import { createClient } from "@/lib/supabase/server";

export type SessionCheckInState = {
  error: string | null;
  ok: boolean;
};

function isLowFeeling(input: {
  energy: number;
  sleep: number;
  pain: number;
  motivation: number;
}): boolean {
  return (
    input.energy <= 2 ||
    input.sleep <= 2 ||
    input.motivation <= 2 ||
    input.pain >= 4
  );
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
  const energy = Number(formData.get("energy"));
  const sleep = Number(formData.get("sleep"));
  const pain = Number(formData.get("pain"));
  const motivation = Number(formData.get("motivation"));
  const comment = String(formData.get("comment") ?? "").trim();
  const startedAtLocal = String(formData.get("started_at") ?? "").trim();

  if (!sessionId) {
    return { error: "Séance introuvable.", ok: false };
  }

  if (
    ![energy, sleep, pain, motivation].every(
      (value) => Number.isInteger(value) && value >= 1 && value <= 5,
    )
  ) {
    return {
      error: "Indique énergie, sommeil, douleurs et motivation (1 à 5).",
      ok: false,
    };
  }

  const startedDate = parseDatetimeLocal(startedAtLocal);
  if (!startedDate) {
    return { error: "Indique l’heure de début de séance.", ok: false };
  }

  const supabase = await createClient();
  const needsAttention = isLowFeeling({ energy, sleep, pain, motivation });

  const { error } = await supabase.from("session_check_ins").upsert(
    {
      athlete_id: athlete.id,
      session_id: sessionId,
      energy,
      sleep,
      pain,
      motivation,
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
