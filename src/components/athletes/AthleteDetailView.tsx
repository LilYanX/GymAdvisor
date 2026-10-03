"use client";

import { useActionState, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  archiveAthlete,
  deleteAthlete,
  updateAthlete,
  type AthleteFormState,
} from "@/lib/actions/athletes";
import { setPaymentStatus } from "@/lib/actions/payments";
import type { AthleteFollowUp } from "@/lib/athlete-followup-types";
import type { AthleteDashboardBundle } from "@/lib/dashboard-metrics";
import type { AthleteBodyLog } from "@/lib/supabase/models";
import { formatFeedbackDate } from "@/lib/dates";
import { PAYMENT_DISPLAY_LABELS } from "@/lib/payments";
import { AthleteMetricsDashboard } from "@/components/dashboard/AthleteMetricsDashboard";
import { WeightChart } from "@/components/athlete/WeightChart";

function monthLabel(): string {
  return new Intl.DateTimeFormat("fr-FR", { month: "long" }).format(new Date());
}

const initial: AthleteFormState = { error: null };

export function AthleteDetailView({
  data,
  dashboard,
  bodyLogs = [],
}: {
  data: AthleteFollowUp;
  dashboard: AthleteDashboardBundle;
  bodyLogs?: AthleteBodyLog[];
}) {
  const router = useRouter();
  const { athlete } = data;
  const [state, action, pending] = useActionState(updateAthlete, initial);
  const [payPending, startPay] = useTransition();
  const [payError, setPayError] = useState<string | null>(null);

  return (
    <div className="flex flex-1 flex-col gap-4 p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <Link
            href="/sportifs"
            className="text-xs text-ga-muted hover:text-ga-fg"
          >
            ← Sportifs
          </Link>
          <h1 className="mt-1 truncate text-xl font-semibold md:text-2xl">
            {athlete.first_name} {athlete.last_name}
          </h1>
        </div>
        <Link
          href={`/editeur?athlete=${athlete.id}`}
          className="shrink-0 rounded-lg bg-ga-lime px-3 py-2 text-sm font-semibold text-black hover:bg-lime-300"
        >
          Éditeur
        </Link>
      </div>

      <AthleteMetricsDashboard
        bundle={dashboard}
        showExport
        exportHrefBase={`/sportifs/${athlete.id}/dashboard.xlsx`}
        variant="coach"
      />

      <section className="rounded-xl border border-ga-border bg-ga-card p-4 md:p-5">
        <h2 className="text-lg font-semibold">Courbe de poids</h2>
        <div className="mt-4">
          <WeightChart logs={bodyLogs} />
        </div>
      </section>

      <div className="grid items-start gap-4 xl:grid-cols-12">
        <form
          action={action}
          className="grid grid-cols-2 gap-2.5 rounded-xl border border-ga-border bg-ga-card p-4 xl:col-span-5"
        >
          <h2 className="col-span-2 text-sm font-semibold">Informations</h2>
          <input type="hidden" name="athlete_id" value={athlete.id} />
          <label className="text-xs text-ga-muted">
            Prénom
            <input
              name="first_name"
              required
              defaultValue={athlete.first_name}
              className="mt-1 w-full rounded-lg border border-ga-border bg-ga-elevated px-2.5 py-1.5 text-sm outline-none focus:border-ga-lime"
            />
          </label>
          <label className="text-xs text-ga-muted">
            Nom
            <input
              name="last_name"
              defaultValue={athlete.last_name}
              className="mt-1 w-full rounded-lg border border-ga-border bg-ga-elevated px-2.5 py-1.5 text-sm outline-none focus:border-ga-lime"
            />
          </label>
          <label className="col-span-2 text-xs text-ga-muted">
            E-mail
            <input
              name="email"
              type="email"
              required
              defaultValue={athlete.email}
              className="mt-1 w-full rounded-lg border border-ga-border bg-ga-elevated px-2.5 py-1.5 text-sm outline-none focus:border-ga-lime"
            />
          </label>
          <label className="col-span-2 text-xs text-ga-muted">
            Objectif
            <input
              name="goal"
              defaultValue={athlete.goal}
              className="mt-1 w-full rounded-lg border border-ga-border bg-ga-elevated px-2.5 py-1.5 text-sm outline-none focus:border-ga-lime"
            />
          </label>
          <div className="text-xs text-ga-muted">
            Taille
            <p className="mt-1 rounded-lg border border-ga-border/60 bg-ga-elevated/50 px-2.5 py-1.5 text-sm text-ga-fg">
              {athlete.height_cm != null
                ? `${athlete.height_cm.toLocaleString("fr-FR")} cm`
                : "—"}
            </p>
          </div>
          <div className="text-xs text-ga-muted">
            Poids (dernier)
            <p className="mt-1 rounded-lg border border-ga-border/60 bg-ga-elevated/50 px-2.5 py-1.5 text-sm text-ga-fg">
              {bodyLogs.length > 0
                ? `${bodyLogs[bodyLogs.length - 1].weight_kg.toLocaleString("fr-FR")} kg`
                : "—"}
            </p>
          </div>
          <label className="text-xs text-ga-muted">
            Semaine
            <input
              name="current_week"
              type="number"
              min={1}
              defaultValue={athlete.current_week}
              className="mt-1 w-full rounded-lg border border-ga-border bg-ga-elevated px-2.5 py-1.5 text-sm outline-none focus:border-ga-lime"
            />
          </label>
          <label className="text-xs text-ga-muted">
            Total
            <input
              name="total_weeks"
              type="number"
              min={1}
              defaultValue={athlete.total_weeks}
              className="mt-1 w-full rounded-lg border border-ga-border bg-ga-elevated px-2.5 py-1.5 text-sm outline-none focus:border-ga-lime"
            />
          </label>
          <label className="col-span-2 text-xs text-ga-muted">
            Notes
            <textarea
              name="notes"
              rows={2}
              defaultValue={athlete.notes}
              className="mt-1 w-full rounded-lg border border-ga-border bg-ga-elevated px-2.5 py-1.5 text-sm outline-none focus:border-ga-lime"
            />
          </label>
          {state.error ? (
            <p className="col-span-2 text-sm text-ga-red">{state.error}</p>
          ) : null}
          <div className="col-span-2 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-ga-lime px-3 py-1.5 text-sm font-semibold text-black hover:bg-lime-300 disabled:opacity-60"
            >
              {pending ? "…" : "Enregistrer"}
            </button>
            <button
              type="button"
              disabled={payPending}
              onClick={() => {
                startPay(async () => {
                  const result = await archiveAthlete(athlete.id);
                  if (result.error) {
                    setPayError(result.error);
                    return;
                  }
                  router.push("/sportifs");
                  router.refresh();
                });
              }}
              className="rounded-lg border border-ga-border px-3 py-1.5 text-sm text-ga-muted hover:text-ga-fg"
            >
              Archiver
            </button>
            <button
              type="button"
              disabled={payPending}
              onClick={() => {
                const confirmed = window.confirm(
                  `Supprimer définitivement ${athlete.first_name} ${athlete.last_name} ?`,
                );
                if (!confirmed) return;
                startPay(async () => {
                  const result = await deleteAthlete(athlete.id);
                  if (result.error) {
                    setPayError(result.error);
                    return;
                  }
                  router.push("/sportifs");
                  router.refresh();
                });
              }}
              className="rounded-lg border border-ga-red/40 px-3 py-1.5 text-sm text-ga-red hover:bg-ga-red/10"
            >
              Supprimer
            </button>
          </div>
        </form>

        <div className="flex flex-col gap-4 xl:col-span-3">
          <section className="rounded-xl border border-ga-border bg-ga-card p-4">
            <h2 className="text-sm font-semibold">Paiement · {monthLabel()}</h2>
            <p className="mt-2 text-sm">
              <span
                className={`font-semibold ${
                  data.paymentDisplayStatus === "paid"
                    ? "text-ga-lime"
                    : data.paymentDisplayStatus === "late"
                      ? "text-ga-amber"
                      : data.paymentDisplayStatus === "blocked"
                        ? "text-ga-red"
                        : "text-ga-muted"
                }`}
              >
                {PAYMENT_DISPLAY_LABELS[data.paymentDisplayStatus]}
              </span>
              {data.paymentBlocked ? (
                <span className="ml-1 text-xs text-ga-red">(bloqué)</span>
              ) : null}
            </p>
            {data.overdueMonthLabels.length > 0 ? (
              <p className="mt-1 text-xs text-ga-red">
                Impayés : {data.overdueMonthLabels.join(", ")}
              </p>
            ) : null}
            {payError ? (
              <p className="mt-1 text-xs text-ga-red">{payError}</p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={payPending}
                onClick={() => {
                  setPayError(null);
                  startPay(async () => {
                    const result = await setPaymentStatus(athlete.id, "paid");
                    if (result.error) setPayError(result.error);
                    else router.refresh();
                  });
                }}
                className="rounded-lg bg-ga-lime px-2.5 py-1.5 text-xs font-semibold text-black hover:bg-lime-300 disabled:opacity-60"
              >
                {data.paymentBlocked ? "Réactiver" : "Payé"}
              </button>
              <button
                type="button"
                disabled={payPending}
                onClick={() => {
                  setPayError(null);
                  startPay(async () => {
                    const result = await setPaymentStatus(athlete.id, "pending");
                    if (result.error) setPayError(result.error);
                    else router.refresh();
                  });
                }}
                className="rounded-lg border border-ga-border px-2.5 py-1.5 text-xs text-ga-muted hover:text-ga-fg disabled:opacity-60"
              >
                En attente
              </button>
            </div>
          </section>

          <section className="rounded-xl border border-ga-border bg-ga-card p-4">
            <h2 className="text-sm font-semibold">Charge cumulée</h2>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              <div className="rounded-lg bg-ga-elevated p-2.5">
                <p className="text-[10px] uppercase tracking-wide text-ga-muted">
                  Tonnage
                </p>
                <p className="mt-0.5 text-lg font-semibold">
                  {data.totals.tonnageKg.toLocaleString("fr-FR")}
                  <span className="text-xs font-normal text-ga-muted"> kg</span>
                </p>
              </div>
              <div className="rounded-lg bg-ga-elevated p-2.5">
                <p className="text-[10px] uppercase tracking-wide text-ga-muted">
                  UA moy.
                </p>
                <p className="mt-0.5 text-lg font-semibold">
                  {data.totals.loadUnits.toLocaleString("fr-FR")}
                </p>
              </div>
              <div className="rounded-lg bg-ga-elevated p-2.5">
                <p className="text-[10px] uppercase tracking-wide text-ga-muted">
                  UA final
                </p>
                <p className="mt-0.5 text-lg font-semibold">
                  {data.totals.loadUnitsFinal.toLocaleString("fr-FR")}
                </p>
              </div>
            </div>
          </section>
        </div>

        <section className="rounded-xl border border-ga-border bg-ga-card p-4 xl:col-span-4">
          <h2 className="text-sm font-semibold">Retours récents</h2>
          {data.feedbacks.length === 0 ? (
            <p className="mt-2 text-sm text-ga-muted">Aucun feedback.</p>
          ) : (
            <ul className="mt-2 max-h-64 space-y-2 overflow-y-auto">
              {data.feedbacks.slice(0, 8).map((item, index) => (
                <li
                  key={`${item.sessionId}-${item.exerciseName}-${index}`}
                  className="rounded-lg border border-ga-border/70 bg-ga-elevated/50 px-3 py-2"
                >
                  <p className="text-[11px] text-ga-muted">
                    {formatFeedbackDate(item.sessionDate)} · {item.sessionTitle}
                  </p>
                  <p className="text-sm font-medium">{item.exerciseName}</p>
                  <p className="text-xs text-ga-muted">
                    {item.rpe != null ? `RPE ${item.rpe}` : null}
                    {item.rpe != null && item.comment ? " · " : null}
                    {item.comment}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="overflow-hidden rounded-xl border border-ga-border bg-ga-card">
          <div className="border-b border-ga-border px-4 py-2.5">
            <h2 className="text-sm font-semibold">Charge par séance</h2>
          </div>
          {data.sessions.length === 0 ? (
            <p className="px-4 py-3 text-sm text-ga-muted">Aucune séance loggée.</p>
          ) : (
            <div className="max-h-56 overflow-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-ga-card text-[10px] uppercase tracking-wide text-ga-muted">
                  <tr className="border-b border-ga-border">
                    <th className="px-3 py-2 font-medium">Séance</th>
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">kg</th>
                    <th className="px-3 py-2 font-medium">UA moy.</th>
                    <th className="px-3 py-2 font-medium">UA final</th>
                  </tr>
                </thead>
                <tbody>
                  {data.sessions.map((session) => (
                    <tr
                      key={session.sessionId}
                      className="border-t border-ga-border/70"
                    >
                      <td className="px-3 py-2 font-medium">{session.title}</td>
                      <td className="px-3 py-2 text-ga-muted">
                        {formatFeedbackDate(session.date)}
                      </td>
                      <td className="px-3 py-2">
                        {session.tonnageKg.toLocaleString("fr-FR")}
                      </td>
                      <td className="px-3 py-2">{session.loadUnits}</td>
                      <td className="px-3 py-2">{session.loadUnitsFinal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-xl border border-ga-border bg-ga-card">
          <div className="border-b border-ga-border px-4 py-2.5">
            <h2 className="text-sm font-semibold">Activités libres</h2>
          </div>
          {data.activities.length === 0 ? (
            <p className="px-4 py-3 text-sm text-ga-muted">Aucune activité.</p>
          ) : (
            <div className="max-h-56 overflow-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-ga-card text-[10px] uppercase tracking-wide text-ga-muted">
                  <tr className="border-b border-ga-border">
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Activité</th>
                    <th className="px-3 py-2 font-medium">Min</th>
                    <th className="px-3 py-2 font-medium">RPE</th>
                  </tr>
                </thead>
                <tbody>
                  {data.activities.map((activity) => (
                    <tr key={activity.id} className="border-t border-ga-border/70">
                      <td className="px-3 py-2">
                        {formatFeedbackDate(activity.performed_on)}
                      </td>
                      <td className="px-3 py-2">{activity.name}</td>
                      <td className="px-3 py-2">{activity.duration_minutes}</td>
                      <td className="px-3 py-2">
                        {activity.rpe != null ? activity.rpe : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <section className="rounded-xl border border-ga-border bg-ga-card p-4">
        <h2 className="text-sm font-semibold">Ressentis récents</h2>
        {data.sessionFeelings.length === 0 ? (
          <p className="mt-2 text-sm text-ga-muted">Aucun ressenti.</p>
        ) : (
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {data.sessionFeelings.slice(0, 10).map((feeling) => (
              <article
                key={feeling.id}
                className={`rounded-lg border px-3 py-2 text-xs ${
                  feeling.needs_attention
                    ? "border-ga-red/50 bg-ga-red/10"
                    : "border-ga-border bg-ga-elevated/40"
                }`}
              >
                <p className="truncate text-ga-muted">
                  {feeling.sessionTitle}
                  {feeling.sessionDate
                    ? ` · ${formatFeedbackDate(feeling.sessionDate)}`
                    : ""}
                </p>
                {feeling.needs_attention ? (
                  <p className="mt-0.5 font-semibold text-ga-red">Attention</p>
                ) : null}
                <p className="mt-1 text-ga-fg">
                  E{feeling.fatigue} · S{feeling.sleep} · C{feeling.soreness} · St
                  {feeling.stress} · H{feeling.mood}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
