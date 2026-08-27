"use client";

import { useActionState } from "react";
import { submitCheckIn, type CheckInState } from "@/lib/actions/checkin";
import { signOut } from "@/lib/actions/auth";
import type { CheckIn } from "@/lib/supabase/models";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { FixedBottomBar } from "@/components/layout/FixedBottomBar";

const initial: CheckInState = { error: null, ok: false };

function Scale({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue?: number;
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
              defaultChecked={defaultValue === value}
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

export function CheckInForm({
  coachFirstName,
  existing,
}: {
  coachFirstName: string;
  existing: CheckIn | null;
}) {
  const [state, action, pending] = useActionState(submitCheckIn, initial);

  return (
    <>
      <div className="px-5 pb-32 pt-8">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-ga-muted">Check-in hebdomadaire</p>
            <h1 className="mt-1 text-2xl font-semibold">
              Comment tu te sens cette semaine ?
            </h1>
          </div>
          <ThemeToggle />
        </div>

        <form id="checkin-form" action={action} className="mt-8 flex flex-col gap-6">
          <Scale name="energy" label="Énergie" defaultValue={existing?.energy} />
          <Scale name="sleep" label="Sommeil" defaultValue={existing?.sleep} />
          <Scale name="pain" label="Douleurs" defaultValue={existing?.pain} />
          <label className="text-sm">
            <span className="text-ga-muted">
              Un mot pour {coachFirstName} (optionnel)
            </span>
            <textarea
              name="comment"
              defaultValue={existing?.comment ?? ""}
              rows={3}
              placeholder="Ce que tu veux ajouter sur ta semaine..."
              className="mt-2 w-full rounded-xl border border-ga-border bg-ga-elevated px-3 py-2 outline-none focus:border-ga-lime"
            />
          </label>
          {state.error ? <p className="text-sm text-ga-red">{state.error}</p> : null}
          {state.ok ? (
            <p className="text-sm text-ga-lime">C’est envoyé. Merci.</p>
          ) : null}
        </form>

        <form action={signOut} className="mt-10">
          <button type="submit" className="text-sm text-ga-muted hover:text-ga-fg">
            Se déconnecter
          </button>
        </form>
      </div>

      <FixedBottomBar offsetClass="bottom-14" variant="athlete">
        <button
          type="submit"
          form="checkin-form"
          disabled={pending}
          className="w-full rounded-xl bg-ga-lime py-3 text-sm font-semibold text-black hover:bg-lime-300 disabled:opacity-60"
        >
          {pending ? "Envoi…" : `Envoyer à ${coachFirstName}`}
        </button>
      </FixedBottomBar>
    </>
  );
}
