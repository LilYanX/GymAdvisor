import type { AthleteExercise } from "@/lib/athlete-types";
import type { SetLog, TargetUnit } from "@/lib/supabase/models";

/** Reps à préremplir pour le logging sportif (pas la distance ni la durée). */
export function loggingRepsForExercise(item: {
  target_reps: number;
  target_unit?: TargetUnit | null;
  target_secondary_reps?: number | null;
}): number | null {
  const unit = item.target_unit ?? "reps";
  if (unit === "meters") return null;
  if (unit === "seconds") return item.target_secondary_reps ?? null;
  return item.target_reps;
}

export function resolveExerciseSets(item: AthleteExercise): SetLog[] {
  const byNumber = new Map(item.sets.map((set) => [set.set_number, set]));
  const defaultReps = loggingRepsForExercise(item);

  return Array.from({ length: item.sets_count }, (_, index) => {
    const setNumber = index + 1;
    const existing = byNumber.get(setNumber);
    if (existing) return existing;

    return {
      id: `local-${setNumber}`,
      session_exercise_id: item.id,
      athlete_id: "",
      set_number: setNumber,
      weight_kg: item.target_weight_kg,
      reps: defaultReps,
      completed: false,
      created_at: "",
      updated_at: "",
    };
  });
}
