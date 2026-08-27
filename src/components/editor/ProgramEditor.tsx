"use client";

import { useEffect, useMemo, useRef, useState, useTransition, type DragEvent, type WheelEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { EditorData, EditorSessionExercise } from "@/lib/editor-types";
import {
  addExerciseToSession,
  addSession,
  deleteSession,
  ensureDraftWeek,
  linkSupersetWithPrevious,
  moveSessionExercise,
  publishWeek,
  removeSessionExercise,
  unlinkFromSuperset,
  updateSession,
  updateSessionExercise,
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

export function ProgramEditor({ data }: { data: EditorData }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    data.week?.sessions[0]?.id ?? null,
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [dragOverSessionId, setDragOverSessionId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const libraryScrollRef = useRef<HTMLDivElement>(null);
  const sessionScrollRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    const ids = data.week?.sessions.map((session) => session.id) ?? [];
    if (selectedSessionId && ids.includes(selectedSessionId)) return;
    setSelectedSessionId(ids[0] ?? null);
  }, [data.week, selectedSessionId]);

  const week = data.week;
  const usedDays = new Set(week?.sessions.map((session) => session.weekday) ?? []);
  const freeDays = WEEKDAYS.filter((day) => !usedDays.has(day.value));

  const filteredExercises = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return data.exercises;
    return data.exercises.filter((exercise) =>
      exercise.name.toLowerCase().includes(needle),
    );
  }, [data.exercises, query]);

  function run(action: () => Promise<{ error: string | null }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
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
            {week
              ? week.status === "published"
                ? "Publiée"
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
            onClick={() =>
              run(async () => ensureDraftWeek(data.athlete.id, data.weekNumber))
            }
            className="rounded-lg bg-ga-lime px-4 py-2 text-sm font-semibold text-black hover:bg-lime-300 disabled:opacity-60"
          >
            Créer la semaine {data.weekNumber}
          </button>
        </div>
      ) : (
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
              {week.sessions.map((session) => (
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
                      defaultValue={session.title}
                      key={session.updated_at}
                      onBlur={(event) => {
                        const title = event.target.value.trim();
                        if (title && title !== session.title) {
                          run(() => updateSession(session.id, { title }));
                        }
                      }}
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
                    defaultValue={session.session_type}
                    key={`${session.id}-${session.session_type}`}
                    onChange={(event) =>
                      run(() =>
                        updateSession(session.id, {
                          session_type: event.target.value as SessionType,
                        }),
                      )
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
                                onSave={(patch) =>
                                  run(() => updateSessionExercise(item.id, patch))
                                }
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
                          onSave={(patch) =>
                            run(() => updateSessionExercise(group.item.id, patch))
                          }
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
                          addSession(week.id, day.value, day.label),
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
      )}

      {week ? (
        <footer className="shrink-0 border-t border-ga-border bg-ga-panel px-6 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ga-muted">
              {error ? (
                <span className="text-ga-red">{error}</span>
              ) : week.status === "draft" ? (
                `Brouillon - dernière sauvegarde ${new Date(week.updated_at).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}`
              ) : (
                "Publiée"
              )}
              {pending ? " · Enregistrement…" : ""}
            </p>
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => publishWeek(week.id))}
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
            defaultValue={item.sets_count}
            disabled={pending}
            onCommit={(value) => onSave({ sets_count: value ?? 1 })}
          />
          <NumberField
            label="Reps"
            defaultValue={item.target_reps}
            disabled={pending}
            onCommit={(value) => onSave({ target_reps: value ?? 1 })}
          />
          <NumberField
            label="Charge (kg)"
            defaultValue={item.target_weight_kg}
            disabled={pending}
            onCommit={(value) => onSave({ target_weight_kg: value })}
          />
          <NumberField
            label="% 1RM"
            defaultValue={item.target_percent}
            disabled={pending}
            onCommit={(value) => onSave({ target_percent: value })}
          />
          <NumberField
            label="RPE cible"
            defaultValue={item.target_rpe}
            disabled={pending}
            onCommit={(value) => onSave({ target_rpe: value })}
          />
          <NumberField
            label="Repos (sec)"
            defaultValue={item.rest_seconds}
            disabled={pending}
            onCommit={(value) => onSave({ rest_seconds: value })}
          />
          <label className="col-span-2 text-xs text-ga-muted">
            Note
            <input
              defaultValue={item.coach_note}
              disabled={pending}
              onBlur={(event) => {
                const coach_note = event.target.value;
                if (coach_note !== item.coach_note) onSave({ coach_note });
              }}
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
  defaultValue,
  disabled,
  onCommit,
}: {
  label: string;
  defaultValue: number | null;
  disabled: boolean;
  onCommit: (value: number | null) => void;
}) {
  return (
    <label className="text-xs text-ga-muted">
      {label}
      <input
        type="number"
        step="any"
        defaultValue={defaultValue ?? ""}
        disabled={disabled}
        onBlur={(event) => {
          const raw = event.target.value.trim();
          const next = raw === "" ? null : Number(raw);
          const current = defaultValue;
          if (next !== current) onCommit(next);
        }}
        className="mt-1 w-full rounded-md border border-ga-border bg-ga-card px-2 py-1.5 text-sm text-ga-fg outline-none focus:border-ga-lime"
      />
    </label>
  );
}
