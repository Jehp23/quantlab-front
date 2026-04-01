import type { PortfolioAnalyzeResponse } from "./types";

export const GOAL_LABELS: Record<string, string> = {
  capital_preservation: "Preservar capital",
  income: "Generar ingresos",
  balanced_growth: "Crecimiento balanceado",
  long_term_growth: "Crecimiento largo plazo",
  wealth_building: "Acumular patrimonio",
};

export const LIQUIDITY_LABELS: Record<string, string> = {
  high: "Alta",
  medium: "Media",
  low: "Baja",
};

export const EXPERIENCE_LABELS: Record<string, string> = {
  none: "Sin experiencia",
  basic: "Inicial",
  intermediate: "Intermedia",
  advanced: "Avanzada",
};

const PROFILE_RETURN_ASSUMPTIONS: Record<string, number> = {
  Conservador: 0.045,
  "Moderado-Conservador": 0.06,
  Moderado: 0.075,
  "Moderado-Agresivo": 0.09,
  Agresivo: 0.105,
};

export function getGoalLabel(value?: string | null) {
  return GOAL_LABELS[value ?? ""] ?? "No especificado";
}

export function getLiquidityLabel(value?: string | null) {
  return LIQUIDITY_LABELS[value ?? ""] ?? "No especificada";
}

export function getExperienceLabel(value?: string | null) {
  return EXPERIENCE_LABELS[value ?? ""] ?? "No especificada";
}

export function getExpectedReturn(
  profileName: string,
  analyzeResult?: PortfolioAnalyzeResponse | null,
) {
  if (analyzeResult?.metrics?.annual_return) {
    return Math.max(-0.02, analyzeResult.metrics.annual_return);
  }
  return PROFILE_RETURN_ASSUMPTIONS[profileName] ?? 0.07;
}

export function futureValueWithMonthlyContributions(
  monthlyContribution: number,
  years: number,
  annualReturn: number,
) {
  const monthlyRate = annualReturn / 12;
  const periods = years * 12;
  if (periods <= 0) return 0;
  if (monthlyRate === 0) return monthlyContribution * periods;
  return (
    monthlyContribution *
    (((1 + monthlyRate) ** periods - 1) / monthlyRate)
  );
}

export function buildProjectionSeries(
  monthlyContribution: number,
  years: number,
  annualReturn: number,
) {
  const cappedYears = Math.max(1, years);
  return Array.from({ length: cappedYears + 1 }, (_, year) => ({
    year,
    value:
      year === 0
        ? 0
        : Math.round(
            futureValueWithMonthlyContributions(
              monthlyContribution,
              year,
              annualReturn,
            ),
          ),
  }));
}
