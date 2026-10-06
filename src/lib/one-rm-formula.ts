/**
 * Évaluateur sûr de formules 1RM.
 * Variables autorisées : poids, weight, reps.
 * Opérateurs : + - * / ( ) et nombres décimaux.
 */

const ALLOWED_IDENTIFIERS = new Set(["poids", "weight", "reps"]);

export type OneRmVariables = {
  poids: number;
  weight: number;
  reps: number;
};

export type FormulaValidation =
  | { ok: true; tokens: Token[] }
  | { ok: false; error: string };

type Token =
  | { type: "number"; value: number }
  | { type: "ident"; value: string }
  | { type: "op"; value: "+" | "-" | "*" | "/" }
  | { type: "lparen" }
  | { type: "rparen" };

function tokenize(formula: string): { tokens: Token[]; error: string | null } {
  const tokens: Token[] = [];
  let i = 0;
  const src = formula.trim();

  while (i < src.length) {
    const ch = src[i];
    if (/\s/.test(ch)) {
      i += 1;
      continue;
    }
    if (ch === "(") {
      tokens.push({ type: "lparen" });
      i += 1;
      continue;
    }
    if (ch === ")") {
      tokens.push({ type: "rparen" });
      i += 1;
      continue;
    }
    if ("+-*/".includes(ch)) {
      tokens.push({ type: "op", value: ch as "+" | "-" | "*" | "/" });
      i += 1;
      continue;
    }
    if (/[0-9.]/.test(ch)) {
      let j = i + 1;
      while (j < src.length && /[0-9.]/.test(src[j])) j += 1;
      const raw = src.slice(i, j);
      const value = Number(raw);
      if (!Number.isFinite(value)) {
        return { tokens: [], error: `Nombre invalide : ${raw}` };
      }
      tokens.push({ type: "number", value });
      i = j;
      continue;
    }
    if (/[a-zA-Z_]/.test(ch)) {
      let j = i + 1;
      while (j < src.length && /[a-zA-Z0-9_]/.test(src[j])) j += 1;
      const ident = src.slice(i, j).toLowerCase();
      if (!ALLOWED_IDENTIFIERS.has(ident)) {
        return {
          tokens: [],
          error: `Variable inconnue : ${ident}. Utilise poids, weight ou reps.`,
        };
      }
      tokens.push({ type: "ident", value: ident });
      i = j;
      continue;
    }
    return { tokens: [], error: `Caractère non autorisé : ${ch}` };
  }

  return { tokens, error: null };
}

/** Valide la syntaxe sans évaluer. Chaîne vide = OK (formule absente). */
export function validateOneRmFormula(formula: string | null | undefined): FormulaValidation {
  const trimmed = (formula ?? "").trim();
  if (!trimmed) return { ok: true, tokens: [] };

  const { tokens, error } = tokenize(trimmed);
  if (error) return { ok: false, error };

  try {
    // Dry-run avec valeurs factices pour vérifier la structure
    evaluateTokens(tokens, { poids: 1, weight: 1, reps: 1 });
    return { ok: true, tokens };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Formule invalide",
    };
  }
}

export function evaluateOneRmFormula(
  formula: string | null | undefined,
  vars: { weight: number; reps: number },
): number | null {
  const trimmed = (formula ?? "").trim();
  if (!trimmed) return null;
  if (!Number.isFinite(vars.weight) || !Number.isFinite(vars.reps)) return null;
  if (vars.weight <= 0 || vars.reps <= 0) return null;

  const validation = validateOneRmFormula(trimmed);
  if (!validation.ok) return null;

  try {
    const result = evaluateTokens(validation.tokens, {
      poids: vars.weight,
      weight: vars.weight,
      reps: vars.reps,
    });
    if (!Number.isFinite(result) || result <= 0) return null;
    return Math.round(result * 10) / 10;
  } catch {
    return null;
  }
}

/**
 * Choisit la meilleure série pour estimer le 1RM :
 * dernière série complétée avec poids+reps, sinon meilleure (charge×reps max).
 */
export function pickSetForOneRm(
  sets: Array<{ weight_kg: number | null; reps: number | null; completed?: boolean }>,
): { weight: number; reps: number } | null {
  const usable = sets.filter(
    (s) =>
      s.weight_kg != null &&
      s.reps != null &&
      Number.isFinite(s.weight_kg) &&
      Number.isFinite(s.reps) &&
      s.weight_kg > 0 &&
      s.reps > 0,
  );
  if (usable.length === 0) return null;

  const completed = usable.filter((s) => s.completed);
  const pool = completed.length > 0 ? completed : usable;
  const last = pool[pool.length - 1];
  if (last.weight_kg != null && last.reps != null) {
    return { weight: last.weight_kg, reps: last.reps };
  }
  return null;
}

/** % de 1RM pour une charge donnée (1 décimale). */
export function percentOfOneRm(
  weightKg: number,
  oneRmKg: number,
): number | null {
  if (!(weightKg > 0) || !(oneRmKg > 0)) return null;
  return Math.round((weightKg / oneRmKg) * 1000) / 10;
}

/** Charge cible depuis un % 1RM (arrondi au 0,5 kg). */
export function weightFromPercentOneRm(
  percent: number,
  oneRmKg: number,
): number | null {
  if (!(percent > 0) || !(oneRmKg > 0)) return null;
  return Math.round((oneRmKg * percent) / 100 / 0.5) * 0.5;
}

/** Meilleure 1RM estimée parmi des séries (max). */
export function bestEstimatedOneRm(
  formula: string | null | undefined,
  sets: Array<{ weight_kg: number | null; reps: number | null }>,
): number | null {
  let best: number | null = null;
  for (const set of sets) {
    if (set.weight_kg == null || set.reps == null) continue;
    const estimated = evaluateOneRmFormula(formula, {
      weight: set.weight_kg,
      reps: set.reps,
    });
    if (estimated != null && (best == null || estimated > best)) {
      best = estimated;
    }
  }
  return best;
}

function evaluateTokens(tokens: Token[], vars: OneRmVariables): number {
  let pos = 0;

  function peek(): Token | undefined {
    return tokens[pos];
  }

  function consume(): Token {
    const t = tokens[pos];
    if (!t) throw new Error("Expression incomplète");
    pos += 1;
    return t;
  }

  function parseExpression(): number {
    let left = parseTerm();
    while (
      peek()?.type === "op" &&
      ((peek() as { value: string }).value === "+" ||
        (peek() as { value: string }).value === "-")
    ) {
      const op = (consume() as { type: "op"; value: "+" | "-" }).value;
      const right = parseTerm();
      left = op === "+" ? left + right : left - right;
    }
    return left;
  }

  function parseTerm(): number {
    let left = parseUnary();
    while (
      peek()?.type === "op" &&
      ((peek() as { value: string }).value === "*" ||
        (peek() as { value: string }).value === "/")
    ) {
      const op = (consume() as { type: "op"; value: "*" | "/" }).value;
      const right = parseUnary();
      if (op === "/") {
        if (right === 0) throw new Error("Division par zéro");
        left = left / right;
      } else {
        left = left * right;
      }
    }
    return left;
  }

  function parseUnary(): number {
    if (peek()?.type === "op" && (peek() as { value: string }).value === "-") {
      consume();
      return -parseUnary();
    }
    if (peek()?.type === "op" && (peek() as { value: string }).value === "+") {
      consume();
      return parseUnary();
    }
    return parsePrimary();
  }

  function parsePrimary(): number {
    const t = peek();
    if (!t) throw new Error("Expression incomplète");
    if (t.type === "number") {
      consume();
      return t.value;
    }
    if (t.type === "ident") {
      consume();
      return vars[t.value as keyof OneRmVariables];
    }
    if (t.type === "lparen") {
      consume();
      const value = parseExpression();
      if (peek()?.type !== "rparen") throw new Error("Parenthèse fermante manquante");
      consume();
      return value;
    }
    throw new Error("Expression invalide");
  }

  const result = parseExpression();
  if (pos < tokens.length) throw new Error("Caractères en trop dans la formule");
  return result;
}
