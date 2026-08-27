"use client";

import { useRouter } from "next/navigation";
import type { Athlete } from "@/lib/supabase/models";

export function AthletesTable({ athletes }: { athletes: Athlete[] }) {
  const router = useRouter();

  return (
    <section className="ga-table-wrap overflow-x-auto rounded-xl border border-ga-border bg-ga-card">
      {athletes.length === 0 ? (
        <p className="p-5 text-sm text-ga-muted">
          Aucun sportif. Ajoute le premier avec le bouton ci-dessus.
        </p>
      ) : (
        <table className="ga-table w-full min-w-[640px] text-sm">
          <thead>
            <tr>
              <th className="px-5 py-3 text-left font-medium">Nom</th>
              <th className="px-5 py-3 text-left font-medium">E-mail</th>
              <th className="px-5 py-3 text-left font-medium">Objectif</th>
              <th className="px-5 py-3 text-left font-medium">Semaine</th>
            </tr>
          </thead>
          <tbody>
            {athletes.map((athlete) => (
              <tr
                key={athlete.id}
                className="ga-table-row-clickable"
                onClick={() => router.push(`/sportifs/${athlete.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    router.push(`/sportifs/${athlete.id}`);
                  }
                }}
                tabIndex={0}
                role="link"
              >
                <td className="px-5 py-3 font-medium">
                  {athlete.first_name} {athlete.last_name}
                </td>
                <td className="px-5 py-3 text-ga-muted">{athlete.email}</td>
                <td className="px-5 py-3 text-ga-muted">
                  {athlete.goal || "-"}
                </td>
                <td className="px-5 py-3 text-ga-muted">
                  {athlete.current_week}/{athlete.total_weeks}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
