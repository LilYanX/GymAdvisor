import type {
  Athlete,
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

export type AthleteProgram = {
  athlete: Athlete;
  coachFirstName: string;
  week: ProgramWeek | null;
  days: AthleteDay[];
  today: AthleteDay | null;
  overdue: AthleteDay | null;
  programJustPublished: boolean;
};
