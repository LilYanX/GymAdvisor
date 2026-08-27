import type { AthleteStatus } from "@/lib/dashboard-types";

const LABELS: Record<AthleteStatus, string> = {
  late: "En retard",
  prepare: "À préparer",
  payment: "Paiement en attente",
  two_left: "2 séances restantes",
  up_to_date: "À jour",
};

const TONES: Record<AthleteStatus, string> = {
  late: "bg-ga-amber/15 text-ga-amber",
  prepare: "bg-ga-blue/15 text-ga-blue",
  payment: "bg-ga-red/15 text-ga-red",
  two_left: "bg-ga-amber/15 text-ga-amber",
  up_to_date: "bg-ga-lime/15 text-ga-lime",
};

export function StatusPill({ status }: { status: AthleteStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${TONES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
