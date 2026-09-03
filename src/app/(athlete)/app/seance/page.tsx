import { redirect } from "next/navigation";
import { requireAthlete } from "@/lib/auth";
import { getAthleteProgram } from "@/lib/athlete";

export default async function SeanceIndexPage() {
  const { athlete } = await requireAthlete();
  if (!athlete) return null;
  const data = await getAthleteProgram(athlete);
  const todayType = data.today?.session.session_type;
  const target =
    todayType === "workout" || todayType === "optional"
      ? data.today!.session
      : data.overdue?.session;
  if (target) redirect(`/app/seance/${target.id}`);
  redirect("/app");
}
