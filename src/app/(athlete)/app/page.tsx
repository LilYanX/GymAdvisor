import { requireAthlete } from "@/lib/auth";
import { getAthleteProgram } from "@/lib/athlete";
import { AthleteHome } from "@/components/athlete/AthleteHome";

export default async function AthleteHomePage() {
  const { athlete } = await requireAthlete();
  if (!athlete) return null;
  const data = await getAthleteProgram(athlete);
  return <AthleteHome data={data} />;
}
