import { notFound } from "next/navigation";
import { requireAthlete } from "@/lib/auth";
import { getAthleteSession } from "@/lib/athlete";
import { startSession } from "@/lib/actions/session";
import { SessionWorkout } from "@/components/athlete/SessionWorkout";
import {
  firstIncompleteGroupIndex,
  groupWorkoutExercises,
} from "@/lib/workout-groups";

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

  const groups = groupWorkoutExercises(session.exercises);
  const startIndex = firstIncompleteGroupIndex(groups);

  return (
    <SessionWorkout session={session} startIndex={startIndex} />
  );
}
