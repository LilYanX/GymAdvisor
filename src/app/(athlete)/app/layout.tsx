import type { ReactNode } from "react";
import { requireAthlete } from "@/lib/auth";
import { AthleteNav } from "@/components/athlete/AthleteNav";
import { signOut } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/server";
import {
  isPaymentBlocked,
  paymentWindow,
} from "@/lib/athlete-followup";
import { todayISO } from "@/lib/dates";
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
        <h1 className="text-2xl font-semibold">Compte créé</h1>
        <p className="mt-3 text-sm text-ga-muted">
          {profile.first_name || "Salut"}, ton coach doit t’ajouter avec l’e-mail{" "}
          <span className="text-ga-fg">{profile.email}</span> pour que ton
          programme apparaisse ici.
        </p>
        <form action={signOut} className="mt-8">
          <button type="submit" className="text-sm text-ga-muted hover:text-ga-fg">
            Se déconnecter
          </button>
        </form>
      </main>
    );
  }

  const supabase = await createClient();
  const { periodStart, dueDate, graceEnd } = paymentWindow(todayISO());
  const { data: payment } = await supabase
    .from("payments")
    .select("*")
    .eq("athlete_id", athlete.id)
    .eq("period_start", periodStart)
    .maybeSingle();

  if (isPaymentBlocked(payment as Payment | null)) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
        <h1 className="text-2xl font-semibold">Accès en pause</h1>
        <p className="mt-3 text-sm text-ga-muted">
          Le règlement du mois n’est pas à jour (échéance le {dueDate.slice(8)},
          délai jusqu’au {graceEnd.slice(8)}). Contacte ton coach pour
          débloquer ton programme.
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
