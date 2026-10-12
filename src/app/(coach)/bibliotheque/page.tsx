import { requireCoach } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { LibraryView } from "@/components/library/LibraryView";
import { MUSCLE_GROUP_LABELS } from "@/lib/labels";
import type { MuscleGroup } from "@/lib/supabase/models";

const PAGE_SIZE = 24;

type Props = {
  searchParams: Promise<{ page?: string; group?: string; q?: string }>;
};

function parseGroup(raw: string | undefined): "all" | MuscleGroup {
  if (!raw || raw === "all") return "all";
  if (raw in MUSCLE_GROUP_LABELS) return raw as MuscleGroup;
  return "all";
}

export default async function LibraryPage({ searchParams }: Props) {
  await requireCoach();
  const params = await searchParams;
  const group = parseGroup(params.group);
  const query = (params.q ?? "").trim();
  const pageRaw = Number(params.page ?? "1");
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;

  const supabase = await createClient();
  let request = supabase
    .from("exercises")
    .select("*", { count: "exact" })
    .order("name");

  if (group !== "all") {
    request = request.eq("muscle_group", group);
  }
  if (query) {
    request = request.ilike("name", `%${query}%`);
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data: exercises, count } = await request.range(from, to);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <LibraryView
        exercises={exercises ?? []}
        totalCount={count ?? 0}
        page={page}
        group={group}
        query={query}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}
