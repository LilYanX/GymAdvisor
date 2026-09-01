import { requireCoach } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  currentMonthLabel,
  firstOfMonthISO,
  formatPeriodLabel,
  todayISO,
} from "@/lib/dates";
import {
  getAthletePaymentState,
  paymentSettingsFromProfile,
  paymentWindow,
} from "@/lib/payments";
import { PaymentsView } from "@/components/payments/PaymentsView";
import type { Athlete, Payment } from "@/lib/supabase/models";

export default async function PaymentsPage() {
  const { profile } = await requireCoach();
  const supabase = await createClient();
  const periodStart = firstOfMonthISO();
  const today = todayISO();
  const settings = paymentSettingsFromProfile(profile);
  const { dueDate, graceEnd } = paymentWindow(today, settings);

  const { data: athletes } = await supabase
    .from("athletes")
    .select("*")
    .eq("coach_id", profile.id)
    .is("archived_at", null)
    .order("first_name");

  const list = (athletes ?? []) as Athlete[];
  const athleteIds = list.map((athlete) => athlete.id);

  if (list.length > 0) {
    await supabase.from("payments").upsert(
      list.map((athlete) => ({
        athlete_id: athlete.id,
        period_start: periodStart,
        status: "pending" as const,
      })),
      { onConflict: "athlete_id,period_start", ignoreDuplicates: true },
    );
  }

  const { data: allPayments } = athleteIds.length
    ? await supabase
        .from("payments")
        .select("*")
        .in("athlete_id", athleteIds)
        .order("period_start", { ascending: false })
    : { data: [] };

  const payments = (allPayments ?? []) as Payment[];
  const paymentsByAthlete = new Map<string, Payment[]>();
  for (const payment of payments) {
    const bucket = paymentsByAthlete.get(payment.athlete_id) ?? [];
    bucket.push(payment);
    paymentsByAthlete.set(payment.athlete_id, bucket);
  }

  const generalRows = list.map((athlete) => {
    const athletePayments = paymentsByAthlete.get(athlete.id) ?? [];
    const state = getAthletePaymentState(athletePayments, today, settings);

    return {
      athleteId: athlete.id,
      firstName: athlete.first_name,
      lastName: athlete.last_name,
      email: athlete.email,
      displayStatus: state.displayStatus,
      blocked: state.blocked,
      overdueMonthLabels: state.overduePeriods.map(formatPeriodLabel),
    };
  });

  const historyRows = list.flatMap((athlete) =>
    (paymentsByAthlete.get(athlete.id) ?? []).map((payment) => ({
      athleteId: athlete.id,
      firstName: athlete.first_name,
      lastName: athlete.last_name,
      periodStart: payment.period_start,
      monthLabel: formatPeriodLabel(payment.period_start),
      status: payment.status as "paid" | "pending",
      isOverdue:
        payment.period_start < periodStart && payment.status === "pending",
      updatedAt: payment.updated_at,
    })),
  );

  historyRows.sort((a, b) => {
    const periodCompare = b.periodStart.localeCompare(a.periodStart);
    if (periodCompare !== 0) return periodCompare;
    return a.lastName.localeCompare(b.lastName);
  });

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <PaymentsView
        monthLabel={currentMonthLabel()}
        dueDate={dueDate}
        graceEnd={graceEnd}
        settings={settings}
        generalRows={generalRows}
        historyRows={historyRows}
      />
    </div>
  );
}
