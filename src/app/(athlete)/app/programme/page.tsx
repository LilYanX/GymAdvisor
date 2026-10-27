import { Suspense } from "react";
import { requireAthlete } from "@/lib/auth";
import { getAthleteProgram } from "@/lib/athlete";
import { AthleteProgramView } from "@/components/athlete/AthleteProgramView";

export default async function ProgrammePage() {
  const { athlete } = await requireAthlete();
  if (!athlete) return null;
  const data = await getAthleteProgram(athlete);
  return (
    <Suspense
      fallback={
        <div className="px-5 pt-8 text-sm text-ga-muted">Chargement…</div>
      }
    >
      <AthleteProgramView data={data} />
    </Suspense>
  );
}
