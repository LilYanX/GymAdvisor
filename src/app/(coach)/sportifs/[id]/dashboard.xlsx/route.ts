import { notFound } from "next/navigation";
import { requireCoach } from "@/lib/auth";
import {
  computeAthleteDashboard,
  type DashboardPeriod,
} from "@/lib/dashboard-metrics";
import { buildDashboardWorkbook } from "@/lib/dashboard-excel";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: Props) {
  const { id } = await params;
  const periodParam = new URL(request.url).searchParams.get("period");
  const period: DashboardPeriod =
    periodParam === "month" ? "month" : "week";

  const { profile } = await requireCoach();
  const supabase = await createClient();
  const { data: athlete } = await supabase
    .from("athletes")
    .select("id, first_name, last_name")
    .eq("id", id)
    .eq("coach_id", profile.id)
    .maybeSingle();

  if (!athlete) notFound();

  const metrics = await computeAthleteDashboard(athlete.id, period);
  const name = `${athlete.first_name} ${athlete.last_name}`.trim();
  const buffer = await buildDashboardWorkbook(name, metrics);
  const filename = `suivi-${athlete.first_name.toLowerCase()}-${period}-${metrics.from}.xlsx`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
