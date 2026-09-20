import { notFound } from "next/navigation";
import { requireCoach } from "@/lib/auth";
import { getAthleteFollowUp } from "@/lib/athlete-followup";
import { getAthleteDashboardBundle } from "@/lib/dashboard-metrics";
import { AthleteDetailView } from "@/components/athletes/AthleteDetailView";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AthletePage({ params }: Props) {
  const { id } = await params;
  const { profile } = await requireCoach();
  const data = await getAthleteFollowUp(profile.id, id);
  if (!data) notFound();
  const dashboard = await getAthleteDashboardBundle(id);
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <AthleteDetailView data={data} dashboard={dashboard} />
    </div>
  );
}
