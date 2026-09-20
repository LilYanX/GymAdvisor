"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setSessionStartedAt } from "@/lib/actions/session";
import { toDatetimeLocalValue } from "@/lib/session-timing";
import { FixedBottomBar } from "@/components/layout/FixedBottomBar";
import { useLoadingActive } from "@/components/layout/LoadingProvider";

export function SessionStartTimeForm({
  sessionId,
  sessionTitle,
}: {
  sessionId: string;
  sessionTitle: string;
}) {
  const router = useRouter();
  const [startedAt, setStartedAt] = useState(toDatetimeLocalValue);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  useLoadingActive(pending);

  return (
    <>
      <div className="px-5 pb-32 pt-8">
        <p className="text-sm text-ga-muted">{sessionTitle}</p>
        <h1 className="mt-1 text-2xl font-semibold">Heure de début</h1>
        <p className="mt-2 text-sm text-ga-muted">
          Indique quand tu commences vraiment la séance.
        </p>
        <label className="mt-8 block text-sm">
          <span className="font-medium">Début</span>
          <input
            type="datetime-local"
            value={startedAt}
            onChange={(event) => setStartedAt(event.target.value)}
            className="mt-2 w-full rounded-xl border border-ga-border bg-ga-elevated px-3 py-2.5 text-sm outline-none focus:border-ga-lime"
          />
        </label>
        {error ? <p className="mt-4 text-sm text-ga-red">{error}</p> : null}
      </div>
      <FixedBottomBar offsetClass="bottom-14" variant="athlete">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const result = await setSessionStartedAt(sessionId, startedAt);
              if (result.error) {
                setError(result.error);
                return;
              }
              router.refresh();
            });
          }}
          className="w-full rounded-xl bg-ga-lime py-3 text-sm font-semibold text-black hover:bg-lime-300 disabled:opacity-60"
        >
          {pending ? "Enregistrement…" : "Continuer"}
        </button>
      </FixedBottomBar>
    </>
  );
}
