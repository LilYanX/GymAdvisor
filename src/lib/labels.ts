import type { MuscleGroup, SessionType } from "@/lib/supabase/models";

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  jambe: "Jambe",
  push: "Push",
  pull: "Pull",
  core: "Core",
  cardio: "Cardio",
  mobilite: "Mobilité",
  balistique: "Balistique",
  pliometrie: "Pliométrie",
};

export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  workout: "Séance",
  rest: "Repos",
  optional: "Optionnel",
};

export const WEEKDAYS = [
  { value: 1, label: "Lundi" },
  { value: 2, label: "Mardi" },
  { value: 3, label: "Mercredi" },
  { value: 4, label: "Jeudi" },
  { value: 5, label: "Vendredi" },
  { value: 6, label: "Samedi" },
  { value: 7, label: "Dimanche" },
] as const;

export const WEEKDAY_SHORT = ["L", "M", "M", "J", "V", "S", "D"] as const;

export function weekdayShort(weekday: number): string {
  return WEEKDAY_SHORT[weekday - 1] ?? "?";
}

export function weekdayLabel(weekday: number): string {
  return WEEKDAYS.find((day) => day.value === weekday)?.label ?? `Jour ${weekday}`;
}

export function formatRest(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}'${String(rest).padStart(2, "0")}`;
}
