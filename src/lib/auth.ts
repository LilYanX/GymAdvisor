import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Athlete, Profile } from "@/lib/supabase/models";

export async function getAuthProfile(): Promise<{
  profile: Profile;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return null;
  return { profile };
}

export async function requireCoach(): Promise<{
  profile: Profile;
}> {
  const session = await getAuthProfile();
  if (!session) redirect("/login");
  if (session.profile.role !== "coach") redirect("/app");
  return session;
}

export async function requireAthlete(): Promise<{
  profile: Profile;
  athlete: Athlete | null;
}> {
  const session = await getAuthProfile();
  if (!session) redirect("/login");
  if (session.profile.role === "coach") redirect("/");

  const supabase = await createClient();
  const { data: athlete } = await supabase
    .from("athletes")
    .select("*")
    .eq("profile_id", session.profile.id)
    .maybeSingle();

  return { profile: session.profile, athlete };
}
