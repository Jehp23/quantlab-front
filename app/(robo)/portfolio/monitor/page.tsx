"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePortfolioStore } from "@/lib/store";
import {
  buildProjectionSeries,
  futureValueWithMonthlyContributions,
  getExpectedReturn,
  getGoalLabel,
  getLiquidityLabel,
} from "@/lib/robo-advisor";

function buildBand(weight: number) {
  if (weight >= 0.2) return 0.05;
  if (weight >= 0.1) return 0.04;
  return 0.03;
}

export default function PortfolioMonitorPage() {
  const router = useRouter();
  const { buildResult, investorProfile, analyzeResult, recommendationHistory } = usePortfolioStore();

  useEffect(() => {
    if (!buildResult) {
      router.replace("/onboarding");
    }
  }, [buildResult, router]);

  if (!buildResult) return null;

  const positions = Object.entries(buildResult.etf_weights)
    .sort(([, a], [, b]) => b - a)
    .map(([ticker, weight]) => {
      const band = buildBand(weight);
      return {
        ticker,
        target: weight,
        min: Math.max(0, weight - band),
        max: Math.min(1, weight + band),
      };
    });

  const contribution = buildResult.investor_context.monthly_contribution ?? investorProfile.monthlyContribution ?? 0;
  const yearlyContribution = contribution * 12;
  const horizonYears = buildResult.investor_context.horizon_years ?? investorProfile.horizonYears ?? 0;
  const emergencyBuffer = buildResult.investor_context.emergency_buffer_months ?? investorProfile.emergencyBufferMonths ?? 0;
  const expectedReturn = getExpectedReturn(buildResult.profile_name, analyzeResult);
  const goalCapital = futureValueWithMonthlyContributions(contribution, horizonYears || 1, expectedReturn);
  const projectionSeries = buildProjectionSeries(contribution, horizonYears || 1, expectedReturn);
  const profileReviewCadence = horizonYears >= 10 ? "Semestral" : "Trimestral";
  const rebalanceCadence = contribution > 0 ? "Mensual con bandas" : "Trimestral con bandas";
  const concentrationCap = positions[0] ? `${Math.round((positions[0].target + 0.05) * 100)}%` : "25%";

  const triggers = [
    `Revisar rebalanceo cuando una posición salga de su banda objetivo o una clase de activo se desvíe más de 5 puntos.`,
    `Actualizar el perfil si cambian objetivo, horizonte o liquidez. Cadencia sugerida: ${profileReviewCadence.toLowerCase()}.`,
    contribution > 0
      ? `Configurar aporte automático de $${yearlyContribution.toLocaleString()} al año para reducir timing risk.`
      : "Definir un plan de aportes automáticos para convertir la propuesta en hábito de inversión.",
    emergencyBuffer < 3
      ? "Antes de aumentar riesgo, reforzar el fondo de emergencia a por lo menos 3 meses."
      : `El fondo de emergencia informado (${emergencyBuffer} meses) permite sostener una cartera con menor necesidad de liquidez.`,
  ];

  const playbook = [
    "Confirmar que la tolerancia a drawdown sigue vigente antes de rebalancear.",
    "Priorizar aportes nuevos para corregir desvíos antes de vender posiciones.",
    "Explicar siempre costo, riesgo esperado y horizonte recomendado al cliente.",
    "Registrar por qué se mantuvo o modificó la cartera en cada revisión.",
  ];

  const goalProgressNotes = [
    `Capital potencial a ${horizonYears || 1} años: $${Math.round(goalCapital).toLocaleString()}.`,
    contribution > 0
      ? `Cada aumento de $100/mes agrega aproximadamente $${Math.round(futureValueWithMonthlyContributions(100, horizonYears || 1, expectedReturn)).toLocaleString()} al horizonte actual.`
      : "Sin aportes periódicos la estrategia depende totalmente del capital inicial, todavía no informado.",
    `Hipótesis base para seguimiento: ${(expectedReturn * 100).toFixed(1)}% anual.`,
  ];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link href="/portfolio" className="mb-3 inline-flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-gray-600">
              ← Volver a la propuesta
            </Link>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]/70">
              Seguimiento operativo
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
              Monitoreo y rebalanceo
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500">
              Esta vista traduce la propuesta en reglas operativas para que el broker pueda hacer seguimiento,
              priorizar alertas y documentar decisiones.
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--accent)]/10 bg-[var(--accent)]/[0.05] px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.16em] text-gray-500">Perfil actual</p>
            <p className="mt-1 text-xl font-semibold text-gray-900">{buildResult.profile_name}</p>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <CardStat label="Cadencia de rebalanceo" value={rebalanceCadence} detail={buildResult.rebalance_policy} />
          <CardStat label="Revisión de perfil" value={profileReviewCadence} detail="Cuando cambien objetivo, liquidez o situación financiera." />
          <CardStat label="Aportes anuales" value={`$${yearlyContribution.toLocaleString()}`} detail="Basado en el monto mensual informado." />
          <CardStat label="Concentración máxima" value={concentrationCap} detail="Umbral sugerido por posición para evitar dependencia excesiva." />
        </div>

        <div className="mb-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-3xl border border-black/6 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Bandas de rebalanceo por posición</h2>
              <p className="mt-1 text-sm text-gray-500">
                Regla simple y defendible para una primera versión institucional del robo advisor.
              </p>
            </div>
            <div className="space-y-3">
              {positions.map((position) => (
                <div key={position.ticker} className="rounded-2xl border border-black/6 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{position.ticker}</p>
                      <p className="text-xs uppercase tracking-[0.14em] text-gray-500">Banda objetivo</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">{(position.target * 100).toFixed(0)}%</p>
                      <p className="text-xs text-gray-500">
                        {(position.min * 100).toFixed(0)}% a {(position.max * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                  <div className="relative h-2 rounded-full bg-[var(--surface-subtle)]">
                    <div
                      className="absolute top-0 h-2 rounded-full bg-[var(--accent)]/18"
                      style={{
                        left: `${position.min * 100}%`,
                        width: `${Math.max((position.max - position.min) * 100, 4)}%`,
                      }}
                    />
                    <div
                      className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-white bg-[var(--accent)] shadow-sm"
                      style={{ left: `calc(${position.target * 100}% - 8px)` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-3xl border border-black/6 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Ficha del cliente</h2>
              <div className="mt-4 space-y-3 text-sm">
                <InfoRow label="Objetivo" value={getGoalLabel(buildResult.investor_context.investment_goal)} />
                <InfoRow label="Horizonte" value={`${horizonYears || "—"} años`} />
                <InfoRow label="Liquidez" value={getLiquidityLabel(buildResult.investor_context.liquidity_need)} />
                <InfoRow label="Fondo de emergencia" value={`${emergencyBuffer} meses`} />
              </div>
            </div>

            <div className="rounded-3xl border border-black/6 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Alertas prioritarias</h2>
              <div className="mt-4 space-y-3">
                {triggers.map((trigger) => (
                  <div key={trigger} className="rounded-2xl bg-[var(--surface-subtle)] px-4 py-3 text-sm leading-6 text-gray-600">
                    {trigger}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-3xl border border-black/6 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Playbook para el asesor</h2>
            <div className="mt-4 space-y-3">
              {playbook.map((step, index) => (
                <div key={step} className="flex gap-3 rounded-2xl border border-black/6 px-4 py-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/[0.08] text-xs font-semibold text-[var(--accent)]">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-6 text-gray-600">{step}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-black/6 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Progreso hacia objetivo</h2>
            <div className="mt-4 rounded-2xl bg-[var(--surface-subtle)] p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-gray-500">Objetivo monitoreado</p>
              <p className="mt-2 text-lg font-semibold text-gray-900">{getGoalLabel(buildResult.investor_context.investment_goal)}</p>
              <p className="mt-1 text-sm text-gray-500">Horizonte: {horizonYears || "—"} años · aporte: ${contribution.toLocaleString()}/mes</p>
            </div>
            <div className="mt-4 space-y-3">
              {goalProgressNotes.map((note) => (
                <div key={note} className="rounded-2xl border border-black/6 px-4 py-3 text-sm leading-6 text-gray-600">
                  {note}
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-2xl border border-black/6 p-4">
              <MiniProjection data={projectionSeries} />
            </div>
          </section>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border border-black/6 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Bitácora de decisiones</h2>
            <div className="mt-4 space-y-3">
              {recommendationHistory.map((entry) => (
                <div key={entry.id} className="rounded-2xl border border-black/6 px-4 py-4">
                  <p className="text-sm font-semibold text-gray-900">{entry.profile_name} · {getGoalLabel(entry.investment_goal)}</p>
                  <p className="mt-1 text-sm text-gray-500">{entry.note}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.14em] text-gray-400">
                    score {entry.risk_score}/100 · {new Date(entry.created_at).toLocaleDateString("es-AR")}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-black/6 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Próximas extensiones del producto</h2>
            <div className="mt-4 grid gap-3">
              <ActionCard
                title="Aportes y retiros"
                description="Simular cashflows reales y usar aportes nuevos para rebalancear sin vender."
              />
              <ActionCard
                title="Alertas automáticas"
                description="Notificar desvíos de pesos, cambios de volatilidad y revisión anual del perfil."
              />
              <ActionCard
                title="Objetivos financieros"
                description="Separar carteras por meta: retiro, vivienda, liquidez o crecimiento."
              />
              <ActionCard
                title="Bitácora de decisiones"
                description="Guardar rationale y cambios de cartera para auditoría y compliance."
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function CardStat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-3xl border border-black/6 bg-white p-5 shadow-sm">
      <p className="text-xs uppercase tracking-[0.16em] text-gray-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-gray-900">{value}</p>
      <p className="mt-2 text-sm leading-6 text-gray-500">{detail}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-[var(--surface-subtle)] px-4 py-3">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}

function ActionCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-black/6 p-4">
      <p className="text-sm font-semibold text-gray-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-gray-500">{description}</p>
    </div>
  );
}

function MiniProjection({ data }: { data: { year: number; value: number }[] }) {
  return (
    <div className="space-y-3">
      {data.slice(1).map((point) => (
        <div key={point.year}>
          <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
            <span>Año {point.year}</span>
            <span>${point.value.toLocaleString()}</span>
          </div>
          <div className="h-2 rounded-full bg-[var(--surface-subtle)]">
            <div
              className="h-2 rounded-full bg-[var(--accent)]/70"
              style={{ width: `${Math.min((point.year / data[data.length - 1].year) * 100, 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
