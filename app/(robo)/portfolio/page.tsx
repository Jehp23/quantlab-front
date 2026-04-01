"use client";

import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { usePortfolioStore } from "@/lib/store";
import { portfolioApi } from "@/lib/api";
import type { PortfolioAnalyzeResponse, EquityCurveResponse } from "@/lib/types";
import {
  getExpectedReturn,
  getGoalLabel,
  getLiquidityLabel,
  buildProjectionSeries,
  futureValueWithMonthlyContributions,
} from "@/lib/robo-advisor";

// ── Constantes ──────────────────────────────────────────────────────────────

const ETF_INFO: Record<string, { name: string; assetClass: string }> = {
  SPY:  { name: "S&P 500",                   assetClass: "Renta Variable" },
  QQQ:  { name: "Nasdaq 100",                 assetClass: "Renta Variable" },
  EFA:  { name: "MSCI EAFE",                  assetClass: "Renta Variable" },
  EEM:  { name: "MSCI Emerging Markets",      assetClass: "Renta Variable" },
  AGG:  { name: "US Aggregate Bond",          assetClass: "Renta Fija"     },
  LQD:  { name: "Corporate Bonds IG",         assetClass: "Renta Fija"     },
  TLT:  { name: "Treasury 20+ años",          assetClass: "Renta Fija"     },
  GLD:  { name: "Oro (Gold)",                 assetClass: "Alternativo"    },
  VNQ:  { name: "Real Estate (REITs)",        assetClass: "Alternativo"    },
  BIL:  { name: "T-Bills 1-3 meses",          assetClass: "Cash"           },
  DJP:  { name: "Bloomberg Commodities",      assetClass: "Alternativo"    },
  ACWI: { name: "All Country World Index",    assetClass: "Renta Variable" },
};

const PIE_COLORS: Record<string, string> = {
  renta_variable: "#3b82f6",
  renta_fija:     "#22c55e",
  alternativo:    "#f59e0b",
  cash:           "#94a3b8",
};

const PIE_LABELS: Record<string, string> = {
  renta_variable: "Renta Variable",
  renta_fija:     "Renta Fija",
  alternativo:    "Alternativo",
  cash:           "Cash",
};

const PROFILE_COLORS: Record<string, string> = {
  "Conservador":          "bg-green-100 text-green-800",
  "Moderado-Conservador": "bg-lime-100 text-lime-800",
  "Moderado":             "bg-yellow-100 text-yellow-800",
  "Moderado-Agresivo":    "bg-orange-100 text-orange-800",
  "Agresivo":             "bg-red-100 text-red-800",
};

const METRICS_CONFIG = [
  {
    key: "annual_return" as const,
    label: "Retorno Anual",
    format: (v: number) => `${v >= 0 ? "+" : ""}${(v * 100).toFixed(1)}%`,
    tooltip: "Retorno histórico anualizado del portafolio en el período seleccionado. Calculado como el retorno geométrico compuesto.",
    color: (v: number) => v >= 0 ? "text-green-600" : "text-red-600",
  },
  {
    key: "sigma" as const,
    label: "Volatilidad Anual",
    format: (v: number) => `${(v * 100).toFixed(1)}%`,
    tooltip: "Desviación estándar de retornos anualizados. Mide qué tan 'movido' es el portafolio. Mayor volatilidad = mayor incertidumbre.",
    color: () => "text-gray-900",
  },
  {
    key: "sharpe" as const,
    label: "Sharpe Ratio",
    format: (v: number) => v.toFixed(2),
    tooltip: "Retorno excedente por unidad de riesgo (vs tasa libre de riesgo ~5%). >1 es bueno, >2 es excelente.",
    color: (v: number) => v >= 1 ? "text-green-600" : v >= 0.5 ? "text-yellow-600" : "text-red-600",
  },
  {
    key: "sortino" as const,
    label: "Sortino Ratio",
    format: (v: number) => v.toFixed(2),
    tooltip: "Como el Sharpe, pero solo penaliza la volatilidad negativa (caídas). Es una medida más justa para estrategias asimétricas.",
    color: (v: number) => v >= 1 ? "text-green-600" : v >= 0.5 ? "text-yellow-600" : "text-red-600",
  },
  {
    key: "max_drawdown" as const,
    label: "Máx. Drawdown",
    format: (v: number) => `${(v * 100).toFixed(1)}%`,
    tooltip: "La peor caída desde un pico histórico. Cuánto podrías haber perdido si comprabas en el peor momento posible.",
    color: () => "text-red-600",
  },
  {
    key: "var_95" as const,
    label: "VaR 95% (diario)",
    format: (v: number) => `${(v * 100).toFixed(2)}%`,
    tooltip: "En el 95% de los días, la pérdida no superará este porcentaje. Supone distribución normal de retornos.",
    color: () => "text-orange-600",
  },
];

// ── Componentes internos ─────────────────────────────────────────────────────

function MetricTooltip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex items-center ml-1.5 cursor-help">
      <span className="w-4 h-4 rounded-full border border-gray-300 text-gray-400 text-[10px] font-bold flex items-center justify-center hover:border-blue-400 hover:text-blue-500 transition-colors">
        ?
      </span>
      <span className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 w-60 bg-gray-800 text-white text-xs p-2.5 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-20 leading-relaxed">
        {text}
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45" />
      </span>
    </span>
  );
}

function correlationColor(value: number): { bg: string; text: string } {
  if (value >= 0) {
    const t = value;
    const r = Math.round(255 + (30 - 255) * t);
    const g = Math.round(255 + (64 - 255) * t);
    const b = Math.round(255 + (175 - 255) * t);
    return { bg: `rgb(${r},${g},${b})`, text: t > 0.5 ? "#fff" : "#111" };
  } else {
    const t = Math.abs(value);
    const r = Math.round(255 + (220 - 255) * t);
    const g = Math.round(255 + (38 - 255) * t);
    const b = Math.round(255 + (38 - 255) * t);
    return { bg: `rgb(${r},${g},${b})`, text: t > 0.5 ? "#fff" : "#111" };
  }
}

function CorrelationHeatmap({
  correlation,
  tickers,
}: {
  correlation: Record<string, Record<string, number>>;
  tickers: string[];
}) {
  const [hovered, setHovered] = useState<{ r: string; c: string } | null>(null);

  return (
    <div>
      <h3 className="text-base font-semibold text-gray-800 mb-1">
        Correlación entre activos
      </h3>
      <p className="text-xs text-gray-500 mb-4">
        Correlaciones bajas o negativas indican buena diversificación.
        Rango: −1 (anticorrelación) → 0 (independientes) → 1 (correlación perfecta).
      </p>
      <div className="overflow-x-auto">
        <div
          className="inline-grid gap-0.5"
          style={{ gridTemplateColumns: `80px repeat(${tickers.length}, minmax(56px, 1fr))` }}
        >
          {/* Encabezado de columnas */}
          <div className="h-12" />
          {tickers.map((t) => (
            <div
              key={t}
              className="h-12 flex items-end justify-center pb-1 text-xs font-semibold text-gray-600"
            >
              {t}
            </div>
          ))}

          {/* Filas — React.Fragment con key para evitar warning */}
          {tickers.map((row) => (
            <Fragment key={row}>
              <div className="h-12 flex items-center justify-end pr-2 text-xs font-semibold text-gray-600">
                {row}
              </div>
              {tickers.map((col) => {
                const val = correlation[row]?.[col] ?? 0;
                const { bg, text } = correlationColor(val);
                const isHovered = hovered?.r === row && hovered?.c === col;
                return (
                  <div
                    key={`${row}-${col}`}
                    className="h-12 flex items-center justify-center text-xs font-medium rounded cursor-default transition-transform hover:scale-110 hover:z-10 relative"
                    style={{ backgroundColor: bg, color: text }}
                    onMouseEnter={() => setHovered({ r: row, c: col })}
                    onMouseLeave={() => setHovered(null)}
                  >
                    {val.toFixed(2)}
                    {isHovered && row !== col && (
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-20 pointer-events-none">
                        {row} / {col}: {val.toFixed(4)}
                      </div>
                    )}
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Equity Curve Chart ────────────────────────────────────────────────────────

function formatXTick(dateStr: string): string {
  // Acepta "YYYY-MM" o "YYYY-MM-DD"
  const parts = dateStr.split("-");
  if (parts.length < 2) return dateStr;
  const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1);
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

function EquityTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value?: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const port = (payload.find((p) => p.dataKey === "portfolio_value")?.value ?? 0) as number;
  const bench = (payload.find((p) => p.dataKey === "benchmark_value")?.value ?? 0) as number;
  const diff = bench > 0 ? ((port / bench) - 1) * 100 : 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs min-w-[180px]">
      <p className="font-semibold text-gray-700 mb-2">{label ? formatXTick(label) : ""}</p>
      <p className="text-blue-600 mb-0.5">Portafolio: <span className="font-bold">${port.toFixed(2)}</span></p>
      <p className="text-gray-500 mb-1">SPY (benchmark): <span className="font-bold">${bench.toFixed(2)}</span></p>
      <p className={`font-semibold ${diff >= 0 ? "text-green-600" : "text-red-500"}`}>
        Diferencia: {diff >= 0 ? "+" : ""}{diff.toFixed(1)}%
      </p>
    </div>
  );
}

function EquityCurveChart({ curveData }: { curveData: EquityCurveResponse }) {
  const data = curveData.data;
  if (!data.length) return null;

  const lastPoint = data[data.length - 1];
  const portFinal = lastPoint.portfolio_value;
  const benchFinal = lastPoint.benchmark_value;
  const relDiff = ((portFinal / benchFinal) - 1) * 100;
  const outperformed = relDiff >= 0;

  // Mostrar ~8 ticks en el eje X
  const xInterval = Math.max(1, Math.floor(data.length / 8));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="text-base font-semibold text-gray-800">
            Evolución del portafolio (últimos 2 años)
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">Base $100 invertidos</p>
        </div>
        <span
          className={`text-xs font-semibold px-3 py-1 rounded-full ${
            outperformed
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-600"
          }`}
        >
          {outperformed ? "▲" : "▼"} {outperformed ? "+" : ""}{relDiff.toFixed(1)}% vs benchmark
        </span>
      </div>

      {/* Leyenda manual arriba */}
      <div className="flex gap-4 mt-3 mb-4">
        <span className="flex items-center gap-1.5 text-xs text-gray-600">
          <span className="w-6 h-0.5 bg-blue-600 inline-block rounded" />
          Portafolio
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-400">
          <span className="w-6 h-0 border-t-2 border-dashed border-gray-400 inline-block" />
          SPY (benchmark)
        </span>
      </div>

      <ResponsiveContainer width="100%" height={320}>
      <LineChart
        data={data}
        margin={{ top: 4, right: 16, bottom: 0, left: 8 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis
          dataKey="date"
          tickFormatter={formatXTick}
          interval={xInterval}
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => `$${v.toFixed(0)}`}
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
          width={52}
        />
        <RechartsTooltip content={<EquityTooltip />} />
        <Line
          type="monotone"
          dataKey="portfolio_value"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="benchmark_value"
          stroke="#94a3b8"
          strokeWidth={1.5}
          strokeDasharray="5 3"
          dot={false}
          activeDot={{ r: 3 }}
        />
      </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function ProjectionChart({
  data,
}: {
  data: { year: number; value: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef2ef" />
        <XAxis
          dataKey="year"
          tickFormatter={(value) => `${value}a`}
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(value) => `$${Math.round(value / 1000)}k`}
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <RechartsTooltip
          formatter={(value) => [`$${Number(value).toLocaleString()}`, "Capital proyectado"]}
          labelFormatter={(label) => `Año ${label}`}
          contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#1f4d3a"
          strokeWidth={2.25}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function formatTimestamp(ts: number) {
  return new Date(ts).toLocaleString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Página principal ─────────────────────────────────────────────────────────

export default function PortfolioPage() {
  const router = useRouter();
  const {
    buildResult,
    investorProfile,
    recommendationHistory,
    analyzeResult,
    equityCurveResult,
    setAnalyzeResult,
    setEquityCurveResult,
  } = usePortfolioStore();
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  useEffect(() => {
    if (!buildResult) {
      router.replace("/onboarding");
    }
  }, [buildResult, router]);

  if (!buildResult) return null;

  const profileColor = PROFILE_COLORS[buildResult.profile_name] ?? "bg-gray-100 text-gray-800";
  const allocationData = Object.entries(buildResult.allocation).map(([key, value]) => ({
    name: PIE_LABELS[key] ?? key,
    value: Math.round(value * 100),
    color: PIE_COLORS[key] ?? "#94a3b8",
  }));

  const etfEntries = Object.entries(buildResult.etf_weights).sort((a, b) => b[1] - a[1]);
  const monthlyContribution = (buildResult.investor_context.monthly_contribution ?? investorProfile.monthlyContribution ?? 0) as number;
  const horizonYears = (buildResult.investor_context.horizon_years ?? investorProfile.horizonYears ?? 5) as number;
  const expectedReturn = getExpectedReturn(buildResult.profile_name, analyzeResult);
  const conservativeReturn = Math.max(expectedReturn - 0.025, 0.02);
  const optimisticReturn = expectedReturn + 0.025;
  const baseProjection = futureValueWithMonthlyContributions(monthlyContribution, horizonYears, expectedReturn);
  const conservativeProjection = futureValueWithMonthlyContributions(monthlyContribution, horizonYears, conservativeReturn);
  const optimisticProjection = futureValueWithMonthlyContributions(monthlyContribution, horizonYears, optimisticReturn);
  const projectionSeries = buildProjectionSeries(monthlyContribution, horizonYears, expectedReturn);
  const suitabilityAlerts = [
    monthlyContribution > 0
      ? `Con aportes mensuales de $${monthlyContribution.toLocaleString()}, el plan gana consistencia en el tiempo.`
      : "Todavía no hay aportes definidos; el siguiente paso comercial es fijar uno.",
    (buildResult.investor_context.emergency_buffer_months ?? investorProfile.emergencyBufferMonths ?? 0) < 3
      ? "El fondo de emergencia es bajo para una cartera de riesgo medio/alto."
      : "El fondo de emergencia informado ayuda a sostener la estrategia sin forzar ventas.",
    getLiquidityLabel(buildResult.investor_context.liquidity_need).toLowerCase() === "alta"
      ? "La necesidad de liquidez alta sugiere revisar si conviene acortar duración y bajar volatilidad."
      : "La liquidez declarada es compatible con una estrategia de mediano/largo plazo.",
  ];

  async function handleAnalyze() {
    setAnalyzing(true);
    setAnalyzeError(null);
    const tickers = Object.keys(buildResult!.etf_weights);
    const weights = Object.values(buildResult!.etf_weights);
    try {
      const [analyzeRes, curveRes] = await Promise.all([
        portfolioApi.analyze({ tickers, weights, period: "2y" }),
        portfolioApi.equityCurve({ tickers, weights, period: "2y" }),
      ]);
      setAnalyzeResult(analyzeRes);
      setEquityCurveResult(curveRes);
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : "Error al analizar el portafolio.");
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/onboarding")}
            className="text-sm text-gray-400 hover:text-gray-600 mb-3 flex items-center gap-1 transition-colors"
          >
            ← Volver al cuestionario
          </button>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]/70">
                Propuesta del advisor
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">Tu portafolio recomendado</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500">
                Basado en perfil, objetivo y horizonte. La idea es que esta pantalla sirva para vender claridad,
                no solo una combinación de ETFs.
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--accent)]/10 bg-[var(--accent)]/[0.05] px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500">Score final</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {buildResult.investor_context.risk_score ?? "—"}/100
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-black/6 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.16em] text-gray-500">Objetivo</p>
            <p className="mt-2 text-sm font-medium text-gray-900">
              {getGoalLabel(buildResult.investor_context.investment_goal)}
            </p>
          </div>
          <div className="rounded-2xl border border-black/6 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.16em] text-gray-500">Horizonte</p>
            <p className="mt-2 text-sm font-medium text-gray-900">
              {horizonYears} años
            </p>
          </div>
          <div className="rounded-2xl border border-black/6 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.16em] text-gray-500">Liquidez</p>
            <p className="mt-2 text-sm font-medium text-gray-900">
              {getLiquidityLabel(buildResult.investor_context.liquidity_need)}
            </p>
          </div>
          <div className="rounded-2xl border border-black/6 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.16em] text-gray-500">Aporte mensual</p>
            <p className="mt-2 text-sm font-medium text-gray-900">
              ${((buildResult.investor_context.monthly_contribution ?? investorProfile.monthlyContribution ?? 0) as number).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Dos columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Columna izquierda — Perfil + Pie Chart */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${profileColor} mb-2`}>
                  {buildResult.profile_name}
                </span>
                <p className="text-gray-600 text-sm leading-relaxed">{buildResult.description}</p>
              </div>
            </div>

            <h3 className="text-sm font-semibold text-gray-700 mb-3 mt-4">Allocation por clase de activo</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={allocationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {allocationData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  formatter={(value) => [`${value}%`, ""]}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "13px" }}
                />
                <Legend
                  iconType="circle"
                  iconSize={10}
                  formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Columna derecha — Tabla de ETFs */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Composición del portafolio</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ticker</th>
                    <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">ETF</th>
                    <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Peso</th>
                    <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Clase</th>
                  </tr>
                </thead>
                <tbody>
                  {etfEntries.map(([ticker, weight]) => {
                    const info = ETF_INFO[ticker];
                    return (
                      <tr key={ticker} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-2.5 font-mono font-bold text-blue-700">{ticker}</td>
                        <td className="py-2.5 text-gray-700">{info?.name ?? ticker}</td>
                        <td className="py-2.5 text-right font-semibold text-gray-800">
                          {(weight * 100).toFixed(0)}%
                        </td>
                        <td className="py-2.5 text-right">
                          <span className="text-xs text-gray-500">{info?.assetClass ?? "—"}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="mt-5 w-full bg-[var(--accent)] hover:opacity-95 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {analyzing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analizando...
                </>
              ) : (
                "Analizar este portafolio"
              )}
            </button>
            {analyzeError && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-700 text-sm font-medium">{analyzeError}</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] mb-6">
          <div className="rounded-2xl border border-black/6 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900">Por qué esta cartera encaja con el cliente</h3>
            <div className="mt-4 space-y-3">
              {buildResult.suitability.map((item) => (
                <div key={item} className="rounded-2xl bg-[var(--surface-subtle)] px-4 py-3 text-sm leading-6 text-gray-600">
                  {item}
                </div>
              ))}
            </div>
            <h4 className="mt-6 text-sm font-semibold text-gray-900">Racional de construcción</h4>
            <div className="mt-3 space-y-3">
              {buildResult.rationale.map((item) => (
                <p key={item} className="text-sm leading-6 text-gray-600">
                  {item}
                </p>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-black/6 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900">Siguiente mejor acción</h3>
            <div className="mt-4 rounded-2xl bg-[var(--surface-subtle)] p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-gray-500">Política sugerida</p>
              <p className="mt-2 text-sm leading-6 text-gray-700">{buildResult.rebalance_policy}</p>
            </div>
            <div className="mt-4 space-y-3">
              {buildResult.next_steps.map((step, index) => (
                <div key={step} className="flex gap-3 rounded-2xl border border-black/6 px-4 py-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/[0.08] text-xs font-semibold text-[var(--accent)]">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-6 text-gray-600">{step}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => router.push("/portfolio/proposal")}
                className="rounded-xl border border-black/8 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-[var(--accent)]/20 hover:text-[var(--accent)]"
              >
                Ver propuesta formal
              </button>
              <button
                onClick={() => router.push("/portfolio/monitor")}
                className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-95"
              >
                Abrir seguimiento
              </button>
              <button
                onClick={() => router.push("/lab/analysis")}
                className="rounded-xl border border-black/8 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-[var(--accent)]/20 hover:text-[var(--accent)]"
              >
                Ver análisis de activos
              </button>
              <button
                onClick={() => router.push("/lab/simulation")}
                className="rounded-xl border border-black/8 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-[var(--accent)]/20 hover:text-[var(--accent)]"
              >
                Probar simulación
              </button>
            </div>
          </div>
        </div>

        <div className="mb-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-2xl border border-black/6 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Plan financiero y cashflows</h3>
                <p className="mt-1 text-sm leading-6 text-gray-500">
                  Proyección simple basada en aportes periódicos y retorno esperado del perfil.
                </p>
              </div>
              <div className="rounded-2xl bg-[var(--surface-subtle)] px-4 py-3 text-right">
                <p className="text-[11px] uppercase tracking-[0.16em] text-gray-500">Hipótesis base</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {(expectedReturn * 100).toFixed(1)}% anual
                </p>
              </div>
            </div>

            <div className="mb-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-[var(--surface-subtle)] p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-gray-500">Escenario conservador</p>
                <p className="mt-2 text-xl font-semibold text-gray-900">${Math.round(conservativeProjection).toLocaleString()}</p>
                <p className="mt-1 text-xs text-gray-500">{(conservativeReturn * 100).toFixed(1)}% anual</p>
              </div>
              <div className="rounded-2xl bg-[var(--accent)]/[0.05] p-4 ring-1 ring-[var(--accent)]/10">
                <p className="text-xs uppercase tracking-[0.14em] text-gray-500">Escenario base</p>
                <p className="mt-2 text-xl font-semibold text-gray-900">${Math.round(baseProjection).toLocaleString()}</p>
                <p className="mt-1 text-xs text-gray-500">{horizonYears} años con aporte de ${monthlyContribution.toLocaleString()}/mes</p>
              </div>
              <div className="rounded-2xl bg-[var(--surface-subtle)] p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-gray-500">Escenario optimista</p>
                <p className="mt-2 text-xl font-semibold text-gray-900">${Math.round(optimisticProjection).toLocaleString()}</p>
                <p className="mt-1 text-xs text-gray-500">{(optimisticReturn * 100).toFixed(1)}% anual</p>
              </div>
            </div>

            <ProjectionChart data={projectionSeries} />
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-black/6 bg-white p-6 shadow-sm">
              <h3 className="text-base font-semibold text-gray-900">Objetivo financiero sugerido</h3>
              <p className="mt-3 text-sm leading-6 text-gray-600">
                La cartera está alineada con <span className="font-medium text-gray-900">{getGoalLabel(buildResult.investor_context.investment_goal)}</span>,
                un horizonte de <span className="font-medium text-gray-900">{horizonYears} años</span> y aportes periódicos de
                <span className="font-medium text-gray-900"> ${monthlyContribution.toLocaleString()}</span>.
              </p>
              <div className="mt-4 space-y-3">
                {suitabilityAlerts.map((item) => (
                  <div key={item} className="rounded-2xl bg-[var(--surface-subtle)] px-4 py-3 text-sm leading-6 text-gray-600">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-black/6 bg-white p-6 shadow-sm">
              <h3 className="text-base font-semibold text-gray-900">Resumen institucional</h3>
              <div className="mt-4 space-y-3 text-sm leading-6 text-gray-600">
                <p>Perfil asignado: <span className="font-medium text-gray-900">{buildResult.profile_name}</span>.</p>
                <p>Retorno esperado base: <span className="font-medium text-gray-900">{(expectedReturn * 100).toFixed(1)}% anual</span>.</p>
                <p>Liquidez objetivo: <span className="font-medium text-gray-900">{getLiquidityLabel(buildResult.investor_context.liquidity_need)}</span>.</p>
                <p>Política de revisión: <span className="font-medium text-gray-900">{buildResult.rebalance_policy}</span></p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-black/6 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Bitácora de recomendaciones</h3>
              <p className="mt-1 text-sm text-gray-500">
                Trazabilidad básica para producto, comercial y compliance.
              </p>
            </div>
            <button
              onClick={() => router.push("/portfolio/monitor")}
              className="rounded-xl border border-black/8 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-[var(--accent)]/20 hover:text-[var(--accent)]"
            >
              Abrir seguimiento
            </button>
          </div>
          <div className="space-y-3">
            {recommendationHistory.map((entry) => (
              <div key={entry.id} className="flex flex-col gap-3 rounded-2xl border border-black/6 px-4 py-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {entry.profile_name} · {getGoalLabel(entry.investment_goal)}
                  </p>
                  <p className="text-sm text-gray-500">
                    Score {entry.risk_score}/100 · {entry.horizon_years ?? "—"} años · ${Math.round(entry.monthly_contribution ?? 0).toLocaleString()}/mes
                  </p>
                </div>
                <div className="text-sm text-gray-500 md:text-right">
                  <p>{entry.note}</p>
                  <p className="text-xs uppercase tracking-[0.14em] text-gray-400">{formatTimestamp(entry.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sección de métricas + gráficos */}
        {analyzeResult && (
          <MetricsSection
            result={analyzeResult}
            equityCurveResult={equityCurveResult}
          />
        )}

        {/* Disclaimer */}
        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-amber-800 text-xs leading-relaxed">
            <span className="font-semibold">Disclaimer legal:</span> Esta plataforma es educativa y no constituye
            asesoramiento financiero. Los portafolios y métricas mostrados son orientativos.
            Las inversiones conllevan riesgo de pérdida de capital. Rendimientos pasados no garantizan
            resultados futuros. Consultá a un asesor financiero matriculado antes de invertir.
          </p>
        </div>
      </div>
    </div>
  );
}

function MetricsSection({
  result,
  equityCurveResult,
}: {
  result: PortfolioAnalyzeResponse;
  equityCurveResult: EquityCurveResponse | null;
}) {
  const m = result.metrics;

  return (
    <div className="space-y-6">
      {/* Cards de métricas */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-gray-800">Métricas del portafolio</h3>
          <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
            Últimos 2 años · {result.tickers.length} activos
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {METRICS_CONFIG.map((cfg) => {
            const value = m[cfg.key];
            return (
              <div key={cfg.key} className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center mb-1">
                  <span className="text-xs text-gray-500 font-medium">{cfg.label}</span>
                  <MetricTooltip text={cfg.tooltip} />
                </div>
                <p className={`text-2xl font-bold ${cfg.color(value as number)}`}>
                  {cfg.format(value as number)}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Equity curve — entre métricas y heatmap */}
      {equityCurveResult && <EquityCurveChart curveData={equityCurveResult} />}

      {/* Heatmap de correlación */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <CorrelationHeatmap
          correlation={result.metrics.correlation}
          tickers={result.tickers}
        />
      </div>
    </div>
  );
}
