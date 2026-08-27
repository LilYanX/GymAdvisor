import { requireCoach } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { firstOfMonthISO, currentMonthLabel, todayISO } from "@/lib/dates";
import { paymentWindow, isPaymentBlocked } from "@/lib/athlete-followup";
import { PaymentsView } from "@/components/payments/PaymentsView";
import type { Athlete, Payment } from "@/lib/supabase/models";

export default async function PaymentsPage() {
  const { profile } = await requireCoach();
  const supabase = await createClient();
  const periodStart = firstOfMonthISO();
  const today = todayISO();
  const { dueDate, graceEnd } = paymentWindow(today);

  const { data: athletes } = await supabase
    .from("athletes")
    .select("*")
    .eq("coach_id", profile.id)
    .is("archived_at", null)
    .order("first_name");

  const list = (athletes ?? []) as Athlete[];
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

  const { data: payments } = await supabase
    .from("payments")
    .select("*")
    .eq("period_start", periodStart)
    .in(
      "athlete_id",
      list.map((athlete) => athlete.id),
    );

  const paymentByAthlete = new Map(
    ((payments ?? []) as Payment[]).map((payment) => [payment.athlete_id, payment]),
  );

  const rows = list.map((athlete) => {
    const payment = paymentByAthlete.get(athlete.id) ?? null;
    return {
      athleteId: athlete.id,
      firstName: athlete.first_name,
      lastName: athlete.last_name,
      email: athlete.email,
      status: (payment?.status ?? "pending") as "paid" | "pending",
      blocked: isPaymentBlocked(payment, today),
    };
  });

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <PaymentsView
        monthLabel={currentMonthLabel()}
        dueDate={dueDate}
        graceEnd={graceEnd}
        rows={rows}
      />
    </div>
  );
}
