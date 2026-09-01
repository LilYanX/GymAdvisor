import type {
  EditorSession,
  EditorSessionExercise,
  EditorWeek,
} from "@/lib/editor-types";
import type { Exercise, SessionType } from "@/lib/supabase/models";

const LOCAL_PREFIX = "local:";

export function isLocalId(id: string): boolean {
  return id.startsWith(LOCAL_PREFIX);
}

export function newLocalId(): string {
  return `${LOCAL_PREFIX}${crypto.randomUUID()}`;
}

function normalizeSessionExercises(
  exercises: EditorSessionExercise[],
): EditorSessionExercise[] {
  return exercises.map((exercise, index) => ({
    ...exercise,
    sort_order: index,
  }));
}

function updateSession(
  week: EditorWeek,
  sessionId: string,
  updater: (session: EditorSession) => EditorSession,
): EditorWeek {
  return {
    ...week,
    sessions: week.sessions.map((session) =>
      session.id === sessionId ? updater(session) : session,
    ),
  };
}

function findExercise(
  week: EditorWeek,
  sessionExerciseId: string,
): { session: EditorSession; exercise: EditorSessionExercise; index: number } | null {
  for (const session of week.sessions) {
    const index = session.session_exercises.findIndex(
      (exercise) => exercise.id === sessionExerciseId,
    );
    if (index >= 0) {
      return { session, exercise: session.session_exercises[index], index };
    }
  }
  return null;
}

export function addSessionLocal(
  week: EditorWeek,
  weekday: number,
  title: string,
): EditorWeek {
  const session: EditorSession = {
    id: newLocalId(),
    program_week_id: week.id,
    weekday,
    scheduled_date: null,
    title: title.trim() || `Jour ${week.sessions.length + 1}`,
    session_type: "workout",
    rest_details: "",
    suggested_time: null,
    estimated_minutes: null,
    sort_order: weekday,
    created_at: "",
    updated_at: "",
    session_exercises: [],
  };

  return {
    ...week,
    sessions: [...week.sessions, session].sort((a, b) => a.weekday - b.weekday),
  };
}

export function deleteSessionLocal(week: EditorWeek, sessionId: string): EditorWeek {
  return {
    ...week,
    sessions: week.sessions.filter((session) => session.id !== sessionId),
  };
}

export function addExerciseToSessionLocal(
  week: EditorWeek,
  sessionId: string,
  exercise: Exercise,
  beforeExerciseId: string | null = null,
): EditorWeek {
  const newExercise: EditorSessionExercise = {
    id: newLocalId(),
    session_id: sessionId,
    exercise_id: exercise.id,
    sort_order: 0,
    sets_count: 4,
    target_reps: 8,
    target_weight_kg: null,
    target_percent: null,
    target_rpe: null,
    rest_seconds: 120,
    coach_note: "",
    superset_group_id: null,
    created_at: "",
    updated_at: "",
    exercise,
  };

  return updateSession(week, sessionId, (session) => {
    const exercises = [...session.session_exercises];
    let insertIndex = exercises.length;
    if (beforeExerciseId) {
      const index = exercises.findIndex((item) => item.id === beforeExerciseId);
      if (index >= 0) insertIndex = index;
    }
    exercises.splice(insertIndex, 0, newExercise);
    return {
      ...session,
      session_exercises: normalizeSessionExercises(exercises),
    };
  });
}

export function removeSessionExerciseLocal(
  week: EditorWeek,
  sessionExerciseId: string,
): EditorWeek {
  const located = findExercise(week, sessionExerciseId);
  if (!located) return week;

  const removedGroupId = located.exercise.superset_group_id;

  return updateSession(week, located.session.id, (session) => {
    let exercises = session.session_exercises.filter(
      (exercise) => exercise.id !== sessionExerciseId,
    );

    if (removedGroupId) {
      const siblings = exercises.filter(
        (exercise) => exercise.superset_group_id === removedGroupId,
      );
      if (siblings.length === 1) {
        exercises = exercises.map((exercise) =>
          exercise.superset_group_id === removedGroupId
            ? { ...exercise, superset_group_id: null }
            : exercise,
        );
      }
    }

    return {
      ...session,
      session_exercises: normalizeSessionExercises(exercises),
    };
  });
}

export function moveSessionExerciseLocal(
  week: EditorWeek,
  sessionExerciseId: string,
  targetSessionId: string,
  beforeExerciseId: string | null = null,
): EditorWeek {
  const located = findExercise(week, sessionExerciseId);
  if (!located) return week;

  const crossSession = located.session.id !== targetSessionId;
  let moving = { ...located.exercise };
  if (crossSession) {
    moving = { ...moving, superset_group_id: null, session_id: targetSessionId };
  }

  const without = updateSession(week, located.session.id, (session) => ({
    ...session,
    session_exercises: normalizeSessionExercises(
      session.session_exercises.filter((exercise) => exercise.id !== sessionExerciseId),
    ),
  }));

  return updateSession(without, targetSessionId, (session) => {
    const exercises = [...session.session_exercises];
    let insertIndex = exercises.length;
    if (beforeExerciseId && beforeExerciseId !== sessionExerciseId) {
      const index = exercises.findIndex((item) => item.id === beforeExerciseId);
      if (index >= 0) insertIndex = index;
    }
    exercises.splice(insertIndex, 0, moving);
    return {
      ...session,
      session_exercises: normalizeSessionExercises(exercises),
    };
  });
}

export function linkSupersetWithPreviousLocal(
  week: EditorWeek,
  sessionExerciseId: string,
): EditorWeek {
  const located = findExercise(week, sessionExerciseId);
  if (!located || located.index === 0) return week;

  const previous = located.session.session_exercises[located.index - 1];
  const groupId = previous.superset_group_id ?? newLocalId();
  const idsToUpdate = previous.superset_group_id
    ? [sessionExerciseId]
    : [previous.id, sessionExerciseId];

  return updateSession(week, located.session.id, (session) => ({
    ...session,
    session_exercises: session.session_exercises.map((exercise) =>
      idsToUpdate.includes(exercise.id)
        ? { ...exercise, superset_group_id: groupId }
        : exercise,
    ),
  }));
}

export function unlinkFromSupersetLocal(
  week: EditorWeek,
  sessionExerciseId: string,
): EditorWeek {
  const located = findExercise(week, sessionExerciseId);
  if (!located?.exercise.superset_group_id) return week;

  const groupId = located.exercise.superset_group_id;

  return updateSession(week, located.session.id, (session) => {
    let exercises = session.session_exercises.map((exercise) =>
      exercise.id === sessionExerciseId
        ? { ...exercise, superset_group_id: null }
        : exercise,
    );

    const siblings = exercises.filter(
      (exercise) => exercise.superset_group_id === groupId,
    );
    if (siblings.length === 1) {
      exercises = exercises.map((exercise) =>
        exercise.superset_group_id === groupId
          ? { ...exercise, superset_group_id: null }
          : exercise,
      );
    }

    return { ...session, session_exercises: exercises };
  });
}

export type WeekSyncPayload = {
  sessions: Array<{
    id: string;
    weekday: number;
    title: string;
    session_type: SessionType;
    rest_details: string | null;
    session_exercises: Array<{
      id: string;
      exercise_id: string;
      sort_order: number;
      superset_group_id: string | null;
      sets_count: number;
      target_reps: number;
      target_weight_kg: number | null;
      target_percent: number | null;
      target_rpe: number | null;
      rest_seconds: number | null;
      coach_note: string;
    }>;
  }>;
};

export function serializeWeekForSync(week: EditorWeek): WeekSyncPayload {
  return {
    sessions: week.sessions.map((session) => ({
      id: session.id,
      weekday: session.weekday,
      title: session.title,
      session_type: session.session_type,
      rest_details: session.rest_details || null,
      session_exercises: session.session_exercises.map((exercise, index) => ({
        id: exercise.id,
        exercise_id: exercise.exercise_id,
        sort_order: index,
        superset_group_id: exercise.superset_group_id,
        sets_count: exercise.sets_count,
        target_reps: exercise.target_reps,
        target_weight_kg: exercise.target_weight_kg,
        target_percent: exercise.target_percent,
        target_rpe: exercise.target_rpe,
        rest_seconds: exercise.rest_seconds,
        coach_note: exercise.coach_note,
      })),
    })),
  };
}
