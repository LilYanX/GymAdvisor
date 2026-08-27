"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCoach } from "@/lib/auth";
import { firstOfMonthISO } from "@/lib/dates";
import { createAdminClient, getAppUrl } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { PaymentStatus } from "@/lib/supabase/models";

export type AthleteFormState = {
  error: string | null;
};

async function provisionAthleteAuthAccount(params: {
  athleteId: string;
  email: string;
  firstName: string;
  lastName: string;
}): Promise<{ error: string | null }> {
  let admin;
  try {
    admin = createAdminClient();
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Clé service role Supabase manquante.",
    };
  }

  const appUrl = await getAppUrl();
  const redirectTo = `${appUrl}/auth/callback?next=/login/nouveau-mot-de-passe`;

  const invite = await admin.auth.admin.inviteUserByEmail(params.email, {
    data: {
      first_name: params.firstName,
      last_name: params.lastName,
    },
    redirectTo,
  });

  let userId = invite.data.user?.id ?? null;

  if (invite.error || !userId) {
    const message = invite.error?.message?.toLowerCase() ?? "";
    const alreadyExists =
      message.includes("already") ||
      message.includes("registered") ||
      message.includes("exists") ||
      invite.error?.status === 422;

    if (!alreadyExists) {
      return {
        error:
          invite.error?.message ??
          "Impossible de créer le compte de connexion du sportif.",
      };
    }

    const existingId = await findAuthUserIdByEmail(admin, params.email);
    userId = existingId;
    if (!userId) {
      return {
        error:
          "Un compte existe déjà pour cet e-mail, mais il n’a pas pu être lié. Vérifie Authentication → Users.",
      };
    }
  }

  const { error: linkError } = await admin
    .from("athletes")
    .update({ profile_id: userId })
    .eq("id", params.athleteId);

  if (linkError) {
    return {
      error: `Compte créé, mais liaison impossible : ${linkError.message}`,
    };
  }

  await admin
    .from("profiles")
    .update({
      first_name: params.firstName,
      last_name: params.lastName,
      email: params.email,
    })
    .eq("id", userId);

  return { error: null };
}

async function findAuthUserIdByEmail(
  admin: ReturnType<typeof createAdminClient>,
  email: string,
): Promise<string | null> {
  const normalized = email.toLowerCase();
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) return null;
    const found = data.users.find(
      (user) => user.email?.toLowerCase() === normalized,
    );
    if (found) return found.id;
    if (data.users.length < 200) break;
  }
  return null;
}

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
  const totalWeeksRaw = Number(formData.get("total_weeks") ?? 12);
  const totalWeeks =
    Number.isFinite(totalWeeksRaw) && totalWeeksRaw >= 1
      ? Math.min(Math.floor(totalWeeksRaw), 104)
      : 12;

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
    p_total_weeks: totalWeeks,
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
        total_weeks: totalWeeks,
        current_week: 1,
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
            "Création bloquée par Supabase. Exécute les migrations SQL dans le SQL Editor.",
        };
      }
      return { error: insertError.message };
    }

    athleteId = athlete?.id ?? null;
  } else {
    athleteId = rpc.data;
    if (athleteId) {
      await supabase
        .from("athletes")
        .update({ total_weeks: totalWeeks, current_week: 1 })
        .eq("id", athleteId)
        .eq("coach_id", user.id);
    }
  }

  if (!athleteId) {
    return { error: "Impossible de créer le sportif." };
  }

  const authResult = await provisionAthleteAuthAccount({
    athleteId,
    email,
    firstName,
    lastName,
  });
  if (authResult.error) {
    return {
      error: `${authResult.error} (Le sportif a été créé dans le roster : tu peux réessayer ou vérifier la clé SUPABASE_SERVICE_ROLE_KEY.)`,
    };
  }

  await supabase.from("payments").upsert(
    {
      athlete_id: athleteId,
      period_start: firstOfMonthISO(),
      status: "pending",
    },
    { onConflict: "athlete_id,period_start" },
  );

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

export async function deleteAthlete(
  athleteId: string,
): Promise<{ error: string | null }> {
  const { profile } = await requireCoach();
  const supabase = await createClient();

  const { data: athlete } = await supabase
    .from("athletes")
    .select("id, profile_id")
    .eq("id", athleteId)
    .eq("coach_id", profile.id)
    .maybeSingle();

  if (!athlete) return { error: "Sportif introuvable." };

  const profileId = athlete.profile_id;

  const { error } = await supabase
    .from("athletes")
    .delete()
    .eq("id", athleteId)
    .eq("coach_id", profile.id);

  if (error) return { error: error.message };

  if (profileId) {
    try {
      const admin = createAdminClient();
      await admin.auth.admin.deleteUser(profileId);
    } catch {
      // Roster déjà supprimé ; le compte Auth peut rester si la clé service manque.
    }
  }

  revalidatePath("/");
  revalidatePath("/sportifs");
  revalidatePath("/editeur");
  revalidatePath("/paiements");
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
