import { requireAthlete } from "@/lib/auth";
import { getAthleteProgram } from "@/lib/athlete";
import { AthleteWeek } from "@/components/athlete/AthleteWeek";

export default async function ProgrammePage() {
  const { athlete } = await requireAthlete();
  if (!athlete) return null;
  const data = await getAthleteProgram(athlete);
  return <AthleteWeek data={data} />;
}
