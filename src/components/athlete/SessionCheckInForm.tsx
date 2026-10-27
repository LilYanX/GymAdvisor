"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  submitSessionCheckIn,
  type SessionCheckInState,
} from "@/lib/actions/session-checkin";
import { MCLEAN_ITEMS } from "@/lib/mclean";
import { toDatetimeLocalValue } from "@/lib/session-timing";
import { FixedBottomBar } from "@/components/layout/FixedBottomBar";
import { useLoadingActive } from "@/components/layout/LoadingProvider";

const initial: SessionCheckInState = { error: null, ok: false };

function McLeanScale({
  name,
  label,
  hints,
}: {
  name: string;
  label: string;
  hints: readonly string[];
}) {
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <fieldset>
      <legend className="text-base font-medium">{label}</legend>
      <p className="mt-1.5 min-h-[1.5rem] text-sm text-ga-muted">
        {selected != null ? hints[selected - 1] : "1 = pire · 5 = meilleur"}
      </p>
      <div className="mt-3 flex gap-2.5">
        {[1, 2, 3, 4, 5].map((value) => (
          <label key={value} className="flex-1">
            <input
              type="radio"
              name={name}
              value={value}
              className="peer sr-only"
              required
              onChange={() => setSelected(value)}
            />
            <span className="flex h-12 items-center justify-center rounded-xl bg-ga-elevated text-base text-ga-muted peer-checked:bg-ga-lime peer-checked:font-semibold peer-checked:text-black">
              {value}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function SessionCheckInForm({
  sessionId,
  sessionTitle,
  coachFirstName,
}: {
  sessionId: string;
  sessionTitle: string;
  coachFirstName: string;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(submitSessionCheckIn, initial);
  const [startedAt, setStartedAt] = useState(toDatetimeLocalValue);
  useLoadingActive(pending);

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok, router]);

  return (
    <>
      <div className="px-5 pb-36 pt-8">
        <p className="text-base text-ga-muted">{sessionTitle}</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          Comment tu te sens ?
        </h1>
        <p className="mt-3 text-base text-ga-muted">
          Questionnaire McLean — avant l’entraînement (1 = pire état, 5 =
          meilleur).
        </p>

        <form
          id="session-checkin-form"
          action={action}
          className="mt-8 flex flex-col gap-7"
        >
          <input type="hidden" name="session_id" value={sessionId} />
          <label className="text-base">
            <span className="font-medium">Heure de début</span>
            <input
              type="datetime-local"
              name="started_at"
              required
              value={startedAt}
              onChange={(event) => setStartedAt(event.target.value)}
              className="mt-2 w-full rounded-xl border border-ga-border bg-ga-elevated px-4 py-3.5 text-base outline-none focus:border-ga-lime"
            />
          </label>
          {MCLEAN_ITEMS.map((item) => (
            <McLeanScale
              key={item.key}
              name={item.key}
              label={item.label}
              hints={item.hints}
            />
          ))}
          <label className="text-base">
            <span>Un mot pour {coachFirstName}</span>
            <textarea
              name="comment"
              rows={3}
              className="mt-2 w-full rounded-xl border border-ga-border bg-ga-elevated px-4 py-3 text-base outline-none focus:border-ga-lime"
            />
          </label>
          {state.error ? (
            <p className="text-base text-ga-red">{state.error}</p>
          ) : null}
        </form>
      </div>

      <FixedBottomBar offsetClass="bottom-20" variant="athlete">
        <button
          type="submit"
          form="session-checkin-form"
          disabled={pending}
          className="w-full rounded-xl bg-ga-lime py-4 text-base font-semibold text-black hover:bg-lime-300 disabled:opacity-60"
        >
          {pending ? "Envoi…" : "Commencer la séance"}
        </button>
      </FixedBottomBar>
    </>
  );
}
