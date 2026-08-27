import type {
  Athlete,
  Exercise,
  ProgramWeek,
  Session,
  SessionExercise,
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

export type EditorData = {
  athlete: Athlete;
  athletes: Pick<Athlete, "id" | "first_name" | "last_name">[];
  exercises: Exercise[];
  week: EditorWeek | null;
  weekNumber: number;
  availableWeeks: number[];
};
