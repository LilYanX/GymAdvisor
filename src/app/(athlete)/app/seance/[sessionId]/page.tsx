import { notFound } from "next/navigation";
import { requireAthlete } from "@/lib/auth";
import { getAthleteSession } from "@/lib/athlete";
import { startSession } from "@/lib/actions/session";
import { SessionWorkout } from "@/components/athlete/SessionWorkout";

type Props = {
  params: Promise<{ sessionId: string }>;
};

export default async function SeancePage({ params }: Props) {
  const { sessionId } = await params;
  const { athlete } = await requireAthlete();
  if (!athlete) return null;

  await startSession(sessionId);
  const session = await getAthleteSession(athlete, sessionId);
  if (!session) notFound();

  const firstIncomplete = session.exercises.findIndex((item) => {
    const done =
      item.sets.length > 0 && item.sets.every((set) => set.completed);
    return !done;
  });

  return (
    <SessionWorkout
      session={session}
      startIndex={firstIncomplete === -1 ? 0 : firstIncomplete}
    />
  );
}
