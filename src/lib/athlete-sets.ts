import type { AthleteExercise } from "@/lib/athlete-types";
import type { SetLog } from "@/lib/supabase/models";

export function resolveExerciseSets(item: AthleteExercise): SetLog[] {
  const byNumber = new Map(item.sets.map((set) => [set.set_number, set]));

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
      reps: item.target_reps,
      completed: false,
      created_at: "",
      updated_at: "",
    };
  });
}
