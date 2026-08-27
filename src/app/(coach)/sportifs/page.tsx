import Link from "next/link";
import { requireCoach } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AthletesTable } from "@/components/athletes/AthletesTable";

export default async function SportifsPage() {
  const { profile } = await requireCoach();
  const supabase = await createClient();
  const { data: athletes } = await supabase
    .from("athletes")
    .select("*")
    .eq("coach_id", profile.id)
    .is("archived_at", null)
    .order("first_name");

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="flex flex-col gap-6 p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Sportifs</h1>
            <p className="mt-1 text-sm text-ga-muted">
              {(athletes?.length ?? 0) === 0
                ? "Aucun sportif actif"
                : `${athletes?.length} sportif${(athletes?.length ?? 0) > 1 ? "s" : ""} actif${(athletes?.length ?? 0) > 1 ? "s" : ""}`}
            </p>
          </div>
          <Link
            href="/sportifs/nouveau"
            className="rounded-lg bg-ga-lime px-4 py-2 text-sm font-semibold text-black hover:bg-lime-300"
          >
            Ajouter un sportif
          </Link>
        </div>

        <AthletesTable athletes={athletes ?? []} />
      </div>
    </div>
  );
}
