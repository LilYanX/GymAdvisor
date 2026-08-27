"use client";

import { useActionState, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  archiveAthlete,
  setPaymentStatus,
  updateAthlete,
  type AthleteFormState,
} from "@/lib/actions/athletes";
import type { AthleteFollowUp } from "@/lib/athlete-followup-types";
import { formatFeedbackDate } from "@/lib/dates";

function monthLabel(): string {
  return new Intl.DateTimeFormat("fr-FR", { month: "long" }).format(new Date());
}

const initial: AthleteFormState = { error: null };

export function AthleteDetailView({ data }: { data: AthleteFollowUp }) {
  const router = useRouter();
  const { athlete } = data;
  const [state, action, pending] = useActionState(updateAthlete, initial);
  const [payPending, startPay] = useTransition();
  const [payError, setPayError] = useState<string | null>(null);

  return (
    <div className="flex flex-1 flex-col gap-8 p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/sportifs" className="text-sm text-ga-muted hover:text-ga-fg">
            ← Sportifs
          </Link>
          <h1 className="mt-3 text-2xl font-semibold">
            {athlete.first_name} {athlete.last_name}
          </h1>
          <p className="mt-1 text-ga-muted">{athlete.goal || athlete.email}</p>
        </div>
        <Link
          href={`/editeur?athlete=${athlete.id}`}
          className="rounded-lg bg-ga-lime px-4 py-2 text-sm font-semibold text-black hover:bg-lime-300"
        >
          Éditeur de programme
        </Link>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <form
          action={action}
          className="grid gap-3 rounded-xl border border-ga-border bg-ga-card p-5"
        >
          <h2 className="text-base font-semibold">Informations</h2>
          <input type="hidden" name="athlete_id" value={athlete.id} />
          <label className="text-sm">
            <span className="mb-1.5 block text-ga-muted">Prénom</span>
            <input
              name="first_name"
              required
              defaultValue={athlete.first_name}
              className="w-full rounded-lg border border-ga-border bg-ga-elevated px-3 py-2 outline-none focus:border-ga-lime"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1.5 block text-ga-muted">Nom</span>
            <input
              name="last_name"
              defaultValue={athlete.last_name}
              className="w-full rounded-lg border border-ga-border bg-ga-elevated px-3 py-2 outline-none focus:border-ga-lime"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1.5 block text-ga-muted">E-mail</span>
            <input
              name="email"
              type="email"
              required
              defaultValue={athlete.email}
              className="w-full rounded-lg border border-ga-border bg-ga-elevated px-3 py-2 outline-none focus:border-ga-lime"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1.5 block text-ga-muted">Objectif</span>
            <input
              name="goal"
              defaultValue={athlete.goal}
              className="w-full rounded-lg border border-ga-border bg-ga-elevated px-3 py-2 outline-none focus:border-ga-lime"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="mb-1.5 block text-ga-muted">Semaine actuelle</span>
              <input
                name="current_week"
                type="number"
                min={1}
                defaultValue={athlete.current_week}
                className="w-full rounded-lg border border-ga-border bg-ga-elevated px-3 py-2 outline-none focus:border-ga-lime"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1.5 block text-ga-muted">Total semaines</span>
              <input
                name="total_weeks"
                type="number"
                min={1}
                defaultValue={athlete.total_weeks}
                className="w-full rounded-lg border border-ga-border bg-ga-elevated px-3 py-2 outline-none focus:border-ga-lime"
              />
            </label>
          </div>
          <label className="text-sm">
            <span className="mb-1.5 block text-ga-muted">Notes</span>
            <textarea
              name="notes"
              rows={3}
              defaultValue={athlete.notes}
              className="w-full rounded-lg border border-ga-border bg-ga-elevated px-3 py-2 outline-none focus:border-ga-lime"
            />
          </label>
          {state.error ? (
            <p className="text-sm text-ga-red">{state.error}</p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-ga-lime px-4 py-2 text-sm font-semibold text-black hover:bg-lime-300 disabled:opacity-60"
            >
              {pending ? "Enregistrement…" : "Enregistrer"}
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
              className="rounded-lg border border-ga-border px-4 py-2 text-sm text-ga-muted hover:text-ga-fg"
            >
              Archiver
            </button>
          </div>
        </form>

        <div className="flex flex-col gap-6">
          <section className="rounded-xl border border-ga-border bg-ga-card p-5">
            <h2 className="text-base font-semibold">
              Paiement - {monthLabel()}
            </h2>
            <p className="mt-1 text-sm text-ga-muted">
              Échéance le {data.paymentDueDate.slice(8)} · accès bloqué après le{" "}
              {data.paymentGraceEnd.slice(8)}
            </p>
            <p className="mt-4 text-sm">
              Statut :{" "}
              <span
                className={
                  data.payment?.status === "paid"
                    ? "font-semibold text-ga-lime"
                    : "font-semibold text-ga-amber"
                }
              >
                {data.payment?.status === "paid" ? "Payé" : "En attente"}
              </span>
              {data.paymentBlocked ? (
                <span className="ml-2 text-ga-red">(accès bloqué)</span>
              ) : null}
            </p>
            {payError ? <p className="mt-2 text-sm text-ga-red">{payError}</p> : null}
            <div className="mt-4 flex gap-2">
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
                className="rounded-lg bg-ga-lime px-3 py-2 text-sm font-semibold text-black hover:bg-lime-300 disabled:opacity-60"
              >
                Marquer payé
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
                className="rounded-lg border border-ga-border px-3 py-2 text-sm text-ga-muted hover:text-ga-fg disabled:opacity-60"
              >
                En attente
              </button>
            </div>
          </section>

          <section className="rounded-xl border border-ga-border bg-ga-card p-5">
            <h2 className="text-base font-semibold">Charge cumulée</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-ga-elevated p-3">
                <p className="text-xs text-ga-muted">Tonnage</p>
                <p className="mt-1 text-xl font-semibold">
                  {data.totals.tonnageKg.toLocaleString("fr-FR")} kg
                </p>
              </div>
              <div className="rounded-lg bg-ga-elevated p-3">
                <p className="text-xs text-ga-muted">Charge (min × RPE/10)</p>
                <p className="mt-1 text-xl font-semibold">
                  {data.totals.loadUnits.toLocaleString("fr-FR")} u.a.
                </p>
              </div>
            </div>
          </section>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold">Retours des séances</h2>
        {data.feedbacks.length === 0 ? (
          <p className="text-sm text-ga-muted">Aucun feedback pour l’instant.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {data.feedbacks.map((item, index) => (
              <article
                key={`${item.sessionId}-${item.exerciseName}-${index}`}
                className="rounded-xl border border-ga-border bg-ga-card p-4"
              >
                <p className="text-xs text-ga-muted">
                  {formatFeedbackDate(item.sessionDate)} · {item.sessionTitle}
                </p>
                <p className="mt-1 font-medium">{item.exerciseName}</p>
                {item.rpe != null ? (
                  <p className="mt-1 text-sm text-ga-lime">RPE {item.rpe}</p>
                ) : null}
                {item.comment ? (
                  <p className="mt-2 text-sm text-ga-muted">{item.comment}</p>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold">Charge par séance</h2>
        {data.sessions.length === 0 ? (
          <p className="text-sm text-ga-muted">Aucune séance loggée.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-ga-border bg-ga-card">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-ga-muted">
                <tr className="border-b border-ga-border">
                  <th className="px-4 py-3 font-medium">Séance</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Tonnage</th>
                  <th className="px-4 py-3 font-medium">Charge u.a.</th>
                </tr>
              </thead>
              <tbody>
                {data.sessions.map((session) => (
                  <tr key={session.sessionId} className="border-t border-ga-border/80">
                    <td className="px-4 py-3 font-medium">{session.title}</td>
                    <td className="px-4 py-3 text-ga-muted">
                      {formatFeedbackDate(session.date)}
                    </td>
                    <td className="px-4 py-3">
                      {session.tonnageKg.toLocaleString("fr-FR")} kg
                    </td>
                    <td className="px-4 py-3">{session.loadUnits} u.a.</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold">Check-ins</h2>
        {data.checkIns.length === 0 ? (
          <p className="text-sm text-ga-muted">Aucun check-in.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {data.checkIns.map((checkIn) => (
              <article
                key={checkIn.id}
                className="rounded-xl border border-ga-border bg-ga-card p-4 text-sm"
              >
                <p className="text-xs text-ga-muted">
                  Semaine du {formatFeedbackDate(checkIn.week_start_date)}
                </p>
                <p className="mt-2">Énergie {checkIn.energy}/5</p>
                <p>Sommeil {checkIn.sleep}/5</p>
                <p>Douleurs {checkIn.pain}/5</p>
                {checkIn.comment ? (
                  <p className="mt-2 text-ga-muted">{checkIn.comment}</p>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
