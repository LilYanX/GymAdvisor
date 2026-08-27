import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCoach } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EditExerciseForm } from "@/components/library/EditExerciseForm";
import { ExerciseMedia } from "@/components/media/ExerciseMedia";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditExercisePage({ params }: Props) {
  await requireCoach();
  const { id } = await params;
  const supabase = await createClient();

  const { data: exercise } = await supabase
    .from("exercises")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!exercise) notFound();

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-8">
        <Link
          href="/bibliotheque"
          className="text-sm text-ga-muted hover:text-ga-fg"
        >
          ← Bibliothèque
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">{exercise.name}</h1>
        </div>
        <div className="overflow-hidden rounded-xl bg-ga-elevated">
          <ExerciseMedia
            url={exercise.video_url}
            name={exercise.name}
            className="h-48 w-full"
            playing
          />
        </div>
        <EditExerciseForm exercise={exercise} />
      </div>
    </div>
  );
}
