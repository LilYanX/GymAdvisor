import Link from "next/link";
import { requireCoach } from "@/lib/auth";
import { ExerciseForm } from "@/components/library/ExerciseForm";

export default async function NewExercisePage() {
  await requireCoach();

  return (
    <div className="mx-auto w-full max-w-2xl overflow-y-auto p-8">
      <Link
        href="/bibliotheque"
        className="text-sm text-ga-muted hover:text-ga-fg"
      >
        ← Bibliothèque
      </Link>
      <h1 className="mt-4 text-2xl font-semibold">Nouvel exercice</h1>
      <div className="mt-6">
        <ExerciseForm />
      </div>
    </div>
  );
}
