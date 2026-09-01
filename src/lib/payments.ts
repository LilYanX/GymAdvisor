import { addDaysISO, firstOfMonthISO, todayISO } from "@/lib/dates";
import type { Payment, Profile } from "@/lib/supabase/models";

export const DEFAULT_PAYMENT_SETTINGS = {
  dueDay: 25,
  blockAfterDays: 5,
} as const;

export type PaymentSettings = {
  dueDay: number;
  blockAfterDays: number;
};

export type PaymentDisplayStatus = "paid" | "pending" | "late" | "blocked";

export function paymentSettingsFromProfile(
  profile:
    | Pick<Profile, "payment_due_day" | "payment_block_after_days">
    | null
    | undefined,
): PaymentSettings {
  return {
    dueDay: profile?.payment_due_day ?? DEFAULT_PAYMENT_SETTINGS.dueDay,
    blockAfterDays:
      profile?.payment_block_after_days ?? DEFAULT_PAYMENT_SETTINGS.blockAfterDays,
  };
}

export function paymentWindow(
  isoDate: string = todayISO(),
  settings: PaymentSettings = DEFAULT_PAYMENT_SETTINGS,
): {
  periodStart: string;
  dueDate: string;
  graceEnd: string;
} {
  const ym = isoDate.slice(0, 7);
  const dueDay = String(settings.dueDay).padStart(2, "0");
  const dueDate = `${ym}-${dueDay}`;
  return {
    periodStart: `${ym}-01`,
    dueDate,
    graceEnd: addDaysISO(dueDate, settings.blockAfterDays),
  };
}

export function getOverduePendingPayments(
  payments: Payment[],
  currentPeriodStart: string = firstOfMonthISO(),
): Payment[] {
  return payments.filter(
    (payment) =>
      payment.period_start < currentPeriodStart && payment.status === "pending",
  );
}

export function getPaymentDisplayStatus(
  payment: Payment | null | undefined,
  today: string = todayISO(),
  settings: PaymentSettings = DEFAULT_PAYMENT_SETTINGS,
): PaymentDisplayStatus {
  if (payment?.status === "paid") return "paid";

  const { dueDate, graceEnd } = paymentWindow(today, settings);
  if (today < dueDate) return "pending";
  if (today <= graceEnd) return "late";
  return "blocked";
}

export function getAthletePaymentState(
  payments: Payment[],
  today: string = todayISO(),
  settings: PaymentSettings = DEFAULT_PAYMENT_SETTINGS,
): {
  currentPayment: Payment | null;
  displayStatus: PaymentDisplayStatus;
  blocked: boolean;
  overduePeriods: string[];
} {
  const currentPeriodStart = `${today.slice(0, 7)}-01`;
  const currentPayment =
    payments.find((payment) => payment.period_start === currentPeriodStart) ??
    null;
  const overduePeriods = getOverduePendingPayments(
    payments,
    currentPeriodStart,
  ).map((payment) => payment.period_start);

  if (overduePeriods.length > 0) {
    return {
      currentPayment,
      displayStatus: "blocked",
      blocked: true,
      overduePeriods,
    };
  }

  const displayStatus = getPaymentDisplayStatus(currentPayment, today, settings);
  return {
    currentPayment,
    displayStatus,
    blocked: displayStatus === "blocked",
    overduePeriods: [],
  };
}

export function isPaymentBlocked(
  payments: Payment[],
  today: string = todayISO(),
  settings: PaymentSettings = DEFAULT_PAYMENT_SETTINGS,
): boolean {
  return getAthletePaymentState(payments, today, settings).blocked;
}

export const PAYMENT_DISPLAY_LABELS: Record<PaymentDisplayStatus, string> = {
  paid: "Payé",
  pending: "En attente",
  late: "En retard",
  blocked: "Bloqué",
};
