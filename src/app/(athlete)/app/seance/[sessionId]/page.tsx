import { notFound } from "next/navigation";
import { requireAthlete } from "@/lib/auth";
import { getAthleteSession } from "@/lib/athlete";
import { startSession } from "@/lib/actions/session";
import { SessionWorkout } from "@/components/athlete/SessionWorkout";
import { SessionCheckInForm } from "@/components/athlete/SessionCheckInForm";
import {
  firstIncompleteGroupIndex,
  groupWorkoutExercises,
} from "@/lib/workout-groups";
import { createClient } from "@/lib/supabase/server";

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

  const supabase = await createClient();
  const [{ data: checkIn }, { data: coach }] = await Promise.all([
    supabase
      .from("session_check_ins")
      .select("id")
      .eq("athlete_id", athlete.id)
      .eq("session_id", sessionId)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("first_name")
      .eq("id", athlete.coach_id)
      .maybeSingle(),
  ]);

  if (!checkIn) {
    return (
      <SessionCheckInForm
        sessionId={sessionId}
        sessionTitle={session.title}
        coachFirstName={coach?.first_name || "ton coach"}
      />
    );
  }

  const groups = groupWorkoutExercises(session.exercises);
  const startIndex = firstIncompleteGroupIndex(groups);

  return <SessionWorkout session={session} startIndex={startIndex} />;
}
