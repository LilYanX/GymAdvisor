import { redirect } from "next/navigation";
import { requireAthlete } from "@/lib/auth";
import { getAthleteProgram } from "@/lib/athlete";

export default async function SeanceIndexPage() {
  const { athlete } = await requireAthlete();
  if (!athlete) return null;
  const data = await getAthleteProgram(athlete);
  const todayType = data.today?.session.session_type;
  if (todayType === "workout" || todayType === "optional") {
    redirect(`/app/seance/${data.today!.session.id}`);
  }
  redirect("/app/programme");
}
