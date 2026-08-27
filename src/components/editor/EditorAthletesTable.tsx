"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { EditorOverviewAthlete } from "@/lib/editor-types";

const STATUS_LABELS: Record<NonNullable<EditorOverviewAthlete["latestWeekStatus"]>, string> = {
  draft: "Brouillon",
  published: "Publiée",
};

export function EditorAthletesTable({
  athletes,
}: {
  athletes: EditorOverviewAthlete[];
}) {
  const router = useRouter();

  return (
    <section className="ga-table-wrap ga-scrollbar-hidden w-full min-w-0 overflow-x-auto rounded-xl border border-ga-border bg-ga-card">
      {athletes.length === 0 ? (
        <p className="p-5 text-sm text-ga-muted">
          Aucun sportif. Ajoute-en un depuis la page{" "}
          <Link href="/sportifs" className="text-ga-lime hover:underline">
            Sportifs
          </Link>
          .
        </p>
      ) : (
        <table className="ga-table w-full min-w-[640px] text-sm">
          <thead>
            <tr>
              <th className="px-5 py-3 text-left font-medium">Nom</th>
              <th className="px-5 py-3 text-left font-medium">E-mail</th>
              <th className="px-5 py-3 text-left font-medium">Semaine</th>
              <th className="px-5 py-3 text-left font-medium">Dernière semaine</th>
            </tr>
          </thead>
          <tbody>
            {athletes.map((athlete) => (
              <tr
                key={athlete.id}
                className="ga-table-row-clickable"
                onClick={() => router.push(`/editeur?athlete=${athlete.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    router.push(`/editeur?athlete=${athlete.id}`);
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
                  {athlete.current_week}/{athlete.total_weeks}
                </td>
                <td className="px-5 py-3 text-ga-muted">
                  {athlete.latestWeekStatus
                    ? STATUS_LABELS[athlete.latestWeekStatus]
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
