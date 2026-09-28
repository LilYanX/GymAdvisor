import { requireAthlete } from "@/lib/auth";
import { signOut } from "@/lib/actions/auth";
import { getAthleteDashboardBundle } from "@/lib/dashboard-metrics";
import { parseDashboardDate } from "@/lib/dates";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { AthleteMetricsDashboard } from "@/components/dashboard/AthleteMetricsDashboard";
import { AthleteProfileEditor } from "@/components/athlete/AthleteProfileEditor";
import { getAthleteBodyLogs } from "@/lib/actions/athlete-profile";

function initials(firstName: string, lastName: string): string {
  const a = firstName.trim().charAt(0);
  const b = lastName.trim().charAt(0);
  return `${a}${b}`.toUpperCase() || "?";
}

type Props = {
  searchParams: Promise<{ date?: string }>;
};

export default async function MoiPage({ searchParams }: Props) {
  const { athlete, profile } = await requireAthlete();
  if (!athlete) return null;

  const params = await searchParams;
  const referenceDate = parseDashboardDate(params.date);

  const name = `${athlete.first_name} ${athlete.last_name}`.trim();
  const progressPct =
    athlete.total_weeks > 0
      ? Math.min(
          100,
          Math.round((athlete.current_week / athlete.total_weeks) * 100),
        )
      : 0;

  const [dashboard, bodyLogs] = await Promise.all([
    getAthleteDashboardBundle(athlete.id, referenceDate),
    getAthleteBodyLogs(athlete.id),
  ]);

  return (
    <div className="px-5 pb-24 pt-8">
      <header className="ga-fade-in flex items-center gap-4">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-ga-lime/15 text-lg font-semibold text-ga-lime"
          aria-hidden="true"
        >
          {initials(athlete.first_name, athlete.last_name)}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-ga-muted">
            Profil
          </p>
          <h1 className="mt-0.5 truncate text-2xl font-semibold tracking-tight">
            {name}
          </h1>
          <p className="mt-1 truncate text-sm text-ga-muted">{profile.email}</p>
        </div>
      </header>

      <div className="mt-8">
        <AthleteProfileEditor athlete={athlete} bodyLogs={bodyLogs} />
      </div>

      <section className="mt-4 overflow-hidden rounded-2xl border border-ga-border bg-ga-card">
        <div className="px-4 py-3.5">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-xs uppercase tracking-wide text-ga-muted">
              Programme
            </p>
            <p className="text-sm text-ga-muted">
              Semaine{" "}
              <span className="font-semibold text-ga-fg">
                {athlete.current_week}
              </span>
              {" / "}
              {athlete.total_weeks}
            </p>
          </div>
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-ga-elevated">
            <div
              className="h-full rounded-full bg-ga-lime transition-[width] duration-500 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </section>

      <div className="mt-4">
        <AthleteMetricsDashboard bundle={dashboard} variant="athlete" />
      </div>

      <section className="mt-4 overflow-hidden rounded-2xl border border-ga-border bg-ga-card">
        <div className="flex items-center justify-between gap-3 px-4 py-3.5">
          <div>
            <p className="text-sm font-medium">Apparence</p>
          </div>
          <ThemeToggle />
        </div>
      </section>

      <form action={signOut} className="mt-10">
        <button
          type="submit"
          className="flex w-full items-center justify-center rounded-xl border border-ga-border bg-ga-card py-3 text-sm font-medium text-ga-muted transition hover:border-ga-red/40 hover:text-ga-red"
        >
          Se déconnecter
        </button>
      </form>
    </div>
  );
}
