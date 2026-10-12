import { notFound } from "next/navigation";
import { requireAthlete } from "@/lib/auth";
import { getAthleteSession } from "@/lib/athlete";
import { AthleteSessionOverview } from "@/components/athlete/AthleteSessionOverview";

type Props = {
  params: Promise<{ sessionId: string }>;
};

export default async function ProgrammeSeancePage({ params }: Props) {
  const { sessionId } = await params;
  const { athlete } = await requireAthlete();
  if (!athlete) return null;

  const session = await getAthleteSession(athlete, sessionId);
  if (!session) notFound();

  if (session.session_type === "rest") {
    notFound();
  }

  return <AthleteSessionOverview session={session} />;
}
