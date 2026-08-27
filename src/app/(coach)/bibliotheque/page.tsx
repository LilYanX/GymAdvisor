import { requireCoach } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { LibraryView } from "@/components/library/LibraryView";

export default async function LibraryPage() {
  const { profile } = await requireCoach();
  const supabase = await createClient();
  const { data: exercises } = await supabase
    .from("exercises")
    .select("*")
    .eq("coach_id", profile.id)
    .order("name");

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <LibraryView exercises={exercises ?? []} />
    </div>
  );
}
