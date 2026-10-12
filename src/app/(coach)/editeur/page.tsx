import Link from "next/link";
import { getEditorData } from "@/lib/editor";
import { listWorkoutTemplates } from "@/lib/actions/templates";
import { requireCoach } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EditorAthletesTable } from "@/components/editor/EditorAthletesTable";
import { EditorWorkspace } from "@/components/editor/EditorWorkspace";
import type { SavedTemplate } from "@/components/editor/SubProgramEditor";

type Props = {
  searchParams: Promise<{ athlete?: string; week?: string; tab?: string }>;
};

export default async function EditorPage({ searchParams }: Props) {
  const { athlete, week, tab } = await searchParams;
  const weekNumber = week ? Number(week) : undefined;
  const defaultTab = tab === "subprogram" ? "subprogram" : "program";

  const [result, templatesResult] = await Promise.all([
    getEditorData(
      athlete,
      Number.isFinite(weekNumber) ? weekNumber : undefined,
    ),
    listWorkoutTemplates(),
  ]);
  const templates = (templatesResult.templates ?? []) as SavedTemplate[];

  if (!result.ok) {
    await requireCoach();
    const supabase = await createClient();
    const { data: library } = await supabase
      .from("exercises")
      .select("*")
      .order("name");

    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <EditorWorkspace
          templates={templates}
          library={library ?? []}
          defaultTab={defaultTab}
          programFallback={
            <div className="flex w-full min-w-0 flex-col gap-6 p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-semibold">
                    Éditeur de programme
                  </h1>
                  <p className="mt-1 text-sm text-ga-muted">
                    Choisis un sportif ou gère les sous-programmes partagés.
                  </p>
                </div>
              </div>
              <EditorAthletesTable athletes={result.overview} />
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <EditorWorkspace
        data={result.data}
        templates={templates}
        library={result.data.exercises}
        defaultTab={defaultTab}
        athleteBar={
          <AthleteBar
            athletes={result.data.athletes}
            selectedId={result.data.athlete.id}
            week={result.data.weekNumber}
          />
        }
      />
    </div>
  );
}

function AthleteBar({
  athletes,
  selectedId,
  week,
}: {
  athletes: { id: string; first_name: string; last_name: string }[];
  selectedId?: string;
  week?: number;
}) {
  if (athletes.length === 0) {
    return (
      <div className="border-b border-ga-border px-6 py-3 text-sm text-ga-muted">
        Aucun sportif. Ajoute-en un depuis la page{" "}
        <Link href="/sportifs" className="text-ga-lime hover:underline">
          Sportifs
        </Link>
        .
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-ga-border px-6 py-3">
      <Link
        href="/editeur"
        className="rounded-full bg-ga-elevated px-3 py-1.5 text-sm text-ga-muted hover:text-ga-fg"
      >
        Tous
      </Link>
      {athletes.map((item) => (
        <Link
          key={item.id}
          href={
            week
              ? `/editeur?athlete=${item.id}&week=${week}`
              : `/editeur?athlete=${item.id}`
          }
          className={`rounded-full px-3 py-1.5 text-sm ${
            item.id === selectedId
              ? "bg-ga-lime font-semibold text-black"
              : "bg-ga-elevated text-ga-muted hover:text-ga-fg"
          }`}
        >
          {item.first_name}
        </Link>
      ))}
    </div>
  );
}
