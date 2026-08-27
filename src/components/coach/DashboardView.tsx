import type { ReactNode } from "react";
import Link from "next/link";
import type { DashboardData } from "@/lib/dashboard";
import { formatHeaderDate } from "@/lib/dates";
import { StatusPill } from "@/components/coach/StatusPill";
import {
  IconBell,
  IconCalendar,
  IconCheck,
  IconClock,
  IconFile,
  IconUser,
  IconUsers,
} from "@/components/icons";

export function DashboardView({ data }: { data: DashboardData }) {
  const { athletes, todos, kpis } = data;

  return (
    <div className="flex flex-1 flex-col gap-6 p-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{formatHeaderDate()}</h1>
        <Link
          href="/editeur"
          className="rounded-lg bg-ga-lime px-4 py-2 text-sm font-semibold text-black hover:bg-lime-300"
        >
          + Nouveau programme
        </Link>
      </header>

      <section className="grid grid-cols-4 gap-3">
        <Kpi
          icon={<IconUsers className="h-4 w-4" />}
          value={kpis.active}
          label="Sportifs actifs"
        />
        <Kpi
          icon={<IconCheck className="h-4 w-4 text-ga-lime" />}
          value={kpis.upToDate}
          label="Suivis à jour"
        />
        <Kpi
          icon={<IconClock className="h-4 w-4 text-ga-amber" />}
          value={kpis.late}
          label="En retard de saisie"
        />
        <Kpi
          icon={<IconCalendar className="h-4 w-4 text-ga-blue" />}
          value={kpis.toPrepare}
          label="Programme à préparer"
        />
      </section>

      <section className="rounded-xl border border-ga-border bg-ga-card">
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="text-base font-semibold">Mes sportifs</h2>
          <Link href="/sportifs" className="text-sm text-ga-muted hover:text-ga-fg">
            Gérer
          </Link>
        </div>
        {athletes.length === 0 ? (
          <div className="px-5 pb-6 text-sm text-ga-muted">
            Aucun sportif pour l’instant.{" "}
            <Link href="/sportifs" className="text-ga-lime hover:underline">
              Ajouter un sportif
            </Link>
          </div>
        ) : (
          <div className="ga-table-wrap overflow-x-auto">
            <table className="ga-table w-full text-left text-sm">
              <thead>
                <tr>
                  <th className="px-5 py-3 font-medium">Sportif</th>
                  <th className="px-5 py-3 font-medium">Objectif</th>
                  <th className="px-5 py-3 font-medium">Dernière séance</th>
                  <th className="px-5 py-3 font-medium">Statut</th>
                  <th className="px-5 py-3 font-medium">Semaine</th>
                  <th className="px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {athletes.map((athlete) => (
                  <tr key={athlete.id}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ga-elevated text-xs font-semibold">
                          {athlete.initials}
                        </span>
                        <span className="font-medium">{athlete.firstName}</span>
                      </div>
                    </td>
                    <td className="max-w-56 truncate px-5 py-3 text-ga-muted">
                      {athlete.goal || "-"}
                    </td>
                    <td className="px-5 py-3 text-ga-muted">
                      {athlete.lastSessionLabel ?? "-"}
                    </td>
                    <td className="px-5 py-3">
                      <StatusPill status={athlete.status} />
                    </td>
                    <td className="px-5 py-3 text-ga-muted">
                      {athlete.weekTotal > 0
                        ? `${athlete.weekDone}/${athlete.weekTotal}`
                        : "-"}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`mailto:${athlete.email}?subject=${encodeURIComponent("Petit rappel - ta séance")}&body=${encodeURIComponent(`Salut ${athlete.firstName},\n\nPense à renseigner ta séance, j'en ai besoin pour la suite.\n\n- Lilia`)}`}
                          title="Relancer"
                          className="rounded-md p-1.5 text-ga-muted hover:bg-ga-elevated hover:text-ga-fg"
                        >
                          <IconBell className="h-4 w-4" />
                        </a>
                        <Link
                          href={`/editeur?athlete=${athlete.id}`}
                          title="Voir le programme"
                          className="rounded-md p-1.5 text-ga-muted hover:bg-ga-elevated hover:text-ga-fg"
                        >
                          <IconFile className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/sportifs/${athlete.id}`}
                          title="Fiche sportif"
                          className="rounded-md p-1.5 text-ga-muted hover:bg-ga-elevated hover:text-ga-fg"
                        >
                          <IconUser className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold">À faire aujourd’hui</h2>
        {todos.length === 0 ? (
          <p className="text-sm text-ga-muted">Rien de bloquant pour aujourd’hui.</p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {todos.map((todo) => (
              <article
                key={todo.id}
                className="rounded-xl border border-ga-border bg-ga-card p-4"
              >
                <div className="mb-3">
                  <StatusPill status={todo.kind} />
                </div>
                <h3 className="text-sm font-semibold">{todo.title}</h3>
                <p className="mt-1 text-sm text-ga-muted">{todo.detail}</p>
                <Link
                  href={todo.href}
                  className="mt-4 inline-block text-sm text-ga-muted hover:text-ga-lime"
                >
                  Ouvrir →
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Kpi({
  icon,
  value,
  label,
}: {
  icon: ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-xl border border-ga-border bg-ga-card px-4 py-4">
      <div className="mb-3 text-ga-muted">{icon}</div>
      <p className="text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-sm text-ga-muted">{label}</p>
    </div>
  );
}
