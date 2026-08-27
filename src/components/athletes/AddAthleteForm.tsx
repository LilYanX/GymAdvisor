"use client";

import { useActionState } from "react";
import {
  createAthlete,
  type AthleteFormState,
} from "@/lib/actions/athletes";

const initial: AthleteFormState = { error: null };

export function AddAthleteForm({ redirectTo }: { redirectTo?: string }) {
  const [state, action, pending] = useActionState(createAthlete, initial);

  return (
    <form
      action={action}
      className="grid w-full gap-3 rounded-xl border border-ga-border bg-ga-card p-5 md:grid-cols-2"
    >
      {redirectTo ? (
        <input type="hidden" name="redirect_to" value={redirectTo} />
      ) : null}
      <h2 className="text-base font-semibold md:col-span-2">Ajouter un sportif</h2>
      <p className="text-sm text-ga-muted md:col-span-2">
        Un e-mail d’invitation sera envoyé pour activer le compte.
      </p>
      <label className="text-sm">
        <span className="mb-1.5 block text-ga-muted">Prénom</span>
        <input
          name="first_name"
          required
          className="w-full rounded-lg border border-ga-border bg-ga-elevated px-3 py-2 outline-none focus:border-ga-lime"
        />
      </label>
      <label className="text-sm">
        <span className="mb-1.5 block text-ga-muted">Nom</span>
        <input
          name="last_name"
          className="w-full rounded-lg border border-ga-border bg-ga-elevated px-3 py-2 outline-none focus:border-ga-lime"
        />
      </label>
      <label className="text-sm md:col-span-2">
        <span className="mb-1.5 block text-ga-muted">E-mail</span>
        <input
          name="email"
          type="email"
          required
          className="w-full rounded-lg border border-ga-border bg-ga-elevated px-3 py-2 outline-none focus:border-ga-lime"
        />
      </label>
      <label className="text-sm md:col-span-2">
        <span className="mb-1.5 block text-ga-muted">Objectif</span>
        <input
          name="goal"
          placeholder="Force - compétition octobre"
          className="w-full rounded-lg border border-ga-border bg-ga-elevated px-3 py-2 outline-none focus:border-ga-lime"
        />
      </label>
      <label className="text-sm md:col-span-2">
        <span className="mb-1.5 block text-ga-muted">
          Durée du suivi (nombre de semaines)
        </span>
        <input
          name="total_weeks"
          type="number"
          min={1}
          max={104}
          defaultValue={12}
          required
          className="w-full rounded-lg border border-ga-border bg-ga-elevated px-3 py-2 outline-none focus:border-ga-lime"
        />
      </label>
      {state.error ? (
        <p className="text-sm text-ga-red md:col-span-2">{state.error}</p>
      ) : null}
      <div className="md:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-ga-lime px-4 py-2 text-sm font-semibold text-black hover:bg-lime-300 disabled:opacity-60"
        >
          {pending ? "Ajout…" : "Ajouter"}
        </button>
      </div>
    </form>
  );
}
