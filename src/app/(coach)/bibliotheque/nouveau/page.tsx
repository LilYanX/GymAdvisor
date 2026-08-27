import Link from "next/link";
import { requireCoach } from "@/lib/auth";
import { ExerciseForm } from "@/components/library/ExerciseForm";

export default async function NewExercisePage() {
  await requireCoach();

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="min-w-0 flex-1 overflow-y-auto p-6 lg:p-8">
        <Link
          href="/bibliotheque"
          className="text-sm text-ga-muted hover:text-ga-fg"
        >
          ← Bibliothèque
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">Nouvel exercice</h1>
        <div className="mt-6 w-full min-w-0">
          <ExerciseForm />
        </div>
      </div>
    </div>
  );
}
