"use client";

import { useEffect, useMemo, useRef, useState, useTransition, type DragEvent, type WheelEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { EditorData, EditorSession, EditorSessionExercise, EditorWeek } from "@/lib/editor-types";
import {
  addExerciseToSession,
  addSession,
  deleteSession,
  ensureDraftWeek,
  fetchEditorWeek,
  linkSupersetWithPrevious,
  moveSessionExercise,
  publishWeek,
  removeSessionExercise,
  saveWeekDraft,
  unlinkFromSuperset,
  updateSessionExercise,
  type WeekDraftPayload,
} from "@/lib/actions/program";
import {
  formatRest,
  MUSCLE_GROUP_LABELS,
  SESSION_TYPE_LABELS,
  WEEKDAYS,
  weekdayLabel,
} from "@/lib/labels";
import type { SessionType } from "@/lib/supabase/models";
import { IconPlus, IconTrash } from "@/components/icons";
import { ExerciseMedia } from "@/components/media/ExerciseMedia";
import { useLoading } from "@/components/layout/LoadingProvider";

type ExerciseGroup =
  | { kind: "single"; item: EditorSessionExercise; index: number }
  | { kind: "superset"; items: EditorSessionExercise[]; startIndex: number };

function groupExercises(items: EditorSessionExercise[]): ExerciseGroup[] {
  const groups: ExerciseGroup[] = [];
  let index = 0;

  while (index < items.length) {
    const item = items[index];
    const groupId = item.superset_group_id;

    if (!groupId) {
      groups.push({ kind: "single", item, index });
      index += 1;
      continue;
    }

    const batch = [item];
    let next = index + 1;
    while (next < items.length && items[next].superset_group_id === groupId) {
      batch.push(items[next]);
      next += 1;
    }
    groups.push({ kind: "superset", items: batch, startIndex: index });
    index = next;
  }

  return groups;
}

const LIBRARY_DRAG = "application/x-gymadvisor-library-exercise";
const SESSION_DRAG = "application/x-gymadvisor-session-exercise";

type DropTarget = {
  sessionId: string;
  beforeExerciseId: string | null;
};

function scrollContainerOnWheel(
  container: HTMLDivElement | null,
  event: WheelEvent,
) {
  if (!container || container.scrollHeight <= container.clientHeight) return;
  const { deltaY } = event;
  const atTop = container.scrollTop <= 0;
  const atBottom =
    container.scrollTop + container.clientHeight >= container.scrollHeight - 1;
  if ((deltaY < 0 && atTop) || (deltaY > 0 && atBottom)) return;
  container.scrollTop += deltaY;
  event.preventDefault();
  event.stopPropagation();
}

function groupLeadId(group: ExerciseGroup): string {
  return group.kind === "single" ? group.item.id : group.items[0].id;
}

function patchExerciseInWeek(
  week: EditorWeek,
  exerciseId: string,
  patch: Partial<EditorSessionExercise>,
): EditorWeek {
  return {
    ...week,
    sessions: week.sessions.map((session) => ({
      ...session,
      session_exercises: session.session_exercises.map((exercise) =>
        exercise.id === exerciseId ? { ...exercise, ...patch } : exercise,
      ),
    })),
  };
}

function patchSessionInWeek(
  week: EditorWeek,
  sessionId: string,
  patch: Partial<EditorSession>,
): EditorWeek {
  return {
    ...week,
    sessions: week.sessions.map((session) =>
      session.id === sessionId ? { ...session, ...patch } : session,
    ),
  };
}

function serializeWeekDraft(week: EditorWeek): WeekDraftPayload {
  return {
    sessions: week.sessions.map((session) => ({
      id: session.id,
      title: session.title,
      session_type: session.session_type,
      rest_details: session.rest_details,
      session_exercises: session.session_exercises.map((exercise) => ({
        id: exercise.id,
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

export function ProgramEditor({ data }: { data: EditorData }) {
  const router = useRouter();
  const { setLoading } = useLoading();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    data.week?.sessions[0]?.id ?? null,
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [dragOverSessionId, setDragOverSessionId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const [draftWeek, setDraftWeek] = useState<EditorWeek | null>(data.week);
  const [dirty, setDirty] = useState(false);
  const libraryScrollRef = useRef<HTMLDivElement>(null);
  const sessionScrollRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const week = data.week;
  const editorWeek = draftWeek ?? week;

  useEffect(() => {
    setDraftWeek(week);
    setDirty(false);
  }, [week, data.weekNumber, data.athlete.id]);

  useEffect(() => {
    const ids = editorWeek?.sessions.map((session) => session.id) ?? [];
    if (selectedSessionId && ids.includes(selectedSessionId)) return;
    setSelectedSessionId(ids[0] ?? null);
  }, [editorWeek, selectedSessionId]);

  const usedDays = new Set(editorWeek?.sessions.map((session) => session.weekday) ?? []);
  const freeDays = WEEKDAYS.filter((day) => !usedDays.has(day.value));

  const filteredExercises = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return data.exercises;
    return data.exercises.filter((exercise) =>
      exercise.name.toLowerCase().includes(needle),
    );
  }, [data.exercises, query]);

  function patchExercise(
    exerciseId: string,
    patch: Parameters<typeof updateSessionExercise>[1],
  ) {
    setDraftWeek((current) => {
      if (!current) return current;
      return patchExerciseInWeek(current, exerciseId, patch);
    });
    setDirty(true);
  }

  function patchSession(sessionId: string, patch: Partial<EditorSession>) {
    setDraftWeek((current) => {
      if (!current) return current;
      return patchSessionInWeek(current, sessionId, patch);
    });
    setDirty(true);
  }

  async function ensureDraftSaved(currentWeek: EditorWeek) {
    if (!dirty) return { error: null as string | null };
    return saveWeekDraft(currentWeek.id, serializeWeekDraft(currentWeek));
  }

  async function reloadWeek(weekId: string) {
    const result = await fetchEditorWeek(weekId);
    if (result.error) return { error: result.error };
    if (result.week) setDraftWeek(result.week);
    setDirty(false);
    return { error: null };
  }

  function run(action: () => Promise<{ error: string | null }>) {
    setError(null);
    setLoading(true);
    startTransition(async () => {
      const currentWeek = draftWeek ?? week;
      if (!currentWeek) {
        setLoading(false);
        return;
      }

      const saved = await ensureDraftSaved(currentWeek);
      if (saved.error) {
        setError(saved.error);
        setLoading(false);
        return;
      }
      setDirty(false);

      const result = await action();
      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      const reloaded = await reloadWeek(currentWeek.id);
      if (reloaded.error) setError(reloaded.error);
      setLoading(false);
    });
  }

  function publish() {
    setError(null);
    setLoading(true);
    startTransition(async () => {
      const currentWeek = draftWeek ?? week;
      if (!currentWeek) {
        setLoading(false);
        return;
      }

      const saved = await saveWeekDraft(currentWeek.id, serializeWeekDraft(currentWeek));
      if (saved.error) {
        setError(saved.error);
        setLoading(false);
        return;
      }

      const published = await publishWeek(currentWeek.id);
      if (published.error) {
        setError(published.error);
        setLoading(false);
        return;
      }

      setDirty(false);
      router.refresh();
      setLoading(false);
    });
  }

  function handleDropAt(
    sessionId: string,
    beforeExerciseId: string | null,
    event: DragEvent<HTMLElement>,
  ) {
    event.preventDefault();
    event.stopPropagation();
    setDragOverSessionId(null);
    setDropTarget(null);

    const libraryExerciseId = event.dataTransfer.getData(LIBRARY_DRAG);
    const sessionExerciseId = event.dataTransfer.getData(SESSION_DRAG);

    if (libraryExerciseId) {
      run(() => addExerciseToSession(sessionId, libraryExerciseId, beforeExerciseId));
      return;
    }
    if (sessionExerciseId) {
      run(() =>
        moveSessionExercise(sessionExerciseId, sessionId, beforeExerciseId),
      );
    }
  }

  function bindDropZone(sessionId: string, beforeExerciseId: string | null) {
    return {
      active:
        dropTarget?.sessionId === sessionId &&
        dropTarget.beforeExerciseId === beforeExerciseId,
      onDragOver: (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = "move";
        setDragOverSessionId(sessionId);
        setDropTarget({ sessionId, beforeExerciseId });
      },
      onDragLeave: () => {
        setDropTarget((current) =>
          current?.sessionId === sessionId &&
          current.beforeExerciseId === beforeExerciseId
            ? null
            : current,
        );
      },
      onDrop: (event: DragEvent<HTMLDivElement>) => {
        handleDropAt(sessionId, beforeExerciseId, event);
      },
    };
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <header className="flex items-center justify-between gap-4 border-b border-ga-border px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold">
            Semaine {data.weekNumber} - {data.athlete.first_name}
          </h1>
          <p className="mt-1 text-sm text-ga-muted">
            {editorWeek
              ? editorWeek.status === "published" && !dirty
                ? "Publiée"
                : dirty
                  ? "Brouillon · modifications non publiées"
                  : "Brouillon"
              : "Cette semaine n’existe pas encore."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/editeur?athlete=${data.athlete.id}&week=${Math.max(1, data.weekNumber - 1)}`}
            className="rounded-lg bg-ga-elevated px-3 py-1.5 text-sm text-ga-muted hover:text-ga-fg"
          >
            ←
          </Link>
          <Link
            href={`/editeur?athlete=${data.athlete.id}&week=${data.weekNumber + 1}`}
            className="rounded-lg bg-ga-elevated px-3 py-1.5 text-sm text-ga-muted hover:text-ga-fg"
          >
            →
          </Link>
        </div>
      </header>

      {!week ? (
        <div className="flex flex-1 items-center justify-center p-10">
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setError(null);
              startTransition(async () => {
                const result = await ensureDraftWeek(
                  data.athlete.id,
                  data.weekNumber,
                );
                if (result.error) setError(result.error);
                else router.refresh();
              });
            }}
            className="rounded-lg bg-ga-lime px-4 py-2 text-sm font-semibold text-black hover:bg-lime-300 disabled:opacity-60"
          >
            Créer la semaine {data.weekNumber}
          </button>
        </div>
      ) : editorWeek ? (
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <aside
            className="flex w-64 shrink-0 flex-col border-r border-ga-border bg-ga-panel md:w-72 lg:w-80 xl:w-[26rem] 2xl:w-[30rem]"
            onWheel={(event) => scrollContainerOnWheel(libraryScrollRef.current, event)}
          >
            <div className="shrink-0 border-b border-ga-border p-4">
              <p className="text-sm font-medium">Bibliothèque</p>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher un exercice"
                className="mt-3 w-full rounded-lg border border-ga-border bg-ga-elevated px-3 py-2 text-sm outline-none focus:border-ga-lime"
              />
            </div>
            <div
              ref={libraryScrollRef}
              className="ga-scrollbar-hidden min-h-0 flex-1 overflow-y-auto p-3"
            >
              {filteredExercises.length === 0 ? (
                <p className="px-1 text-sm text-ga-muted">
                  {query.trim()
                    ? "Aucun exercice trouvé."
                    : "Aucun exercice dans la bibliothèque."}{" "}
                  Ajoutes-en dans{" "}
                  <Link href="/bibliotheque" className="text-ga-lime hover:underline">
                    Bibliothèque
                  </Link>
                  .
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
                  {filteredExercises.map((exercise) => (
                    <button
                      key={exercise.id}
                      type="button"
                      draggable={!pending}
                      disabled={pending}
                      title="Glisser-déposer sur un jour ou cliquer pour ajouter au jour sélectionné"
                      onDragStart={(event) => {
                        event.dataTransfer.setData(LIBRARY_DRAG, exercise.id);
                        event.dataTransfer.effectAllowed = "copyMove";
                      }}
                      onDragEnd={() => {
                        setDragOverSessionId(null);
                        setDropTarget(null);
                      }}
                      onClick={() => {
                        if (!selectedSessionId) return;
                        run(() =>
                          addExerciseToSession(selectedSessionId, exercise.id),
                        );
                      }}
                      className="cursor-grab rounded-lg border border-ga-border bg-ga-card p-2 text-left hover:border-ga-lime active:cursor-grabbing disabled:opacity-50"
                    >
                      <div className="mb-1.5 overflow-hidden rounded-md bg-ga-elevated">
                        <ExerciseMedia
                          url={exercise.video_url}
                          name={exercise.name}
                          className="h-10 w-full"
                          controls={false}
                          playing={false}
                        />
                      </div>
                      <p className="line-clamp-2 text-xs font-medium leading-snug">
                        {exercise.name}
                      </p>
                      <p className="mt-0.5 text-[10px] text-ga-muted">
                        {MUSCLE_GROUP_LABELS[exercise.muscle_group]}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </aside>

          <div className="ga-scrollbar-hidden min-h-0 min-w-0 flex-1 overflow-x-auto p-5">
            <div className="flex h-full min-h-0 items-stretch gap-4">
              {editorWeek.sessions.map((session) => (
                <section
                  key={session.id}
                  className={`flex h-full max-h-full w-72 shrink-0 flex-col rounded-xl border bg-ga-card transition-shadow ${
                    selectedSessionId === session.id
                      ? "border-ga-lime"
                      : "border-ga-border"
                  } ${
                    dragOverSessionId === session.id
                      ? "ring-2 ring-ga-lime/50"
                      : ""
                  }`}
                  onWheel={(event) =>
                    scrollContainerOnWheel(
                      sessionScrollRefs.current.get(session.id) ?? null,
                      event,
                    )
                  }
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                    setDragOverSessionId(session.id);
                  }}
                  onDragLeave={(event) => {
                    if (event.currentTarget.contains(event.relatedTarget as Node)) {
                      return;
                    }
                    setDragOverSessionId((current) =>
                      current === session.id ? null : current,
                    );
                  }}
                  onDrop={(event) => handleDropAt(session.id, null, event)}
                >
                  <div className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedSessionId(session.id)}
                    className="w-full px-4 pt-4 text-left"
                  >
                    <p className="text-xs text-ga-muted">
                      {weekdayLabel(session.weekday)}
                    </p>
                  </button>
                  <div className="flex items-start gap-2 px-4 pb-3">
                    <input
                      value={session.title}
                      onChange={(event) =>
                        patchSession(session.id, { title: event.target.value })
                      }
                      className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        run(() => deleteSession(session.id))
                      }
                      className="text-ga-muted hover:text-ga-red"
                      title="Supprimer le jour"
                    >
                      <IconTrash className="h-4 w-4" />
                    </button>
                  </div>
                  <select
                    value={session.session_type}
                    onChange={(event) =>
                      patchSession(session.id, {
                        session_type: event.target.value as SessionType,
                      })
                    }
                    className="mx-4 mb-3 w-[calc(100%-2rem)] rounded-md border border-ga-border bg-ga-elevated px-2 py-1 text-xs"
                  >
                    {(Object.keys(SESSION_TYPE_LABELS) as SessionType[]).map(
                      (type) => (
                        <option key={type} value={type}>
                          {SESSION_TYPE_LABELS[type]}
                        </option>
                      ),
                    )}
                  </select>
                  </div>
                  <div
                    ref={(node) => {
                      if (node) sessionScrollRefs.current.set(session.id, node);
                      else sessionScrollRefs.current.delete(session.id);
                    }}
                    className="ga-scrollbar-hidden min-h-0 flex-1 overflow-y-auto px-3 pb-3"
                  >
                    <div className="flex flex-col gap-2">
                    {groupExercises(session.session_exercises).map((group) => {
                      const beforeExerciseId = groupLeadId(group);
                      const zone = bindDropZone(session.id, beforeExerciseId);
                      return (
                      <div key={beforeExerciseId}>
                        <DropZone {...zone} />
                    {group.kind === "superset" ? (
                        <div
                          className="rounded-lg border border-ga-blue/40 bg-ga-blue/5 p-2"
                        >
                          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-ga-blue">
                            Superset
                          </p>
                          <div className="flex flex-col gap-2">
                            {group.items.map((item) => (
                              <ExerciseBlock
                                key={item.id}
                                item={item}
                                expanded={expandedId === item.id}
                                pending={pending}
                                inSuperset
                                canLinkSuperset={false}
                                draggable={!pending && expandedId !== item.id}
                                onDragEnd={() => {
                                  setDragOverSessionId(null);
                                  setDropTarget(null);
                                }}
                                onToggle={() =>
                                  setExpandedId((current) =>
                                    current === item.id ? null : item.id,
                                  )
                                }
                                onSave={(patch) => patchExercise(item.id, patch)}
                                onRemove={() =>
                                  run(() => removeSessionExercise(item.id))
                                }
                                onLinkSuperset={() =>
                                  run(() => linkSupersetWithPrevious(item.id))
                                }
                                onUnlinkSuperset={() =>
                                  run(() => unlinkFromSuperset(item.id))
                                }
                              />
                            ))}
                          </div>
                        </div>
                      ) : (
                        <ExerciseBlock
                          item={group.item}
                          expanded={expandedId === group.item.id}
                          pending={pending}
                          inSuperset={false}
                          canLinkSuperset={group.index > 0}
                          draggable={!pending && expandedId !== group.item.id}
                          onDragEnd={() => {
                            setDragOverSessionId(null);
                            setDropTarget(null);
                          }}
                          onToggle={() =>
                            setExpandedId((current) =>
                              current === group.item.id ? null : group.item.id,
                            )
                          }
                          onSave={(patch) => patchExercise(group.item.id, patch)}
                          onRemove={() =>
                            run(() => removeSessionExercise(group.item.id))
                          }
                          onLinkSuperset={() =>
                            run(() => linkSupersetWithPrevious(group.item.id))
                          }
                          onUnlinkSuperset={() =>
                            run(() => unlinkFromSuperset(group.item.id))
                          }
                        />
                      )}
                      </div>
                    );})}
                    <DropZone {...bindDropZone(session.id, null)} />
                    <button
                      type="button"
                      onClick={() => setSelectedSessionId(session.id)}
                      className="rounded-lg border border-dashed border-ga-border px-3 py-2 text-left text-sm text-ga-muted hover:border-ga-lime hover:text-ga-fg"
                    >
                      + Ajouter un exercice
                    </button>
                    </div>
                  </div>
                </section>
              ))}

              {freeDays.length > 0 ? (
                <div className="flex h-full shrink-0 items-center self-stretch">
                <div className="flex w-64 flex-col gap-2 rounded-xl border border-dashed border-ga-border p-4">
                  <p className="text-sm font-medium">Ajouter un jour</p>
                  {freeDays.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        run(() =>
                          addSession(editorWeek.id, day.value, day.label),
                        )
                      }
                      className="flex items-center gap-2 rounded-lg bg-ga-elevated px-3 py-2 text-sm text-ga-muted hover:text-ga-fg disabled:opacity-50"
                    >
                      <IconPlus className="h-4 w-4" />
                      {day.label}
                    </button>
                  ))}
                </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {editorWeek ? (
        <footer className="shrink-0 border-t border-ga-border bg-ga-panel px-6 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ga-muted">
              {error ? (
                <span className="text-ga-red">{error}</span>
              ) : dirty ? (
                "Modifications non publiées"
              ) : editorWeek.status === "published" ? (
                "Publiée"
              ) : (
                "Brouillon"
              )}
              {pending ? " · Chargement…" : ""}
            </p>
            <button
              type="button"
              disabled={pending}
              onClick={publish}
              className="rounded-lg bg-ga-lime px-4 py-2 text-sm font-semibold text-black hover:bg-lime-300 disabled:opacity-60"
            >
              Publier la semaine
            </button>
          </div>
        </footer>
      ) : null}
    </div>
  );
}

function DropZone({
  active,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  active: boolean;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`my-0.5 h-2 shrink-0 rounded transition-colors ${
        active ? "bg-ga-lime/50" : "bg-transparent"
      }`}
    />
  );
}

function ExerciseBlock({
  item,
  expanded,
  pending,
  inSuperset,
  canLinkSuperset,
  draggable = false,
  onDragEnd,
  onToggle,
  onSave,
  onRemove,
  onLinkSuperset,
  onUnlinkSuperset,
}: {
  item: EditorSessionExercise;
  expanded: boolean;
  pending: boolean;
  inSuperset: boolean;
  canLinkSuperset: boolean;
  draggable?: boolean;
  onDragEnd?: () => void;
  onToggle: () => void;
  onSave: (patch: Parameters<typeof updateSessionExercise>[1]) => void;
  onRemove: () => void;
  onLinkSuperset: () => void;
  onUnlinkSuperset: () => void;
}) {
  const summary = [
    `${item.sets_count} × ${item.target_reps}`,
    item.target_percent != null ? `@ ${item.target_percent}%` : null,
    item.target_weight_kg != null ? `@ ${item.target_weight_kg} kg` : null,
    item.target_rpe != null ? `@ RPE ${item.target_rpe}` : null,
    item.rest_seconds != null ? `repos ${formatRest(item.rest_seconds)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article
      draggable={draggable}
      onDragStart={(event) => {
        event.dataTransfer.setData(SESSION_DRAG, item.id);
        event.dataTransfer.effectAllowed = "move";
      }}
      onDragEnd={() => onDragEnd?.()}
      className={`rounded-lg border bg-ga-elevated ${
        expanded ? "border-ga-lime" : "border-transparent"
      } ${draggable ? "cursor-grab active:cursor-grabbing" : ""}`}
    >
      <div className="flex items-start justify-between gap-2 p-3">
        <button type="button" onClick={onToggle} className="min-w-0 flex-1 text-left">
          <p className="text-sm font-medium">
            {item.exercise?.name ?? "Exercice"}
          </p>
          <p className="mt-1 text-xs text-ga-muted">{summary}</p>
          {item.coach_note ? (
            <p className="mt-1 text-xs text-ga-muted">Note : {item.coach_note}</p>
          ) : null}
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="text-ga-muted hover:text-ga-red"
          title="Retirer"
        >
          <IconTrash className="h-3.5 w-3.5" />
        </button>
      </div>
      {expanded ? (
        <div className="grid grid-cols-2 gap-2 border-t border-ga-border p-3">
          <NumberField
            label="Séries"
            value={item.sets_count}
            disabled={pending}
            onChange={(value) => onSave({ sets_count: value ?? 1 })}
          />
          <NumberField
            label="Reps"
            value={item.target_reps}
            disabled={pending}
            onChange={(value) => onSave({ target_reps: value ?? 1 })}
          />
          <NumberField
            label="Charge (kg)"
            value={item.target_weight_kg}
            disabled={pending}
            onChange={(value) => onSave({ target_weight_kg: value })}
          />
          <NumberField
            label="% 1RM"
            value={item.target_percent}
            disabled={pending}
            onChange={(value) => onSave({ target_percent: value })}
          />
          <NumberField
            label="RPE cible"
            value={item.target_rpe}
            disabled={pending}
            onChange={(value) => onSave({ target_rpe: value })}
          />
          <NumberField
            label="Repos (sec)"
            value={item.rest_seconds}
            disabled={pending}
            onChange={(value) => onSave({ rest_seconds: value })}
          />
          <label className="col-span-2 text-xs text-ga-muted">
            Note
            <input
              value={item.coach_note}
              disabled={pending}
              onChange={(event) => onSave({ coach_note: event.target.value })}
              className="mt-1 w-full rounded-md border border-ga-border bg-ga-card px-2 py-1.5 text-sm text-ga-fg outline-none focus:border-ga-lime"
            />
          </label>
          <div className="col-span-2 flex flex-wrap gap-2">
            {canLinkSuperset ? (
              <button
                type="button"
                disabled={pending}
                onClick={onLinkSuperset}
                className="rounded-md border border-ga-blue/40 px-2 py-1 text-xs text-ga-blue hover:bg-ga-blue/10 disabled:opacity-50"
              >
                Superset avec le précédent
              </button>
            ) : null}
            {inSuperset ? (
              <button
                type="button"
                disabled={pending}
                onClick={onUnlinkSuperset}
                className="rounded-md border border-ga-border px-2 py-1 text-xs text-ga-muted hover:text-ga-fg disabled:opacity-50"
              >
                Retirer du superset
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </article>
  );
}

function NumberField({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: number | null;
  disabled: boolean;
  onChange: (value: number | null) => void;
}) {
  return (
    <label className="text-xs text-ga-muted">
      {label}
      <input
        type="number"
        step="any"
        value={value ?? ""}
        disabled={disabled}
        onChange={(event) => {
          const raw = event.target.value.trim();
          onChange(raw === "" ? null : Number(raw));
        }}
        className="mt-1 w-full rounded-md border border-ga-border bg-ga-card px-2 py-1.5 text-sm text-ga-fg outline-none focus:border-ga-lime"
      />
    </label>
  );
}
