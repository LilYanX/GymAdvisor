import { addDaysISO, mondayOfWeekISO, todayISO } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import type { Athlete, ProgramWeek, Session } from "@/lib/supabase/models";

type WeekMeta = Pick<ProgramWeek, "id" | "week_number" | "published_at">;

/**
 * Dernier jour calendaire d’une semaine de programme.
 * Priorité aux scheduled_date ; sinon lundi de publication + 6 jours.
 */
function weekEndFromSessions(
  sessions: Pick<Session, "scheduled_date">[],
  week: WeekMeta,
): string | null {
  const dates = sessions
    .map((session) => session.scheduled_date)
    .filter((date): date is string => Boolean(date));
  if (dates.length > 0) {
    return dates.reduce((latest, date) => (date > latest ? date : latest));
  }
  if (week.published_at) {
    const monday = mondayOfWeekISO(week.published_at.slice(0, 10));
    return addDaysISO(monday, 6);
  }
  return null;
}

/**
 * Avance current_week selon le calendrier (pas selon la complétion des séances).
 * Le coach peut toujours forcer le numéro manuellement.
 */
export async function syncAthleteCurrentWeek(
  athlete: Athlete,
): Promise<Athlete> {
  if (athlete.current_week >= athlete.total_weeks) return athlete;

  const today = todayISO();
  const supabase = await createClient();

  const { data: weeks } = await supabase
    .from("program_weeks")
    .select("id, week_number, published_at")
    .eq("athlete_id", athlete.id)
    .eq("status", "published")
    .order("week_number");

  const published = (weeks ?? []) as WeekMeta[];
  if (published.length === 0) return athlete;

  let targetWeek = athlete.current_week;
  let estimatedEnd: string | null = null;

  while (targetWeek < athlete.total_weeks) {
    const week = published.find((item) => item.week_number === targetWeek);

    let weekEnd: string | null = null;
    if (week) {
      const { data: sessions } = await supabase
        .from("sessions")
        .select("scheduled_date")
        .eq("program_week_id", week.id);
      weekEnd = weekEndFromSessions(
        (sessions ?? []) as Pick<Session, "scheduled_date">[],
        week,
      );
    } else if (estimatedEnd) {
      // Semaine non publiée : on estime +7 j par cran après la dernière fin connue
      weekEnd = estimatedEnd;
    } else {
      // Pas de repère calendaire → on n’avance pas à l’aveugle
      break;
    }

    if (!weekEnd || today <= weekEnd) break;

    estimatedEnd = addDaysISO(weekEnd, 7);
    targetWeek += 1;
  }

  if (targetWeek === athlete.current_week) return athlete;
  const nextWeek = Math.min(targetWeek, athlete.total_weeks);

  const { error } = await supabase
    .from("athletes")
    .update({ current_week: nextWeek })
    .eq("id", athlete.id);
  if (error) return athlete;

  return { ...athlete, current_week: nextWeek };
}
