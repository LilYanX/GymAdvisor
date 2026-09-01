import type { ReactNode } from "react";
import { requireAthlete } from "@/lib/auth";
import { AthleteNav } from "@/components/athlete/AthleteNav";
import { signOut } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDayMonth, formatPeriodLabel, todayISO } from "@/lib/dates";
import {
  getOverduePendingPayments,
  isPaymentBlocked,
  paymentSettingsFromProfile,
  paymentWindow,
} from "@/lib/payments";
import type { Payment } from "@/lib/supabase/models";

export default async function AthleteLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { profile, athlete } = await requireAthlete();

  if (!athlete) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
        <h1 className="text-2xl font-semibold">Compte en attente</h1>
        <p className="mt-3 text-sm text-ga-muted">{profile.email}</p>
        <form action={signOut} className="mt-8">
          <button type="submit" className="text-sm text-ga-muted hover:text-ga-fg">
            Se déconnecter
          </button>
        </form>
      </main>
    );
  }

  const supabase = await createClient();
  const today = todayISO();
  const currentPeriodStart = `${today.slice(0, 7)}-01`;

  const [{ data: athletePayments }, { data: coachProfile }] = await Promise.all([
    supabase
      .from("payments")
      .select("*")
      .eq("athlete_id", athlete.id)
      .order("period_start", { ascending: false }),
    supabase
      .from("profiles")
      .select("payment_due_day, payment_block_after_days")
      .eq("id", athlete.coach_id)
      .maybeSingle(),
  ]);

  const settings = paymentSettingsFromProfile(coachProfile);
  const { dueDate, graceEnd } = paymentWindow(today, settings);
  const payments = (athletePayments ?? []) as Payment[];
  const overduePayments = getOverduePendingPayments(payments, currentPeriodStart);

  if (isPaymentBlocked(payments, today, settings)) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
        <h1 className="text-2xl font-semibold">Accès en pause</h1>
        {overduePayments.length > 0 ? (
          <p className="mt-3 text-sm text-ga-muted">
            Paiement en attente pour{" "}
            {overduePayments
              .map((payment) => formatPeriodLabel(payment.period_start))
              .join(", ")}
            .
          </p>
        ) : (
          <p className="mt-3 text-sm text-ga-muted">
            Échéance le {formatDayMonth(dueDate)} · délai jusqu’au{" "}
            {formatDayMonth(graceEnd)}.
          </p>
        )}
        <p className="mt-2 text-sm text-ga-muted">
          Contacte ton coach une fois le paiement effectué pour réactiver ton
          accès.
        </p>
        <form action={signOut} className="mt-8">
          <button type="submit" className="text-sm text-ga-muted hover:text-ga-fg">
            Se déconnecter
          </button>
        </form>
      </main>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-ga-bg">
      <div className="flex min-h-0 flex-1 flex-col pb-14">{children}</div>
      <AthleteNav />
    </div>
  );
}
