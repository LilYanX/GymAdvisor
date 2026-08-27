import { requireCoach } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard";
import { DashboardView } from "@/components/coach/DashboardView";

export default async function DashboardPage() {
  const { profile } = await requireCoach();
  const data = await getDashboardData(profile.id);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <DashboardView data={data} />
    </div>
  );
}
