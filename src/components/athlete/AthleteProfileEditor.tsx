"use client";

import { useActionState } from "react";
import {
  addBodyWeightLog,
  updateAthleteSelfProfile,
  type AthleteProfileFormState,
} from "@/lib/actions/athlete-profile";
import type { Athlete, AthleteBodyLog } from "@/lib/supabase/models";
import { todayISO } from "@/lib/dates";
import { WeightChart } from "@/components/athlete/WeightChart";
import { useLoadingActive } from "@/components/layout/LoadingProvider";

const profileInitial: AthleteProfileFormState = { error: null };
const weightInitial: AthleteProfileFormState = { error: null };

export function AthleteProfileEditor({
  athlete,
  bodyLogs,
}: {
  athlete: Athlete;
  bodyLogs: AthleteBodyLog[];
}) {
  const [profileState, profileAction, profilePending] = useActionState(
    updateAthleteSelfProfile,
    profileInitial,
  );
  const [weightState, weightAction, weightPending] = useActionState(
    addBodyWeightLog,
    weightInitial,
  );
  useLoadingActive(profilePending || weightPending);

  const latestWeight =
    bodyLogs.length > 0 ? bodyLogs[bodyLogs.length - 1].weight_kg : null;

  return (
    <div className="flex flex-col gap-4">
      <section className="overflow-hidden rounded-2xl border border-ga-border bg-ga-card">
        <div className="border-b border-ga-border px-4 py-3">
          <h2 className="text-sm font-semibold">Mes informations</h2>
        </div>
        <form action={profileAction} className="grid gap-3 p-4 sm:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block text-ga-muted">Prénom</span>
            <input
              name="first_name"
              required
              defaultValue={athlete.first_name}
              className="w-full rounded-lg border border-ga-border bg-ga-elevated px-3 py-2 outline-none focus:border-ga-lime"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-ga-muted">Nom</span>
            <input
              name="last_name"
              defaultValue={athlete.last_name}
              className="w-full rounded-lg border border-ga-border bg-ga-elevated px-3 py-2 outline-none focus:border-ga-lime"
            />
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="mb-1 block text-ga-muted">Objectif</span>
            <input
              name="goal"
              defaultValue={athlete.goal}
              className="w-full rounded-lg border border-ga-border bg-ga-elevated px-3 py-2 outline-none focus:border-ga-lime"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-ga-muted">Taille (cm)</span>
            <input
              name="height_cm"
              type="number"
              min={100}
              max={250}
              step={0.5}
              defaultValue={athlete.height_cm ?? ""}
              placeholder="175"
              className="w-full rounded-lg border border-ga-border bg-ga-elevated px-3 py-2 outline-none focus:border-ga-lime"
            />
          </label>
          <div className="text-sm">
            <span className="mb-1 block text-ga-muted">Poids actuel</span>
            <p className="rounded-lg border border-ga-border/60 bg-ga-elevated/50 px-3 py-2 text-ga-fg">
              {latestWeight != null
                ? `${latestWeight.toLocaleString("fr-FR")} kg`
                : "—"}
            </p>
          </div>
          {profileState.error ? (
            <p className="text-sm text-ga-red sm:col-span-2">{profileState.error}</p>
          ) : profileState.ok ? (
            <p className="text-sm text-ga-lime sm:col-span-2">Enregistré.</p>
          ) : null}
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={profilePending}
              className="rounded-lg bg-ga-lime px-4 py-2 text-sm font-semibold text-black hover:bg-lime-300 disabled:opacity-60"
            >
              {profilePending ? "Enregistrement…" : "Enregistrer le profil"}
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-ga-border bg-ga-card">
        <div className="border-b border-ga-border px-4 py-3">
          <h2 className="text-sm font-semibold">Suivi du poids</h2>
        </div>
        <div className="space-y-4 p-4">
          <form action={weightAction} className="grid grid-cols-1 gap-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="min-w-0 text-sm">
                <span className="mb-1 block text-ga-muted">Poids (kg)</span>
                <input
                  name="weight_kg"
                  type="number"
                  required
                  min={20}
                  max={400}
                  step={0.1}
                  inputMode="decimal"
                  defaultValue={latestWeight ?? ""}
                  className="w-full rounded-lg border border-ga-border bg-ga-elevated px-3 py-2.5 text-base outline-none focus:border-ga-lime"
                />
              </label>
              <label className="min-w-0 text-sm">
                <span className="mb-1 block text-ga-muted">Date</span>
                <input
                  name="recorded_on"
                  type="date"
                  required
                  defaultValue={todayISO()}
                  className="w-full min-w-0 rounded-lg border border-ga-border bg-ga-elevated px-2 py-2.5 text-base outline-none focus:border-ga-lime"
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={weightPending}
              className="w-full rounded-xl border border-ga-border bg-ga-elevated py-3 text-sm font-medium hover:border-ga-lime/40 disabled:opacity-60"
            >
              {weightPending ? "Ajout…" : "Ajouter la pesée"}
            </button>
            {weightState.error ? (
              <p className="text-sm text-ga-red">{weightState.error}</p>
            ) : weightState.ok ? (
              <p className="text-sm text-ga-lime">Pesée enregistrée.</p>
            ) : null}
          </form>
          <WeightChart logs={bodyLogs} compact />
        </div>
      </section>
    </div>
  );
}
