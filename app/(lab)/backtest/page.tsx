"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import Link from "next/link";
import { backtestApi, montecarloApi } from "@/lib/api";
import type { BacktestResponse, MonteCarloResponse } from "@/lib/types";
import { getErrorMessage } from "@/lib/utils";

// ── Constantes ───────────────────────────────────────────────────────────────

const REBAL_FREQS = [
  { id: "monthly",   label: "Mensual"   },
  { id: "quarterly", label: "Trimestral" },
  { id: "annually",  label: "Anual"     },
];

const MC_HORIZONS = [
  { days: 126,  label: "6 meses" },
  { days: 252,  label: "1 año"   },
  { days: 504,  label: "2 años"  },
  { days: 756,  label: "3 años"  },
];

const MC_SIMS = [500, 1000, 5000];

// ── Sub-componente BacktestContent ───────────────────────────────────────────

function BacktestContent() {
  const searchParams = useSearchParams();

  // Tickers y pesos desde URL (pueden llegar desde el optimizador)
  const initTickers = searchParams.get("tickers")?.split(",").filter(Boolean) ?? ["SPY", "QQQ", "AGG"];
  const initWeightsRaw = searchParams.get("weights")?.split(",").map(Number).filter((n) => !isNaN(n));
  const initWeights =
    initWeightsRaw && initWeightsRaw.length === initTickers.length
      ? initWeightsRaw
      : initTickers.map(() => parseFloat((1 / initTickers.length).toFixed(4)));

  const [tickers,     setTickers]     = useState<string[]>(initTickers);
  const [weights,     setWeights]     = useState<number[]>(initWeights);
  const [tickerInput, setTickerInput] = useState("");
  const [startDate,   setStartDate]   = useState("2020-01-01");
  const [endDate,     setEndDate]     = useState(new Date().toISOString().slice(0, 10));
  const [rebalFreq,   setRebalFreq]   = useState("monthly");

  const [btResult,  setBtResult]  = useState<BacktestResponse | null>(null);
  const [btLoading, setBtLoading] = useState(false);
  const [btError,   setBtError]   = useState<string | null>(null);

  // Monte Carlo state
  const [mcHorizon,  setMcHorizon]  = useState(252);
  const [mcSims,     setMcSims]     = useState(1000);
  const [mcResult,   setMcResult]   = useState<MonteCarloResponse | null>(null);
  const [mcLoading,  setMcLoading]  = useState(false);
  const [mcError,    setMcError]    = useState<string | null>(null);

  // Calcular suma de pesos
  const weightSum = weights.reduce((a, b) => a + b, 0);

  function addTicker() {
    const t = tickerInput.trim().toUpperCase();
    if (t && !tickers.includes(t) && tickers.length < 8) {
      const newTickers = [...tickers, t];
      const newWeights = newTickers.map(() => parseFloat((1 / newTickers.length).toFixed(4)));
      setTickers(newTickers);
      setWeights(newWeights);
    }
    setTickerInput("");
  }

  function removeTicker(i: number) {
    const newTickers = tickers.filter((_, idx) => idx !== i);
    const newWeights = newTickers.map(() => parseFloat((1 / newTickers.length).toFixed(4)));
    setTickers(newTickers);
    setWeights(newWeights);
  }

  function updateWeight(i: number, val: string) {
    const v = parseFloat(val);
    if (isNaN(v)) return;
    setWeights((prev) => prev.map((w, idx) => (idx === i ? v : w)));
  }

  function normalizeWeights() {
    const sum = weights.reduce((a, b) => a + b, 0);
    if (sum === 0) return;
    setWeights(weights.map((w) => parseFloat((w / sum).toFixed(4))));
  }

  async function handleBacktest() {
    if (weightSum === 0) return;
    const normalized = weights.map((w) => w / weightSum);
    setBtLoading(true);
    setBtError(null);
    setBtResult(null);
    setMcResult(null);
    try {
      const data = await backtestApi.run({
        tickers,
        weights: normalized,
        start: startDate,
        end: endDate,
        rebalance_freq: rebalFreq as "monthly" | "quarterly" | "annually",
      });
      setBtResult(data);
    } catch (e: unknown) {
      setBtError(getErrorMessage(e));
    } finally {
      setBtLoading(false);
    }
  }

  async function handleMonteCarlo() {
    if (!btResult) return;
    const normalized = weights.map((w) => w / weightSum);
    setMcLoading(true);
    setMcError(null);
    setMcResult(null);
    try {
      const data = await montecarloApi.run({
        tickers,
        weights: normalized,
        horizon_days: mcHorizon,
        simulations: mcSims,
        initial_value: btResult.data[btResult.data.length - 1]?.value ?? 10000,
      });
      setMcResult(data);
    } catch (e: unknown) {
      setMcError(getErrorMessage(e));
    } finally {
      setMcLoading(false);
    }
  }

  // Chart data para equity curve
  const equityData = btResult?.data ?? [];

  // MC chart: series con índice t como eje X
  const mcChartData = mcResult
    ? mcResult.percentile_50.map((_, t) => ({
        t,
        p5:  mcResult.percentile_5[t],
        p50: mcResult.percentile_50[t],
        p95: mcResult.percentile_95[t],
      }))
    : [];

  // Stats del MC final
  const mcFinal = mcResult?.final_values ?? [];
  const mcInitial = btResult?.data[btResult.data.length - 1]?.value ?? 10000;
  const mcMedian  = mcResult ? mcResult.percentile_50[mcResult.percentile_50.length - 1] : 0;
  const mcP5      = mcResult ? mcResult.percentile_5[mcResult.percentile_5.length - 1]   : 0;
  const mcP95     = mcResult ? mcResult.percentile_95[mcResult.percentile_95.length - 1] : 0;
  const mcWinProb = mcFinal.length
    ? ((mcFinal.filter((v) => v > mcInitial).length / mcFinal.length) * 100).toFixed(1)
    : null;

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <div className="nav-bar px-6 py-3 flex items-center gap-4 sticky top-0 z-10">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
          ← Inicio
        </Link>
        <span className="text-gray-300">/</span>
        <Link href="/optimizer" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
          Optimizador
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-semibold text-gray-800">Backtest + Monte Carlo</span>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* ══ SECCIÓN 1: Input ══════════════════════════════════════════════════ */}
        <div className="card p-6 mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Backtesting</h1>
          <p className="text-gray-500 text-sm mb-6">
            Simulá la performance histórica del portafolio con rebalanceo periódico vs SPY.
          </p>

          {/* Tickers + Weights */}
          <div className="mb-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Portafolio
            </p>
            <div className="space-y-2 mb-3">
              {tickers.map((t, i) => (
                <div key={t} className="flex items-center gap-3">
                  <span className="w-14 text-sm font-bold text-gray-800">{t}</span>
                  <input
                    type="number"
                    min={0}
                    max={1}
                    step={0.01}
                    value={weights[i] ?? 0}
                    onChange={(e) => updateWeight(i, e.target.value)}
                    className="w-28 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (weights[i] ?? 0) / Math.max(weightSum, 1) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-12 text-right">
                    {((weights[i] ?? 0) / weightSum * 100).toFixed(1)}%
                  </span>
                  <button
                    onClick={() => removeTicker(i)}
                    className="text-gray-400 hover:text-red-500 transition-colors text-sm"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <input
                type="text"
                value={tickerInput}
                onChange={(e) => setTickerInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && addTicker()}
                placeholder="Agregar ticker"
                className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-36"
                maxLength={10}
              />
              <button
                onClick={addTicker}
                disabled={tickers.length >= 8}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-3 py-2 rounded-xl text-sm disabled:opacity-40"
              >
                + Agregar
              </button>
              <button
                onClick={normalizeWeights}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Normalizar pesos
              </button>
              <span className={`text-xs ml-auto font-semibold ${Math.abs(weightSum - 1) > 0.02 ? "text-red-600" : "text-green-600"}`}>
                ∑ = {(weightSum * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Date range + rebalance */}
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Desde</p>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Hasta</p>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Rebalanceo</p>
              <div className="flex gap-1">
                {REBAL_FREQS.map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => setRebalFreq(id)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                      rebalFreq === id
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleBacktest}
              disabled={btLoading || tickers.length < 1 || Math.abs(weightSum - 1) > 0.05}
              className="ml-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
            >
              {btLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Ejecutando...
                </span>
              ) : (
                "Ejecutar Backtest →"
              )}
            </button>
          </div>
        </div>

        {/* Error backtest */}
        {btError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-6">
            <p className="text-red-700 font-medium">{btError}</p>
          </div>
        )}

        {/* ══ SECCIÓN 2: Resultados Backtest ═══════════════════════════════════ */}
        {btResult && (
          <>
            {/* Equity curve */}
            <div className="card p-6 mb-6">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
                Equity curve — portafolio vs SPY (base $10.000)
              </h2>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={equityData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    tickFormatter={(d) => d.slice(0, 7)}
                    interval={Math.max(1, Math.floor(equityData.length / 8))}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    domain={["auto", "auto"]}
                    width={65}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                    formatter={(value, name) => [
                      `$${(value as number).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
                      name as string,
                    ]}
                    labelFormatter={(l) => `Fecha: ${l}`}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    name="Portafolio"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="benchmark_value"
                    name="SPY (benchmark)"
                    stroke="#9ca3af"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Metrics */}
            <div className="card p-6 mb-6">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-5">
                Métricas del backtest · rebalanceo {REBAL_FREQS.find((f) => f.id === rebalFreq)?.label.toLowerCase()}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {[
                  { label: "Retorno Anual",    value: `${btResult.metrics.annual_return >= 0 ? "+" : ""}${(btResult.metrics.annual_return * 100).toFixed(2)}%`, color: btResult.metrics.annual_return >= 0 ? "text-green-600" : "text-red-600" },
                  { label: "Volatilidad (σ)",  value: `${(btResult.metrics.sigma * 100).toFixed(2)}%`,          color: "text-gray-900" },
                  { label: "Sharpe Ratio",     value: btResult.metrics.sharpe.toFixed(3),                        color: btResult.metrics.sharpe > 1 ? "text-green-600" : btResult.metrics.sharpe > 0 ? "text-yellow-600" : "text-red-600" },
                  { label: "Sortino Ratio",    value: btResult.metrics.sortino.toFixed(3),                       color: btResult.metrics.sortino > 1 ? "text-green-600" : btResult.metrics.sortino > 0 ? "text-yellow-600" : "text-red-600" },
                  { label: "Max Drawdown",     value: `${(btResult.metrics.max_drawdown * 100).toFixed(2)}%`,    color: "text-red-600" },
                  { label: "Calmar Ratio",     value: btResult.metrics.calmar.toFixed(3),                        color: btResult.metrics.calmar > 0 ? "text-green-600" : "text-red-600" },
                  { label: "VaR 95% (diario)", value: `${(btResult.metrics.var_95 * 100).toFixed(2)}%`,          color: "text-gray-900" },
                  { label: "Valor final",      value: `$${btResult.data[btResult.data.length - 1]?.value.toLocaleString("en-US", { maximumFractionDigits: 0 }) ?? "—"}`, color: "text-gray-900" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="metric-cell p-4">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                    <p className={`text-xl font-bold ${color}`}>{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ══ SECCIÓN 3: Monte Carlo ════════════════════════════════════════ */}
            <div className="card p-6">
              <div className="mb-5">
                <h2 className="text-lg font-bold text-gray-900 mb-0.5">Simulación Monte Carlo</h2>
                <p className="text-sm text-gray-500">
                  Proyección futura usando Geometric Brownian Motion (GBM) con μ y σ estimados de los últimos 2 años.
                </p>
              </div>

              {/* MC controls */}
              <div className="flex flex-wrap gap-4 items-end mb-5">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Horizonte</p>
                  <div className="flex gap-1">
                    {MC_HORIZONS.map(({ days, label }) => (
                      <button
                        key={days}
                        onClick={() => setMcHorizon(days)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                          mcHorizon === days
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Simulaciones</p>
                  <div className="flex gap-1">
                    {MC_SIMS.map((n) => (
                      <button
                        key={n}
                        onClick={() => setMcSims(n)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                          mcSims === n
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {n.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleMonteCarlo}
                  disabled={mcLoading}
                  className="ml-auto bg-gray-800 hover:bg-gray-900 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
                >
                  {mcLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Simulando...
                    </span>
                  ) : (
                    "Simular →"
                  )}
                </button>
              </div>

              {mcError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                  <p className="text-red-700 text-sm font-medium">{mcError}</p>
                </div>
              )}

              {mcResult && (
                <>
                  {/* MC summary stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
                    {[
                      { label: "Mediana (P50)", value: `$${mcMedian.toLocaleString("en-US", { maximumFractionDigits: 0 })}`, color: "text-gray-900" },
                      { label: "Pesimista (P5)",  value: `$${mcP5.toLocaleString("en-US",   { maximumFractionDigits: 0 })}`, color: "text-red-600"   },
                      { label: "Optimista (P95)", value: `$${mcP95.toLocaleString("en-US",  { maximumFractionDigits: 0 })}`, color: "text-green-600" },
                      { label: "% supera inicial", value: `${mcWinProb}%`, color: parseFloat(mcWinProb ?? "0") > 50 ? "text-green-600" : "text-red-600" },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="metric-cell p-4">
                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                        <p className={`text-xl font-bold ${color}`}>{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* MC chart — percentile bands */}
                  <div className="mb-2">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">
                      Trayectorias proyectadas — {mcSims.toLocaleString()} simulaciones GBM
                    </p>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={mcChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <defs>
                          <linearGradient id="mcBand" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.12} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.03} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis
                          dataKey="t"
                          tick={{ fontSize: 11, fill: "#9ca3af" }}
                          tickFormatter={(t) => `Día ${t}`}
                          interval={Math.max(1, Math.floor(mcChartData.length / 6))}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: "#9ca3af" }}
                          domain={["auto", "auto"]}
                          width={65}
                          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                        />
                        <Tooltip
                          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                          formatter={(value, name) => [
                            `$${(value as number).toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
                            name as string,
                          ]}
                          labelFormatter={(t) => `Día ${t}`}
                        />
                        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                        <ReferenceLine y={mcInitial} stroke="#6b7280" strokeDasharray="4 4" strokeWidth={1} label={{ value: "Inicio", fontSize: 10, fill: "#9ca3af" }} />
                        {/* P5–P95 band */}
                        <Area type="monotone" dataKey="p95" name="Percentil 95" stroke="#22c55e" strokeWidth={1.5} fill="url(#mcBand)" dot={false} />
                        <Area type="monotone" dataKey="p5"  name="Percentil 5"  stroke="#ef4444" strokeWidth={1.5} fill="white"        dot={false} />
                        <Line type="monotone" dataKey="p50" name="Mediana (P50)" stroke="#2563eb" strokeWidth={2.5} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                    <p className="text-xs text-gray-400 mt-3 text-center">
                      GBM — parámetros estimados de datos históricos. No garantiza resultados futuros.
                    </p>
                  </div>
                </>
              )}

              {!mcResult && !mcLoading && (
                <div className="h-32 flex items-center justify-center bg-gray-50 rounded-xl">
                  <p className="text-gray-400 text-sm">
                    Hacé click en &quot;Simular&quot; para proyectar trayectorias futuras del portafolio
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

// ── Wrapper con Suspense (necesario para useSearchParams) ────────────────────

export default function BacktestPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <BacktestContent />
    </Suspense>
  );
}
