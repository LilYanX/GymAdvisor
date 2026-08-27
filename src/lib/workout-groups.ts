import type { AthleteExercise } from "@/lib/athlete-types";

export type WorkoutGroup =
  | { kind: "single"; item: AthleteExercise }
  | { kind: "superset"; items: AthleteExercise[] };

export function groupWorkoutExercises(items: AthleteExercise[]): WorkoutGroup[] {
  const groups: WorkoutGroup[] = [];
  let index = 0;

  while (index < items.length) {
    const item = items[index];
    const groupId = item.superset_group_id;

    if (!groupId) {
      groups.push({ kind: "single", item });
      index += 1;
      continue;
    }

    const batch = [item];
    let next = index + 1;
    while (next < items.length && items[next].superset_group_id === groupId) {
      batch.push(items[next]);
      next += 1;
    }
    groups.push({ kind: "superset", items: batch });
    index = next;
  }

  return groups;
}

export function workoutGroupItems(group: WorkoutGroup): AthleteExercise[] {
  return group.kind === "single" ? [group.item] : group.items;
}

export function isExerciseComplete(item: AthleteExercise): boolean {
  return item.sets.length > 0 && item.sets.every((set) => set.completed);
}

export function isWorkoutGroupComplete(group: WorkoutGroup): boolean {
  return workoutGroupItems(group).every(isExerciseComplete);
}

export function firstIncompleteGroupIndex(groups: WorkoutGroup[]): number {
  const index = groups.findIndex((group) => !isWorkoutGroupComplete(group));
  return index === -1 ? 0 : index;
}
