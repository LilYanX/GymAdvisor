/** Questionnaire de bien-être McLean et al. (2010) — items 1–5 (5 = meilleur). */

export const MCLEAN_ITEMS = [
  {
    key: "fatigue" as const,
    label: "Fatigue",
    hints: [
      "Constamment fatiguée",
      "Plus fatiguée que d’habitude",
      "Normale",
      "Fraîche",
      "Très fraîche",
    ],
  },
  {
    key: "sleep" as const,
    label: "Sommeil",
    hints: [
      "Insomnie",
      "Agité",
      "Difficulté à m’endormir",
      "Bon",
      "Très reposant",
    ],
  },
  {
    key: "soreness" as const,
    label: "Courbatures",
    hints: [
      "Très courbaturée",
      "Courbatures en hausse",
      "Normal",
      "Bien",
      "Très bien",
    ],
  },
  {
    key: "stress" as const,
    label: "Stress",
    hints: [
      "Très stressée",
      "Stressée",
      "Normal",
      "Détendue",
      "Très détendue",
    ],
  },
  {
    key: "mood" as const,
    label: "Humeur",
    hints: [
      "Très irritée ou abattue",
      "Irritable",
      "Moins d’intérêt que d’habitude",
      "Bonne",
      "Très positive",
    ],
  },
] as const;

export type McLeanKey = (typeof MCLEAN_ITEMS)[number]["key"];

export type McLeanScores = Record<McLeanKey, number>;

export function mcleanTotal(scores: McLeanScores): number {
  return (
    scores.fatigue +
    scores.sleep +
    scores.soreness +
    scores.stress +
    scores.mood
  );
}

export function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function stdDev(values: number[]): number | null {
  if (values.length < 2) return null;
  const m = mean(values);
  if (m == null) return null;
  const variance =
    values.reduce((sum, v) => sum + (v - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

/**
 * Alerte McLean si score < moyenne personnelle − 1 écart-type.
 * Avec peu d’historique (< 4 points), seuil soft à 15/25.
 */
export function mcleanNeedsAttention(
  score: number,
  historyTotals: number[],
): boolean {
  if (historyTotals.length < 4) return score <= 15;
  const m = mean(historyTotals);
  const sd = stdDev(historyTotals);
  if (m == null || sd == null) return score <= 15;
  return score < m - sd;
}
