import { requireAthlete } from "@/lib/auth";
import { signOut } from "@/lib/actions/auth";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export default async function MoiPage() {
  const { athlete, profile } = await requireAthlete();
  if (!athlete) return null;

  return (
    <div className="px-5 pb-24 pt-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Profil</h1>
          <p className="mt-1 text-sm text-ga-muted">{profile.email}</p>
        </div>
        <ThemeToggle />
      </div>

      <section className="mt-8 rounded-2xl border border-ga-border bg-ga-card p-4">
        <p className="text-xs uppercase tracking-wide text-ga-muted">Infos</p>
        <p className="mt-2 font-semibold">
          {athlete.first_name} {athlete.last_name}
        </p>
        {athlete.goal ? (
          <p className="mt-2 text-sm text-ga-muted">Objectif : {athlete.goal}</p>
        ) : null}
        <p className="mt-2 text-sm text-ga-muted">
          Semaine {athlete.current_week}/{athlete.total_weeks}
        </p>
      </section>

      <form action={signOut} className="mt-10">
        <button type="submit" className="text-sm text-ga-muted hover:text-ga-fg">
          Se déconnecter
        </button>
      </form>
    </div>
  );
}
