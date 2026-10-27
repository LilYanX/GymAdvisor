import type {
  Athlete,
  Exercise,
  ProgramWeek,
  Session,
  SessionExercise,
  TargetUnit,
} from "@/lib/supabase/models";

export type EditorSessionExercise = SessionExercise & {
  exercise: Exercise | null;
};

export type EditorSession = Session & {
  session_exercises: EditorSessionExercise[];
};

export type EditorWeek = ProgramWeek & {
  sessions: EditorSession[];
};

export type EditorOverviewAthlete = Pick<
  Athlete,
  "id" | "first_name" | "last_name" | "email" | "current_week" | "total_weeks"
> & {
  latestWeekStatus: "draft" | "published" | null;
};

export type PreviousWeekPerfSet = {
  setNumber: number;
  weightKg: number | null;
  reps: number | null;
  completed: boolean;
};

export type PreviousWeekPerfExercise = {
  sessionExerciseId: string;
  exerciseName: string;
  prescribedSets: number;
  prescribedReps: number;
  prescribedUnit: TargetUnit;
  prescribedWeightKg: number | null;
  sets: PreviousWeekPerfSet[];
};

export type PreviousWeekPerfSession = {
  sessionId: string;
  title: string;
  weekday: number;
  scheduledDate: string | null;
  exercises: PreviousWeekPerfExercise[];
};

export type PreviousWeekPerf = {
  weekNumber: number;
  sessions: PreviousWeekPerfSession[];
};

export type EditorData = {
  athlete: Athlete;
  athletes: Pick<Athlete, "id" | "first_name" | "last_name">[];
  exercises: Exercise[];
  /** Meilleure 1RM estimée par exercice (depuis les charges loggées). */
  estimatedOneRmByExerciseId: Record<string, number>;
  week: EditorWeek | null;
  weekNumber: number;
  availableWeeks: number[];
  /** Réalisé de la semaine N-1 (charges / reps / séries). */
  previousWeekPerf: PreviousWeekPerf | null;
};
