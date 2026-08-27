import { requireAthlete } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { mondayOfWeekISO } from "@/lib/dates";
import { CheckInForm } from "@/components/athlete/CheckInForm";

export default async function MoiPage() {
  const { athlete } = await requireAthlete();
  if (!athlete) return null;

  const supabase = await createClient();
  const [{ data: coach }, { data: checkIn }] = await Promise.all([
    supabase
      .from("profiles")
      .select("first_name")
      .eq("id", athlete.coach_id)
      .maybeSingle(),
    supabase
      .from("check_ins")
      .select("*")
      .eq("athlete_id", athlete.id)
      .eq("week_start_date", mondayOfWeekISO())
      .maybeSingle(),
  ]);

  return (
    <CheckInForm
      coachFirstName={coach?.first_name || "ton coach"}
      existing={checkIn}
    />
  );
}
