import Link from "next/link";
import { AddAthleteForm } from "@/components/athletes/AddAthleteForm";

type Props = {
  searchParams: Promise<{ redirect?: string }>;
};

export default async function NouveauSportifPage({ searchParams }: Props) {
  const { redirect: redirectParam } = await searchParams;
  const redirectTo =
    redirectParam?.startsWith("/") ? redirectParam : "/sportifs";

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="flex flex-col gap-6 p-8">
        <Link
          href={redirectTo}
          className="text-sm text-ga-muted hover:text-ga-fg"
        >
          ← Retour
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">Ajouter un sportif</h1>
          <p className="mt-1 text-sm text-ga-muted">
            Le sportif pourra créer son compte avec l&apos;e-mail saisi.
          </p>
        </div>
        <AddAthleteForm redirectTo={redirectTo} />
      </div>
    </div>
  );
}
