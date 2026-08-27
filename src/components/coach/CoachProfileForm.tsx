"use client";

import { useActionState } from "react";
import {
  updateCoachProfile,
  type ProfileFormState,
} from "@/lib/actions/profile";
import { useLoadingActive } from "@/components/layout/LoadingProvider";
import type { Profile } from "@/lib/supabase/models";

const initial: ProfileFormState = { error: null };

export function CoachProfileForm({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState(updateCoachProfile, initial);
  useLoadingActive(pending);

  return (
    <form action={action} className="grid max-w-xl gap-4 rounded-xl border border-ga-border bg-ga-card p-6">
      <label className="text-sm">
        <span className="mb-1.5 block text-ga-muted">Prénom</span>
        <input
          name="first_name"
          required
          defaultValue={profile.first_name}
          className="w-full rounded-lg border border-ga-border bg-ga-elevated px-3 py-2 outline-none focus:border-ga-lime"
        />
      </label>
      <label className="text-sm">
        <span className="mb-1.5 block text-ga-muted">Nom</span>
        <input
          name="last_name"
          defaultValue={profile.last_name}
          className="w-full rounded-lg border border-ga-border bg-ga-elevated px-3 py-2 outline-none focus:border-ga-lime"
        />
      </label>
      <label className="text-sm">
        <span className="mb-1.5 block text-ga-muted">E-mail</span>
        <input
          value={profile.email ?? ""}
          readOnly
          disabled
          className="w-full cursor-not-allowed rounded-lg border border-ga-border bg-ga-elevated/60 px-3 py-2 text-ga-muted"
        />
      </label>
      {state.error ? <p className="text-sm text-ga-red">{state.error}</p> : null}
      {state.ok ? (
        <p className="text-sm text-ga-lime">Profil enregistré.</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-lg bg-ga-lime px-4 py-2 text-sm font-semibold text-black hover:bg-lime-300 disabled:opacity-60"
      >
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
