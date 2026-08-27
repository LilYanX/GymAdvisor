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
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="min-w-0 flex-1 overflow-y-auto p-6 lg:p-8">
        <Link
          href="/bibliotheque"
          className="text-sm text-ga-muted hover:text-ga-fg"
        >
          ← Bibliothèque
        </Link>

        <h1 className="mt-4 text-2xl font-semibold">{exercise.name}</h1>

        <div className="mt-6 grid w-full min-w-0 gap-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,28rem)_minmax(0,1fr)]">
          <div className="min-w-0 lg:sticky lg:top-0 lg:self-start">
            <div className="overflow-hidden rounded-xl bg-ga-elevated">
              <ExerciseMedia
                url={exercise.video_url}
                name={exercise.name}
                className="aspect-video w-full"
                playing
              />
            </div>
          </div>

          <div className="min-w-0">
            <EditExerciseForm exercise={exercise} />
          </div>
        </div>
      </div>
    </div>
  );
}
