"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePortfolioStore } from "@/lib/store";
import {
  getExpectedReturn,
  getGoalLabel,
  getLiquidityLabel,
  getExperienceLabel,
  futureValueWithMonthlyContributions,
} from "@/lib/robo-advisor";

const ETF_INFO: Record<string, { name: string; assetClass: string }> = {
  SPY: { name: "S&P 500", assetClass: "Renta Variable" },
  QQQ: { name: "Nasdaq 100", assetClass: "Renta Variable" },
  EFA: { name: "MSCI EAFE", assetClass: "Renta Variable" },
  EEM: { name: "MSCI Emerging Markets", assetClass: "Renta Variable" },
  AGG: { name: "US Aggregate Bond", assetClass: "Renta Fija" },
  LQD: { name: "Corporate Bonds IG", assetClass: "Renta Fija" },
  TLT: { name: "Treasury 20+ años", assetClass: "Renta Fija" },
  GLD: { name: "Oro", assetClass: "Alternativo" },
  VNQ: { name: "Real Estate", assetClass: "Alternativo" },
  BIL: { name: "T-Bills", assetClass: "Cash" },
  DJP: { name: "Bloomberg Commodities", assetClass: "Alternativo" },
  ACWI: { name: "All Country World Index", assetClass: "Renta Variable" },
};

function formatDate(ts: number) {
  return new Date(ts).toLocaleString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PortfolioProposalPage() {
  const router = useRouter();
  const { buildResult, analyzeResult, investorProfile, recommendationHistory } = usePortfolioStore();

  useEffect(() => {
    if (!buildResult) {
      router.replace("/onboarding");
    }
  }, [buildResult, router]);

  if (!buildResult) return null;

  const horizonYears = (buildResult.investor_context.horizon_years ?? investorProfile.horizonYears ?? 5) as number;
  const monthlyContribution = (buildResult.investor_context.monthly_contribution ?? investorProfile.monthlyContribution ?? 0) as number;
  const expectedReturn = getExpectedReturn(buildResult.profile_name, analyzeResult);
  const targetCapital = futureValueWithMonthlyContributions(monthlyContribution, horizonYears, expectedReturn);
  const managementFee = 0.012;
  const custodyFee = 0.0025;
  const totalAnnualFee = managementFee + custodyFee;
  const estimatedNetReturn = Math.max(expectedReturn - totalAnnualFee, 0);
  const worstCaseDrawdown = analyzeResult?.metrics.max_drawdown ?? -0.18;
  const volatility = analyzeResult?.metrics.sigma ?? 0.12;
  const latestRecommendation = recommendationHistory[0];
  const etfEntries = Object.entries(buildResult.etf_weights).sort((a, b) => b[1] - a[1]);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <Link href="/portfolio" className="mb-3 inline-flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-gray-600">
              ← Volver a la propuesta
            </Link>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]/70">
              Propuesta institucional
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
              Resumen ejecutivo de cartera
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500">
              Formato pensado para presentar internamente o compartir como base comercial con el cliente.
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-xl border border-black/8 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-[var(--accent)]/20 hover:text-[var(--accent)]"
          >
            Imprimir / PDF
          </button>
        </div>

        <div className="rounded-[28px] border border-black/6 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-6 border-b border-black/6 pb-8 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]/65">
                QuantLab Wealth
              </p>
              <h2 className="mt-3 text-4xl font-semibold tracking-tight text-gray-900">
                {buildResult.profile_name}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">
                {buildResult.description}
              </p>
            </div>
            <div className="rounded-2xl bg-[var(--surface-subtle)] px-5 py-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-gray-500">Versión de propuesta</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                {latestRecommendation ? formatDate(latestRecommendation.created_at) : formatDate(Date.now())}
              </p>
            </div>
          </div>

          <div className="grid gap-4 border-b border-black/6 py-8 md:grid-cols-4">
            <SummaryStat label="Objetivo" value={getGoalLabel(buildResult.investor_context.investment_goal)} />
            <SummaryStat label="Horizonte" value={`${horizonYears} años`} />
            <SummaryStat label="Liquidez" value={getLiquidityLabel(buildResult.investor_context.liquidity_need)} />
            <SummaryStat label="Experiencia" value={getExperienceLabel(buildResult.investor_context.experience_level)} />
          </div>

          <div className="grid gap-8 border-b border-black/6 py-8 lg:grid-cols-[1.05fr_0.95fr]">
            <section>
              <h3 className="text-base font-semibold text-gray-900">Tesis de inversión</h3>
              <div className="mt-4 space-y-3">
                {buildResult.suitability.map((item) => (
                  <div key={item} className="rounded-2xl bg-[var(--surface-subtle)] px-4 py-3 text-sm leading-6 text-gray-600">
                    {item}
                  </div>
                ))}
              </div>

              <h4 className="mt-6 text-sm font-semibold text-gray-900">Racional de cartera</h4>
              <div className="mt-3 space-y-3">
                {buildResult.rationale.map((item) => (
                  <p key={item} className="text-sm leading-6 text-gray-600">
                    {item}
                  </p>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-base font-semibold text-gray-900">Indicadores esperados</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <MetricCard label="Retorno esperado bruto" value={`${(expectedReturn * 100).toFixed(1)}%`} detail="Hipótesis anual base" />
                <MetricCard label="Retorno estimado neto" value={`${(estimatedNetReturn * 100).toFixed(1)}%`} detail="Luego de fee anual estimado" />
                <MetricCard label="Volatilidad esperada" value={`${(volatility * 100).toFixed(1)}%`} detail="Basada en histórico" />
                <MetricCard label="Drawdown de referencia" value={`${(worstCaseDrawdown * 100).toFixed(1)}%`} detail="Caída histórica orientativa" />
              </div>

              <div className="mt-6 rounded-2xl border border-black/6 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-gray-500">Proyección por aportes</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">${Math.round(targetCapital).toLocaleString()}</p>
                <p className="mt-1 text-sm leading-6 text-gray-500">
                  Capital potencial a {horizonYears} años con aportes de ${monthlyContribution.toLocaleString()}/mes.
                </p>
              </div>
            </section>
          </div>

          <div className="grid gap-8 border-b border-black/6 py-8 lg:grid-cols-[1fr_1fr]">
            <section>
              <h3 className="text-base font-semibold text-gray-900">Asignación propuesta</h3>
              <div className="mt-4 space-y-3">
                {etfEntries.map(([ticker, weight]) => (
                  <div key={ticker} className="flex items-center justify-between rounded-2xl border border-black/6 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{ticker}</p>
                      <p className="text-sm text-gray-500">{ETF_INFO[ticker]?.name ?? ticker}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{(weight * 100).toFixed(0)}%</p>
                      <p className="text-xs text-gray-500">{ETF_INFO[ticker]?.assetClass ?? "ETF"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-base font-semibold text-gray-900">Costos estimados</h3>
              <div className="mt-4 space-y-3">
                <CostRow label="Fee de gestión sugerido" value={`${(managementFee * 100).toFixed(2)}%`} />
                <CostRow label="Custodia / operativa estimada" value={`${(custodyFee * 100).toFixed(2)}%`} />
                <CostRow label="Costo anual total estimado" value={`${(totalAnnualFee * 100).toFixed(2)}%`} strong />
              </div>

              <div className="mt-6 rounded-2xl bg-[var(--surface-subtle)] p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-gray-500">Política de servicio</p>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  {buildResult.rebalance_policy}
                </p>
              </div>

              <div className="mt-6 rounded-2xl border border-black/6 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-gray-500">Siguiente mejor acción</p>
                <div className="mt-3 space-y-2">
                  {buildResult.next_steps.map((step) => (
                    <p key={step} className="text-sm leading-6 text-gray-600">
                      {step}
                    </p>
                  ))}
                </div>
              </div>
            </section>
          </div>

          <div className="grid gap-8 pt-8 lg:grid-cols-[1fr_1fr]">
            <section>
              <h3 className="text-base font-semibold text-gray-900">Observaciones de suitability</h3>
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl bg-[var(--surface-subtle)] px-4 py-3 text-sm leading-6 text-gray-600">
                  Objetivo declarado: {getGoalLabel(buildResult.investor_context.investment_goal)}.
                </div>
                <div className="rounded-2xl bg-[var(--surface-subtle)] px-4 py-3 text-sm leading-6 text-gray-600">
                  Liquidez objetivo: {getLiquidityLabel(buildResult.investor_context.liquidity_need)}.
                </div>
                <div className="rounded-2xl bg-[var(--surface-subtle)] px-4 py-3 text-sm leading-6 text-gray-600">
                  Aporte mensual declarado: ${monthlyContribution.toLocaleString()}.
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-base font-semibold text-gray-900">Disclosure</h3>
              <div className="mt-4 space-y-3 text-sm leading-6 text-gray-600">
                <p>Esta propuesta es ilustrativa y se basa en información declarada por el cliente al momento del onboarding.</p>
                <p>Los retornos, volatilidad y drawdowns son referencias históricas o supuestos de trabajo, y no garantizan resultados futuros.</p>
                <p>La recomendación debe revisarse si cambian objetivo, horizonte, liquidez, ingresos o tolerancia al riesgo.</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[var(--surface-subtle)] p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-gray-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-black/6 p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-gray-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-gray-900">{value}</p>
      <p className="mt-1 text-xs text-gray-500">{detail}</p>
    </div>
  );
}

function CostRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-black/6 px-4 py-3">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm ${strong ? "font-semibold text-gray-900" : "font-medium text-gray-900"}`}>
        {value}
      </span>
    </div>
  );
}
