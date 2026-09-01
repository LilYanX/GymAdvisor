"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  reactivateAthleteAccess,
  setPaymentStatus,
  setPaymentStatusForPeriod,
  updatePaymentSettings,
} from "@/lib/actions/payments";
import { formatDayMonth } from "@/lib/dates";
import {
  PAYMENT_DISPLAY_LABELS,
  type PaymentDisplayStatus,
  type PaymentSettings,
} from "@/lib/payments";
import { IconSettings } from "@/components/icons";

type GeneralRow = {
  athleteId: string;
  firstName: string;
  lastName: string;
  email: string;
  displayStatus: PaymentDisplayStatus;
  blocked: boolean;
  overdueMonthLabels: string[];
};

type HistoryRow = {
  athleteId: string;
  firstName: string;
  lastName: string;
  periodStart: string;
  monthLabel: string;
  status: "paid" | "pending";
  isOverdue: boolean;
  updatedAt: string;
};

type TabId = "general" | "history";

const STATUS_CLASS: Record<PaymentDisplayStatus, string> = {
  paid: "text-ga-lime",
  pending: "text-ga-muted",
  late: "text-ga-amber",
  blocked: "text-ga-red",
};

const TABS: { id: TabId; label: string }[] = [
  { id: "general", label: "Général" },
  { id: "history", label: "Historique" },
];

export function PaymentsView({
  monthLabel,
  dueDate,
  graceEnd,
  settings,
  generalRows,
  historyRows,
}: {
  monthLabel: string;
  dueDate: string;
  graceEnd: string;
  settings: PaymentSettings;
  generalRows: GeneralRow[];
  historyRows: HistoryRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>("general");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [dueDay, setDueDay] = useState(String(settings.dueDay));
  const [blockAfterDays, setBlockAfterDays] = useState(
    String(settings.blockAfterDays),
  );

  function run(action: () => Promise<{ error: string | null }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Paiements</h1>
        </div>
        <button
          type="button"
          onClick={() => setSettingsOpen((open) => !open)}
          className="inline-flex items-center gap-2 rounded-lg border border-ga-border bg-ga-card px-3 py-2 text-sm text-ga-muted hover:text-ga-fg"
        >
          <IconSettings className="h-4 w-4" />
          Paramètres
        </button>
      </div>

      <div className="flex w-full gap-1 rounded-lg border border-ga-border bg-ga-card p-1">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === item.id
                ? "bg-ga-lime text-black"
                : "text-ga-muted hover:text-ga-fg"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error ? <p className="text-sm text-ga-red">{error}</p> : null}

      {settingsOpen ? (
        <section className="rounded-xl border border-ga-border bg-ga-card p-5">
          <h2 className="text-base font-semibold">Paramètres de paiement</h2>
          <p className="mt-1 text-sm text-ga-muted">
            Un paiement en attente sur un mois précédent bloque automatiquement
            l&apos;accès. Le coach peut réactiver un compte après encaissement.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm text-ga-muted">
              Jour du mois (en retard)
              <input
                type="number"
                min={1}
                max={28}
                value={dueDay}
                disabled={pending}
                onChange={(event) => setDueDay(event.target.value)}
                className="mt-1 w-full rounded-lg border border-ga-border bg-ga-elevated px-3 py-2 text-sm text-ga-fg outline-none focus:border-ga-lime"
              />
            </label>
            <label className="text-sm text-ga-muted">
              Jours avant blocage (après échéance)
              <input
                type="number"
                min={0}
                max={60}
                value={blockAfterDays}
                disabled={pending}
                onChange={(event) => setBlockAfterDays(event.target.value)}
                className="mt-1 w-full rounded-lg border border-ga-border bg-ga-elevated px-3 py-2 text-sm text-ga-fg outline-none focus:border-ga-lime"
              />
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                run(() =>
                  updatePaymentSettings(Number(dueDay), Number(blockAfterDays)),
                )
              }
              className="rounded-lg bg-ga-lime px-4 py-2 text-sm font-semibold text-black hover:bg-lime-300 disabled:opacity-60"
            >
              Enregistrer
            </button>
            <button
              type="button"
              onClick={() => {
                setDueDay(String(settings.dueDay));
                setBlockAfterDays(String(settings.blockAfterDays));
                setSettingsOpen(false);
              }}
              className="rounded-lg bg-ga-elevated px-4 py-2 text-sm text-ga-muted hover:text-ga-fg"
            >
              Fermer
            </button>
          </div>
        </section>
      ) : null}

      {tab === "general" ? (
        <>
          <section className="ga-table-wrap overflow-x-auto rounded-xl border border-ga-border bg-ga-card">
            {generalRows.length === 0 ? (
              <p className="p-5 text-sm text-ga-muted">Aucun sportif.</p>
            ) : (
              <table className="ga-table w-full text-left text-sm">
                <thead>
                  <tr>
                    <th className="px-5 py-3 font-medium">Sportif</th>
                    <th className="px-5 py-3 font-medium">Statut ({monthLabel})</th>
                    <th className="px-5 py-3 font-medium">Accès</th>
                    <th className="px-5 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {generalRows.map((row) => (
                    <tr key={row.athleteId} className="align-top">
                      <td className="px-5 py-3">
                        <Link
                          href={`/sportifs/${row.athleteId}`}
                          className="font-medium hover:text-ga-lime"
                        >
                          {row.firstName} {row.lastName}
                        </Link>
                        <p className="text-xs text-ga-muted">{row.email}</p>
                        {row.overdueMonthLabels.length > 0 ? (
                          <p className="mt-1 text-xs text-ga-red">
                            Impayé : {row.overdueMonthLabels.join(", ")}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-5 py-3">
                        <span className={STATUS_CLASS[row.displayStatus]}>
                          {PAYMENT_DISPLAY_LABELS[row.displayStatus]}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {row.blocked ? (
                          <span className="text-ga-red">Bloqué</span>
                        ) : (
                          <span className="text-ga-muted">OK</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={pending || row.displayStatus === "paid"}
                            onClick={() =>
                              run(() => setPaymentStatus(row.athleteId, "paid"))
                            }
                            className="rounded-md bg-ga-elevated px-2.5 py-1 text-xs hover:text-ga-lime disabled:opacity-40"
                          >
                            Payé
                          </button>
                          <button
                            type="button"
                            disabled={
                              pending ||
                              (row.displayStatus === "pending" &&
                                row.overdueMonthLabels.length === 0)
                            }
                            onClick={() =>
                              run(() =>
                                setPaymentStatus(row.athleteId, "pending"),
                              )
                            }
                            className="rounded-md bg-ga-elevated px-2.5 py-1 text-xs hover:text-ga-amber disabled:opacity-40"
                          >
                            Attente
                          </button>
                          {row.blocked ? (
                            <button
                              type="button"
                              disabled={pending}
                              onClick={() =>
                                run(() =>
                                  reactivateAthleteAccess(row.athleteId),
                                )
                              }
                              className="rounded-md border border-ga-lime/40 px-2.5 py-1 text-xs text-ga-lime hover:bg-ga-lime/10 disabled:opacity-40"
                            >
                              Réactiver
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      ) : (
        <section className="ga-table-wrap overflow-x-auto rounded-xl border border-ga-border bg-ga-card">
          {historyRows.length === 0 ? (
            <p className="p-5 text-sm text-ga-muted">Aucun historique.</p>
          ) : (
            <table className="ga-table w-full text-left text-sm">
              <thead>
                <tr>
                  <th className="px-5 py-3 font-medium">Sportif</th>
                  <th className="px-5 py-3 font-medium">Mois</th>
                  <th className="px-5 py-3 font-medium">Statut</th>
                  <th className="px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {historyRows.map((row) => (
                  <tr
                    key={`${row.athleteId}:${row.periodStart}`}
                    className="align-top"
                  >
                    <td className="px-5 py-3">
                      <Link
                        href={`/sportifs/${row.athleteId}`}
                        className="font-medium hover:text-ga-lime"
                      >
                        {row.firstName} {row.lastName}
                      </Link>
                    </td>
                    <td className="px-5 py-3">{row.monthLabel}</td>
                    <td className="px-5 py-3">
                      <span
                        className={
                          row.status === "paid"
                            ? "text-ga-lime"
                            : row.isOverdue
                              ? "text-ga-red"
                              : "text-ga-amber"
                        }
                      >
                        {row.status === "paid"
                          ? "Payé"
                          : row.isOverdue
                            ? "En attente (impayé)"
                            : "En attente"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={pending || row.status === "paid"}
                          onClick={() =>
                            run(() =>
                              setPaymentStatusForPeriod(
                                row.athleteId,
                                row.periodStart,
                                "paid",
                              ),
                            )
                          }
                          className="rounded-md bg-ga-elevated px-2.5 py-1 text-xs hover:text-ga-lime disabled:opacity-40"
                        >
                          Payé
                        </button>
                        <button
                          type="button"
                          disabled={pending || row.status === "pending"}
                          onClick={() =>
                            run(() =>
                              setPaymentStatusForPeriod(
                                row.athleteId,
                                row.periodStart,
                                "pending",
                              ),
                            )
                          }
                          className="rounded-md bg-ga-elevated px-2.5 py-1 text-xs hover:text-ga-amber disabled:opacity-40"
                        >
                          Attente
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}
    </div>
  );
}
