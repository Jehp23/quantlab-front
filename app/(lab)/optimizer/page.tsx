"use client";

import { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import Link from "next/link";
import { optimizeApi } from "@/lib/api";
import type { OptimizeResponse, FrontierPoint } from "@/lib/types";

// ── Universo ETFs ────────────────────────────────────────────────────────────

const ETF_UNIVERSE: { ticker: string; name: string; class: string }[] = [
  { ticker: "SPY",  name: "S&P 500",               class: "Renta Variable" },
  { ticker: "QQQ",  name: "Nasdaq 100",             class: "Renta Variable" },
  { ticker: "EFA",  name: "MSCI EAFE",              class: "Renta Variable" },
  { ticker: "EEM",  name: "Emerging Markets",       class: "Renta Variable" },
  { ticker: "AGG",  name: "US Aggregate Bond",      class: "Renta Fija"     },
  { ticker: "LQD",  name: "Corporate Bonds IG",     class: "Renta Fija"     },
  { ticker: "TLT",  name: "Treasury 20+ años",      class: "Renta Fija"     },
  { ticker: "GLD",  name: "Oro",                    class: "Alternativo"    },
  { ticker: "VNQ",  name: "Real Estate (REITs)",    class: "Alternativo"    },
  { ticker: "BIL",  name: "T-Bills 1-3 meses",      class: "Cash"           },
  { ticker: "DJP",  name: "Bloomberg Commodities",  class: "Alternativo"    },
  { ticker: "ACWI", name: "All Country World",      class: "Renta Variable" },
];

const METHODS = [
  {
    id:    "max_sharpe" as const,
    label: "Máximo Sharpe",
    desc:  "Maximiza retorno/riesgo",
    color: "bg-blue-600",
  },
  {
    id:    "min_variance" as const,
    label: "Mínima Varianza",
    desc:  "Minimiza volatilidad",
    color: "bg-green-600",
  },
  {
    id:    "risk_parity" as const,
    label: "Risk Parity",
    desc:  "Igual contribución al riesgo",
    color: "bg-violet-600",
  },
];

const PERIODS = ["3y", "5y", "10y"];

const CLASS_COLORS: Record<string, string> = {
  "Renta Variable": "#3b82f6",
  "Renta Fija":     "#22c55e",
  "Alternativo":    "#f59e0b",
  "Cash":           "#94a3b8",
};

const PIE_COLORS = [
  "#3b82f6", "#22c55e", "#f59e0b", "#ef4444",
  "#8b5cf6", "#06b6d4", "#f97316", "#84cc16",
  "#ec4899", "#64748b", "#14b8a6", "#a78bfa",
];

// ── Componente principal ─────────────────────────────────────────────────────

export default function OptimizerPage() {
  const [selected, setSelected]  = useState<string[]>(["SPY", "QQQ", "AGG", "GLD", "BIL"]);
  const [method,   setMethod]    = useState<"max_sharpe" | "min_variance" | "risk_parity">("max_sharpe");
  const [period,   setPeriod]    = useState("5y");
  const [result,   setResult]    = useState<OptimizeResponse | null>(null);
  const [frontier, setFrontier]  = useState<FrontierPoint[] | null>(null);
  const [loading,  setLoading]   = useState(false);
  const [loadingFrontier, setLoadingFrontier] = useState(false);
  const [error,    setError]     = useState<string | null>(null);

  function toggleTicker(t: string) {
    setSelected((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }

  async function handleOptimize() {
    if (selected.length < 2) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setFrontier(null);
    try {
      const apiFn =
        method === "max_sharpe"  ? optimizeApi.maxSharpe  :
        method === "min_variance" ? optimizeApi.minVariance :
        optimizeApi.riskParity;
      const data = await apiFn({ tickers: selected, period, risk_free_rate: 0.05 });
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  async function handleFrontier() {
    if (selected.length < 2) return;
    setLoadingFrontier(true);
    try {
      const data = await optimizeApi.frontier(selected, period);
      setFrontier(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al calcular la frontera");
    } finally {
      setLoadingFrontier(false);
    }
  }

  const weightedEntries = result
    ? Object.entries(result.weights)
        .filter(([, w]) => w > 0.001)
        .sort(([, a], [, b]) => b - a)
    : [];

  const colorByTicker = Object.fromEntries(
    weightedEntries.map(([ticker], i) => [ticker, PIE_COLORS[i % PIE_COLORS.length]]),
  );

  // Pie chart data: only tickers with weight > 0
  const pieData = weightedEntries.map(([ticker, weight]) => ({
    name: ticker,
    value: weight,
    color: colorByTicker[ticker],
  }));

  // Frontier + optimal point for scatter chart
  const frontierData = frontier?.map((p) => ({
    x: parseFloat((p.volatility * 100).toFixed(3)),
    y: parseFloat((p.return * 100).toFixed(3)),
    sharpe: p.sharpe,
  })) ?? [];

  const optimalPoint = result
    ? [{
        x: parseFloat((result.expected_volatility * 100).toFixed(3)),
        y: parseFloat((result.expected_return * 100).toFixed(3)),
        sharpe: result.sharpe,
      }]
    : [];

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <div className="nav-bar px-6 py-3 flex items-center gap-4 sticky top-0 z-10">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
          ← Inicio
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-semibold text-gray-800">Optimizador</span>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Config panel */}
        <div className="card p-6 mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Optimizador de Portafolio</h1>
          <p className="text-gray-500 text-sm mb-6">
            Seleccioná activos, elegí el método y calculá el portafolio óptimo según Markowitz.
          </p>

          {/* Ticker grid */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Universo de activos
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {ETF_UNIVERSE.map(({ ticker, name, class: cls }) => {
                const active = selected.includes(ticker);
                return (
                  <button
                    key={ticker}
                    onClick={() => toggleTicker(ticker)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all ${
                      active
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 hover:border-indigo-300 bg-white/80"
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: CLASS_COLORS[cls] ?? "#6b7280" }}
                    />
                    <div className="min-w-0">
                      <p className={`text-sm font-bold leading-none ${active ? "text-blue-700" : "text-gray-800"}`}>
                        {ticker}
                      </p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{name}</p>
                    </div>
                    {active && (
                      <span className="ml-auto text-blue-500 text-xs font-bold shrink-0">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {selected.length} activos seleccionados · mín. 2
            </p>
          </div>

          {/* Method + period */}
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Método</p>
              <div className="flex gap-2">
                {METHODS.map(({ id, label, desc }) => (
                  <button
                    key={id}
                    onClick={() => setMethod(id)}
                    className={`px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                      method === id
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                    }`}
                    title={desc}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Período histórico</p>
              <div className="flex gap-1">
                {PERIODS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                      period === p
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleOptimize}
              disabled={loading || selected.length < 2}
              className="ml-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Optimizando...
                </span>
              ) : (
                "Optimizar →"
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-6">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <>
            {/* Key metrics row */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                {
                  label: "Retorno Esperado",
                  value: `${result.expected_return >= 0 ? "+" : ""}${(result.expected_return * 100).toFixed(2)}%`,
                  color: result.expected_return >= 0 ? "text-green-600" : "text-red-600",
                  sub: "anualizado histórico",
                },
                {
                  label: "Volatilidad Esperada",
                  value: `${(result.expected_volatility * 100).toFixed(2)}%`,
                  color: "text-gray-900",
                  sub: "σ anualizado",
                },
                {
                  label: "Sharpe Ratio",
                  value: result.sharpe.toFixed(3),
                  color: result.sharpe > 1 ? "text-green-600" : result.sharpe > 0 ? "text-yellow-600" : "text-red-600",
                  sub: "Rf = 5% (BIL)",
                },
              ].map(({ label, value, color, sub }) => (
                <div key={label} className="card p-5">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                  <p className={`text-3xl font-extrabold ${color}`}>{value}</p>
                  <p className="text-xs text-gray-400 mt-1">{sub}</p>
                </div>
              ))}
            </div>

            {/* Weights breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Pie chart */}
              <div className="card p-6">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
                  Distribución de pesos
                </h2>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map(({ color }, i) => (
                        <Cell key={i} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`${((value as number) * 100).toFixed(1)}%`, "Peso"]}
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Weights table */}
              <div className="card p-6">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
                  Pesos óptimos — método: {METHODS.find((m) => m.id === result.method)?.label ?? result.method}
                </h2>
                <div className="space-y-2">
                  {weightedEntries
                    .map(([ticker, weight]) => {
                      const pct = weight * 100;
                      const etf = ETF_UNIVERSE.find((e) => e.ticker === ticker);
                      const color = colorByTicker[ticker];
                      return (
                        <div key={ticker} className="flex items-center gap-3">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline">
                              <span className="text-sm font-bold text-gray-800">{ticker}</span>
                              <span className="text-sm font-semibold text-gray-700">
                                {pct.toFixed(1)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                              <div
                                className="h-1.5 rounded-full"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor: color,
                                }}
                              />
                            </div>
                            {etf && (
                              <p className="text-xs text-gray-400 truncate">{etf.name}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                  <Link
                    href={`/backtest?tickers=${selected.join(",")}&weights=${selected.map((t) => (result.weights[t] ?? 0).toFixed(4)).join(",")}`}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    Backtestear este portafolio →
                  </Link>
                  <span className="text-xs text-gray-400">
                    ∑ = {(Object.values(result.weights).reduce((a, b) => a + b, 0) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Efficient Frontier */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Frontera Eficiente de Markowitz
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Cada punto es un portafolio óptimo para un nivel de retorno objetivo
                  </p>
                </div>
                {!frontier && (
                  <button
                    onClick={handleFrontier}
                    disabled={loadingFrontier}
                    className="bg-gray-800 hover:bg-gray-900 text-white font-semibold px-5 py-2 rounded-xl text-xs transition-colors disabled:opacity-50"
                  >
                    {loadingFrontier ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Calculando...
                      </span>
                    ) : (
                      "Calcular Frontera →"
                    )}
                  </button>
                )}
              </div>

              {frontier ? (
                <ResponsiveContainer width="100%" height={320}>
                  <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis
                      type="number"
                      dataKey="x"
                      name="Volatilidad"
                      unit="%"
                      tick={{ fontSize: 11, fill: "#9ca3af" }}
                      label={{ value: "Volatilidad (%)", position: "bottom", fontSize: 11, fill: "#9ca3af", offset: -5 }}
                      domain={["auto", "auto"]}
                    />
                    <YAxis
                      type="number"
                      dataKey="y"
                      name="Retorno"
                      unit="%"
                      tick={{ fontSize: 11, fill: "#9ca3af" }}
                      label={{ value: "Retorno (%)", angle: -90, position: "insideLeft", fontSize: 11, fill: "#9ca3af" }}
                      domain={["auto", "auto"]}
                      width={60}
                    />
                    <Tooltip
                      cursor={{ strokeDasharray: "3 3" }}
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                      formatter={(value, name) => [`${(value as number).toFixed(2)}%`, name as string]}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                    <Scatter name="Frontera eficiente" data={frontierData} fill="#93c5fd" opacity={0.7} r={4} />
                    {optimalPoint.length > 0 && (
                      <Scatter
                        name={`Portafolio óptimo (${METHODS.find((m) => m.id === result.method)?.label})`}
                        data={optimalPoint}
                        fill="#dc2626"
                        r={8}
                        shape="star"
                      />
                    )}
                  </ScatterChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex items-center justify-center bg-gray-50 rounded-xl">
                  <p className="text-gray-400 text-sm">
                    Hacé click en &quot;Calcular Frontera&quot; para ver la curva de portafolios óptimos
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
