"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { portfolioApi } from "@/lib/api";
import { usePortfolioStore } from "@/lib/store";

type FlowStep =
  | {
      kind: "choice";
      id: string;
      section: "risk" | "context";
      text: string;
      options: { label: string; value: string | number }[];
    }
  | {
      kind: "number";
      id: string;
      section: "context";
      text: string;
      placeholder: string;
      min?: number;
    };

const FLOW_STEPS: FlowStep[] = [
  {
    kind: "choice",
    id: "risk_horizon",
    section: "risk",
    text: "¿Cuánto tiempo planeás mantener tu inversión?",
    options: [
      { label: "Menos de 1 año", value: 0 },
      { label: "1-3 años", value: 25 },
      { label: "3-5 años", value: 50 },
      { label: "5-10 años", value: 75 },
      { label: "Más de 10 años", value: 100 },
    ],
  },
  {
    kind: "choice",
    id: "risk_drawdown",
    section: "risk",
    text: "¿Qué harías si tu portafolio cae un 20% en un mes?",
    options: [
      { label: "Vendo todo", value: 0 },
      { label: "Vendo una parte", value: 25 },
      { label: "No hago nada", value: 50 },
      { label: "Compro un poco más", value: 75 },
      { label: "Compro todo lo que puedo", value: 100 },
    ],
  },
  {
    kind: "choice",
    id: "risk_goal_style",
    section: "risk",
    text: "¿Cuál es tu objetivo principal?",
    options: [
      { label: "Preservar capital", value: 0 },
      { label: "Ingresos estables", value: 25 },
      { label: "Crecimiento moderado", value: 50 },
      { label: "Crecimiento alto", value: 75 },
      { label: "Máximo crecimiento posible", value: 100 },
    ],
  },
  {
    kind: "choice",
    id: "risk_savings_share",
    section: "risk",
    text: "¿Cuánto de tus ahorros totales vas a invertir?",
    options: [
      { label: "Más del 80%", value: 0 },
      { label: "60-80%", value: 25 },
      { label: "40-60%", value: 50 },
      { label: "20-40%", value: 75 },
      { label: "Menos del 20%", value: 100 },
    ],
  },
  {
    kind: "choice",
    id: "risk_experience",
    section: "risk",
    text: "¿Tenés experiencia previa invirtiendo?",
    options: [
      { label: "Ninguna", value: 0 },
      { label: "Básica (bonos/plazos fijos)", value: 25 },
      { label: "Intermedia (acciones/ETFs)", value: 50 },
      { label: "Avanzada (derivados/opciones)", value: 75 },
      { label: "Profesional", value: 100 },
    ],
  },
  {
    kind: "choice",
    id: "investmentGoal",
    section: "context",
    text: "¿Qué objetivo querés priorizar con esta cartera?",
    options: [
      { label: "Preservar capital", value: "capital_preservation" },
      { label: "Generar ingresos", value: "income" },
      { label: "Crecimiento balanceado", value: "balanced_growth" },
      { label: "Crecimiento largo plazo", value: "long_term_growth" },
      { label: "Acumular patrimonio", value: "wealth_building" },
    ],
  },
  {
    kind: "choice",
    id: "horizonYears",
    section: "context",
    text: "¿Cuál es tu horizonte objetivo para esta cartera?",
    options: [
      { label: "1 año", value: 1 },
      { label: "3 años", value: 3 },
      { label: "5 años", value: 5 },
      { label: "10 años", value: 10 },
      { label: "15 años o más", value: 15 },
    ],
  },
  {
    kind: "choice",
    id: "liquidityNeed",
    section: "context",
    text: "¿Qué nivel de liquidez necesitás mantener?",
    options: [
      { label: "Alta", value: "high" },
      { label: "Media", value: "medium" },
      { label: "Baja", value: "low" },
    ],
  },
  {
    kind: "choice",
    id: "experienceLevel",
    section: "context",
    text: "¿Cómo describís tu experiencia financiera actual?",
    options: [
      { label: "Sin experiencia", value: "none" },
      { label: "Inicial", value: "basic" },
      { label: "Intermedia", value: "intermediate" },
      { label: "Avanzada", value: "advanced" },
    ],
  },
  {
    kind: "number",
    id: "monthlyContribution",
    section: "context",
    text: "¿Qué aporte mensual estimado querés destinar?",
    placeholder: "250",
    min: 0,
  },
  {
    kind: "choice",
    id: "emergencyBufferMonths",
    section: "context",
    text: "¿Cuántos meses de fondo de emergencia tenés hoy?",
    options: [
      { label: "0 meses", value: 0 },
      { label: "3 meses", value: 3 },
      { label: "6 meses", value: 6 },
      { label: "12 meses o más", value: 12 },
    ],
  },
];

const RISK_STEPS = FLOW_STEPS.filter((step) => step.section === "risk").length;

const GOAL_LABELS: Record<string, string> = {
  capital_preservation: "Preservar capital",
  income: "Generar ingresos",
  balanced_growth: "Crecimiento balanceado",
  long_term_growth: "Crecimiento largo plazo",
  wealth_building: "Acumular patrimonio",
};

const LIQUIDITY_LABELS: Record<string, string> = {
  high: "Alta",
  medium: "Media",
  low: "Baja",
};

const EXPERIENCE_LABELS: Record<string, string> = {
  none: "Sin experiencia",
  basic: "Inicial",
  intermediate: "Intermedia",
  advanced: "Avanzada",
};

export default function OnboardingPage() {
  const router = useRouter();
  const { setRiskScore, setBuildResult, setInvestorProfile } = usePortfolioStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number>>({
    investmentGoal: "balanced_growth",
    horizonYears: 5,
    liquidityNeed: "medium",
    experienceLevel: "basic",
    monthlyContribution: 250,
    emergencyBufferMonths: 3,
  });
  const [draftValue, setDraftValue] = useState("250");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const step = FLOW_STEPS[currentStep];
  const progress = ((currentStep + 1) / FLOW_STEPS.length) * 100;
  const isLastStep = currentStep === FLOW_STEPS.length - 1;
  const riskAnswers = FLOW_STEPS.filter((item) => item.section === "risk").map((item) => answers[item.id] as number).filter((value) => typeof value === "number");

  const estimatedScore = useMemo(() => {
    if (!riskAnswers.length) return null;
    return Math.round(riskAnswers.reduce((acc, value) => acc + value, 0) / riskAnswers.length);
  }, [riskAnswers]);

  async function submitAssessment(nextAnswers: Record<string, string | number>) {
    const riskValues = FLOW_STEPS
      .filter((item) => item.section === "risk")
      .map((item) => Number(nextAnswers[item.id] ?? 0));

    const score = Math.round(riskValues.reduce((acc, value) => acc + value, 0) / RISK_STEPS);

    setRiskScore(score);
    setInvestorProfile({
      investmentGoal: String(nextAnswers.investmentGoal),
      horizonYears: Number(nextAnswers.horizonYears),
      liquidityNeed: String(nextAnswers.liquidityNeed),
      experienceLevel: String(nextAnswers.experienceLevel),
      monthlyContribution: Number(nextAnswers.monthlyContribution) || 0,
      emergencyBufferMonths: Number(nextAnswers.emergencyBufferMonths),
    });

    setLoading(true);
    setError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30_000);

    const buildPromise = portfolioApi.build({
      risk_score: score,
      investment_goal: String(nextAnswers.investmentGoal),
      horizon_years: Number(nextAnswers.horizonYears),
      liquidity_need: String(nextAnswers.liquidityNeed),
      experience_level: String(nextAnswers.experienceLevel),
      monthly_contribution: Number(nextAnswers.monthlyContribution) || 0,
      emergency_buffer_months: Number(nextAnswers.emergencyBufferMonths),
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      controller.signal.addEventListener("abort", () => {
        reject(new Error("La solicitud tardó demasiado (30s). Intentá de nuevo más tarde."));
      });
    });

    try {
      const result = await Promise.race([buildPromise, timeoutPromise]);
      setBuildResult(result);
      router.push("/portfolio");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al conectar con el servidor.");
      setLoading(false);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  function handleChoiceAnswer(value: string | number) {
    const nextAnswers = { ...answers, [step.id]: value };
    setAnswers(nextAnswers);
    setError(null);

    if (isLastStep) {
      void submitAssessment(nextAnswers);
      return;
    }

    if (FLOW_STEPS[currentStep + 1]?.kind === "number") {
      const nextNumber = nextAnswers[FLOW_STEPS[currentStep + 1].id];
      setDraftValue(String(nextNumber ?? ""));
    }

    setCurrentStep((prev) => prev + 1);
  }

  function handleNumberContinue() {
    const numericValue = Math.max(0, Number(draftValue || 0));
    const nextAnswers = { ...answers, [step.id]: numericValue };
    setAnswers(nextAnswers);
    setError(null);

    if (isLastStep) {
      void submitAssessment(nextAnswers);
      return;
    }

    setCurrentStep((prev) => prev + 1);
  }

  function handleBack() {
    if (currentStep === 0) return;

    const previousStep = FLOW_STEPS[currentStep - 1];
    if (previousStep.kind === "number") {
      setDraftValue(String(answers[previousStep.id] ?? ""));
    }
    setCurrentStep((prev) => prev - 1);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] px-4">
        <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-5">
          <div className="h-12 w-12 rounded-full border-2 border-[var(--accent)]/25 border-t-[var(--accent)] animate-spin" />
          <div className="text-center">
            <p className="text-lg font-semibold text-[var(--foreground)]">Construyendo tu propuesta</p>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Estamos armando una cartera coherente con tu perfil, objetivo y horizonte.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-10">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[28px] border border-black/6 bg-white p-6 shadow-[0_20px_80px_rgba(16,24,40,0.06)] md:p-8">
          <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]/70">
                Robo Advisor
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
                Conozcamos tu perfil inversor
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
                Todo el flujo sigue el mismo formato: una pregunta, una respuesta y pasamos a la siguiente.
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--accent)]/10 bg-[var(--accent)]/[0.05] px-4 py-3 text-right">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                Avance
              </p>
              <p className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
                {currentStep + 1}/{FLOW_STEPS.length}
              </p>
            </div>
          </div>

          <div className="mb-8 h-1.5 rounded-full bg-[var(--surface-subtle)]">
            <div
              className="h-1.5 rounded-full bg-[var(--accent)] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="rounded-[24px] border border-black/6 bg-[var(--surface-subtle)] p-6 md:p-7">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
              {step.section === "risk" ? "Perfil de riesgo" : "Contexto del cliente"} · Pregunta {currentStep + 1}
            </p>
            <h2 className="mt-3 text-2xl font-semibold leading-tight text-[var(--foreground)]">
              {step.text}
            </h2>

            {step.kind === "choice" ? (
              <div className="mt-6 space-y-3">
                {step.options.map((option, index) => (
                  <button
                    type="button"
                    key={String(option.value)}
                    onClick={() => handleChoiceAnswer(option.value)}
                    className="group flex w-full items-center gap-4 rounded-2xl border border-black/7 bg-white px-5 py-4 text-left transition-all hover:border-[var(--accent)]/25 hover:bg-[var(--accent)]/[0.03]"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/10 text-xs font-semibold text-[var(--muted-foreground)] transition-colors group-hover:border-[var(--accent)]/30 group-hover:text-[var(--accent)]">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="text-sm font-medium text-[var(--foreground)]">{option.label}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-6">
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleNumberContinue();
                  }}
                >
                  <input
                    type="number"
                    min={step.min ?? 0}
                    inputMode="numeric"
                    value={draftValue}
                    onChange={(event) => setDraftValue(event.target.value)}
                    className="w-full rounded-2xl border border-black/8 bg-white px-4 py-4 text-base text-[var(--foreground)] outline-none transition-colors focus:border-[var(--accent)]/30"
                    placeholder={step.placeholder}
                  />
                  <p className="mt-3 text-xs text-[var(--muted-foreground)]">
                    Presioná `Enter` o usá el botón para seguir.
                  </p>
                  <button
                    type="submit"
                    className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-[#1f4d3a] bg-[#1f4d3a] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#183b2d]"
                  >
                    {isLastStep ? "Construir propuesta" : "Continuar a la siguiente pregunta"}
                  </button>
                </form>
              </div>
            )}

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

            <div className="mt-6 flex items-center justify-between border-t border-black/6 pt-4">
              <button
                type="button"
                onClick={handleBack}
                disabled={currentStep === 0}
                className="rounded-xl border border-black/8 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-[var(--accent)]/20 hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Anterior
              </button>
              <span className="text-xs text-[var(--muted-foreground)]">
                {step.section === "risk" ? "Evaluando tolerancia al riesgo" : "Completando suitability"}
              </span>
            </div>
          </div>
        </section>

        <aside className="space-y-5">
          <div className="rounded-[28px] border border-black/6 bg-white p-6 shadow-[0_20px_80px_rgba(16,24,40,0.05)]">
            <h3 className="text-lg font-semibold text-[var(--foreground)]">Estado del flujo</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
              Primero construimos el perfil de riesgo y después completamos el contexto del cliente, sin cambiar el formato.
            </p>

            <div className="mt-6 space-y-3">
              <div className={`rounded-2xl border px-4 py-3 ${step.section === "risk" ? "border-[var(--accent)]/20 bg-[var(--accent)]/[0.05]" : "border-black/8 bg-[var(--surface-subtle)]"}`}>
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Perfil de riesgo</p>
                <p className="mt-1 text-sm font-medium text-[var(--foreground)]">
                  {Math.min(currentStep + 1, RISK_STEPS)}/{RISK_STEPS} respuestas
                </p>
              </div>
              <div className={`rounded-2xl border px-4 py-3 ${step.section === "context" ? "border-[var(--accent)]/20 bg-[var(--accent)]/[0.05]" : "border-black/8 bg-[var(--surface-subtle)] opacity-60"}`}>
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Contexto del cliente</p>
                <p className="mt-1 text-sm font-medium text-[var(--foreground)]">
                  {Math.max(0, currentStep + 1 - RISK_STEPS)}/{FLOW_STEPS.length - RISK_STEPS} respuestas
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-black/6 bg-white p-6 shadow-[0_20px_80px_rgba(16,24,40,0.05)]">
            <h3 className="text-lg font-semibold text-[var(--foreground)]">Resumen en vivo</h3>
            <div className="mt-5 grid gap-3">
              <div className="rounded-2xl bg-[var(--surface-subtle)] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Score estimado</p>
                <p className="mt-2 text-3xl font-semibold text-[var(--foreground)]">
                  {estimatedScore ?? "—"}
                </p>
              </div>
              <div className="rounded-2xl bg-[var(--surface-subtle)] p-4 text-sm leading-6 text-[var(--muted-foreground)]">
                <p>
                  Objetivo:{" "}
                  <span className="font-medium text-[var(--foreground)]">
                    {GOAL_LABELS[String(answers.investmentGoal)]}
                  </span>
                </p>
                <p>
                  Horizonte:{" "}
                  <span className="font-medium text-[var(--foreground)]">{String(answers.horizonYears)} años</span>
                </p>
                <p>
                  Liquidez:{" "}
                  <span className="font-medium text-[var(--foreground)]">
                    {LIQUIDITY_LABELS[String(answers.liquidityNeed)]}
                  </span>
                </p>
                <p>
                  Experiencia:{" "}
                  <span className="font-medium text-[var(--foreground)]">
                    {EXPERIENCE_LABELS[String(answers.experienceLevel)]}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
