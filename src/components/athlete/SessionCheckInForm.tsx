"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  submitSessionCheckIn,
  type SessionCheckInState,
} from "@/lib/actions/session-checkin";
import { FixedBottomBar } from "@/components/layout/FixedBottomBar";
import { useLoadingActive } from "@/components/layout/LoadingProvider";

const initial: SessionCheckInState = { error: null, ok: false };

function Scale({
  name,
  label,
}: {
  name: string;
  label: string;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-medium">{label}</legend>
      <div className="mt-2 flex gap-2">
        {[1, 2, 3, 4, 5].map((value) => (
          <label key={value} className="flex-1">
            <input
              type="radio"
              name={name}
              value={value}
              className="peer sr-only"
              required
            />
            <span className="flex h-10 items-center justify-center rounded-lg bg-ga-elevated text-sm text-ga-muted peer-checked:bg-ga-lime peer-checked:font-semibold peer-checked:text-black">
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
  useLoadingActive(pending);

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok, router]);

  return (
    <>
      <div className="px-5 pb-32 pt-8">
        <p className="text-sm text-ga-muted">{sessionTitle}</p>
        <h1 className="mt-1 text-2xl font-semibold">Comment tu te sens ?</h1>
        <p className="mt-2 text-sm text-ga-muted">
          Avant de commencer, indique ton ressenti. Ton coach est alerté si ça ne
          va pas.
        </p>

        <form id="session-checkin-form" action={action} className="mt-8 flex flex-col gap-6">
          <input type="hidden" name="session_id" value={sessionId} />
          <Scale name="energy" label="Énergie" />
          <Scale name="sleep" label="Sommeil" />
          <Scale name="pain" label="Douleurs" />
          <Scale name="motivation" label="Motivation" />
          <label className="text-sm">
            <span>Un mot pour {coachFirstName}</span>
            <textarea
              name="comment"
              rows={3}
              className="mt-2 w-full rounded-xl border border-ga-border bg-ga-elevated px-3 py-2 outline-none focus:border-ga-lime"
            />
          </label>
          {state.error ? <p className="text-sm text-ga-red">{state.error}</p> : null}
        </form>
      </div>

      <FixedBottomBar offsetClass="bottom-14" variant="athlete">
        <button
          type="submit"
          form="session-checkin-form"
          disabled={pending}
          className="w-full rounded-xl bg-ga-lime py-3 text-sm font-semibold text-black hover:bg-lime-300 disabled:opacity-60"
        >
          {pending ? "Envoi…" : "Commencer la séance"}
        </button>
      </FixedBottomBar>
    </>
  );
}
