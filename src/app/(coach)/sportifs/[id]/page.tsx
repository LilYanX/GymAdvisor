import { notFound } from "next/navigation";
import { requireCoach } from "@/lib/auth";
import { getAthleteFollowUp } from "@/lib/athlete-followup";
import { getAthleteDashboardBundle } from "@/lib/dashboard-metrics";
import { parseDashboardDate } from "@/lib/dates";
import { AthleteDetailView } from "@/components/athletes/AthleteDetailView";
import { getAthleteBodyLogs } from "@/lib/actions/athlete-profile";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string }>;
};

export default async function AthletePage({ params, searchParams }: Props) {
  const { id } = await params;
  const { date } = await searchParams;
  const referenceDate = parseDashboardDate(date);
  const { profile } = await requireCoach();
  const data = await getAthleteFollowUp(profile.id, id);
  if (!data) notFound();
  const [dashboard, bodyLogs] = await Promise.all([
    getAthleteDashboardBundle(id, referenceDate),
    getAthleteBodyLogs(id),
  ]);
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <AthleteDetailView
        data={data}
        dashboard={dashboard}
        bodyLogs={bodyLogs}
      />
    </div>
  );
}
