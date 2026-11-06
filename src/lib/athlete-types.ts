import type {
  Athlete,
  AthleteActivity,
  Exercise,
  ProgramWeek,
  Session,
  SessionExercise,
  SessionExerciseLog,
  SessionLog,
  SetLog,
} from "@/lib/supabase/models";

export type AthleteExercise = SessionExercise & {
  exercise: Exercise | null;
  log: SessionExerciseLog | null;
  sets: SetLog[];
  /** Variantes du même groupe (niveaux), si renseigné. */
  variantOptions: Exercise[];
};

export type AthleteSessionView = Session & {
  exercises: AthleteExercise[];
  log: SessionLog | null;
};

export type DayKind = "completed" | "today" | "upcoming" | "rest" | "missed";

export type AthleteDay = {
  session: AthleteSessionView;
  kind: DayKind;
};

export type AthleteCalendarMarker = {
  /** Activités libres + séances complétées/skipped (pastille verte). */
  activityCount: number;
  /** Séance programmée non terminée (pastille bleue). */
  hasPlannedSession: boolean;
};

export type AthleteProgram = {
  athlete: Athlete;
  coachFirstName: string;
  week: ProgramWeek | null;
  days: AthleteDay[];
  today: AthleteDay | null;
  overdue: AthleteDay | null;
  programJustPublished: boolean;
  activities: AthleteActivity[];
  todayISO: string;
  /** Pastilles calendrier (activités + séances planifiées non terminées). */
  calendarMarkers: Record<string, AthleteCalendarMarker>;
};
