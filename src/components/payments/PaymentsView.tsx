"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setPaymentStatus } from "@/lib/actions/athletes";

type Row = {
  athleteId: string;
  firstName: string;
  lastName: string;
  email: string;
  status: "paid" | "pending";
  blocked: boolean;
};

export function PaymentsView({
  monthLabel,
  dueDate,
  graceEnd,
  rows,
}: {
  monthLabel: string;
  dueDate: string;
  graceEnd: string;
  rows: Row[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-1 flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">Paiements - {monthLabel}</h1>
        <p className="mt-1 text-sm text-ga-muted">
          Échéance le {dueDate.slice(8)} · accès programme bloqué après le{" "}
          {graceEnd.slice(8)} si non payé.
        </p>
      </div>

      {error ? <p className="text-sm text-ga-red">{error}</p> : null}

      <section className="ga-table-wrap overflow-x-auto rounded-xl border border-ga-border bg-ga-card">
        {rows.length === 0 ? (
          <p className="p-5 text-sm text-ga-muted">Aucun sportif.</p>
        ) : (
          <table className="ga-table w-full text-left text-sm">
            <thead>
              <tr>
                <th className="px-5 py-3 font-medium">Sportif</th>
                <th className="px-5 py-3 font-medium">Statut</th>
                <th className="px-5 py-3 font-medium">Accès</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.athleteId}>
                  <td className="px-5 py-3">
                    <Link
                      href={`/sportifs/${row.athleteId}`}
                      className="font-medium hover:text-ga-lime"
                    >
                      {row.firstName} {row.lastName}
                    </Link>
                    <p className="text-xs text-ga-muted">{row.email}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={
                        row.status === "paid" ? "text-ga-lime" : "text-ga-amber"
                      }
                    >
                      {row.status === "paid" ? "Payé" : "En attente"}
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
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={pending || row.status === "paid"}
                        onClick={() => {
                          setError(null);
                          startTransition(async () => {
                            const result = await setPaymentStatus(
                              row.athleteId,
                              "paid",
                            );
                            if (result.error) setError(result.error);
                            else router.refresh();
                          });
                        }}
                        className="rounded-md bg-ga-elevated px-2.5 py-1 text-xs hover:text-ga-lime disabled:opacity-40"
                      >
                        Payé
                      </button>
                      <button
                        type="button"
                        disabled={pending || row.status === "pending"}
                        onClick={() => {
                          setError(null);
                          startTransition(async () => {
                            const result = await setPaymentStatus(
                              row.athleteId,
                              "pending",
                            );
                            if (result.error) setError(result.error);
                            else router.refresh();
                          });
                        }}
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
    </div>
  );
}
