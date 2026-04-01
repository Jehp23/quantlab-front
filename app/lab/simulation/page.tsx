"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { montecarloApi } from "@/lib/api";
import { useAssetHistoryStore } from "@/lib/store";
import type { MonteCarloResponse } from "@/lib/types";
import AssetSelector from "@/components/lab/AssetSelector";
import WeightSelector from "@/components/lab/WeightSelector";
import MonteCarloChart from "@/components/lab/MonteCarloChart";

// ── Constantes ───────────────────────────────────────────────────────────────

const MC_HORIZONS = [
  { days: 63,   label: "3 meses" },
  { days: 126,  label: "6 meses" },
  { days: 252,  label: "1 año"   },
  { days: 504,  label: "2 años"  },
  { days: 756,  label: "3 años"  },
];

const MC_SIMS = [500, 1000, 5000];

// ── Componente Principal ──────────────────────────────────────────────────────

export default function SimulationPage() {
  const {
    addViewedTickers,
    compareTickers,
    setCompareTickers,
    setSelectedTicker,
  } = useAssetHistoryStore();
  const defaultTickers = compareTickers.length ? compareTickers.slice(0, 3) : ["SPY", "QQQ", "AGG"];
  const [tickers,     setTickers]     = useState<string[]>(defaultTickers);
  const [weights,     setWeights]     = useState<number[]>([0.5, 0.3, 0.2]);
  const [initialValue, setInitialValue] = useState(10000);
  const [mcHorizon,  setMcHorizon]   = useState(252);
  const [mcSims,     setMcSims]      = useState(1000);

  const [mcResult,  setMcResult]  = useState<MonteCarloResponse | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const weightSum = weights.reduce((a, b) => a + b, 0);

  useEffect(() => {
    if (compareTickers.length) {
      const nextTickers = compareTickers.slice(0, 3);
      const nextWeights = nextTickers.map(() => parseFloat((1 / nextTickers.length).toFixed(4)));
      setTickers(nextTickers);
      setWeights(nextWeights);
    }
  }, [compareTickers]);

  function handleTickersChange(newTickers: string[]) {
    const newWeights = newTickers.map(() => parseFloat((1 / newTickers.length).toFixed(4)));
    setTickers(newTickers);
    setWeights(newWeights);
    setCompareTickers(newTickers);
    setSelectedTicker(newTickers[0] ?? null);
  }

  function resetSimulation() {
    setTickers(defaultTickers);
    setWeights(defaultTickers.map(() => parseFloat((1 / defaultTickers.length).toFixed(4))));
    setInitialValue(10000);
    setMcHorizon(252);
    setMcSims(1000);
    setMcResult(null);
    setError(null);
  }

  async function handleSimulate() {
    const normalized = weights.map((w) => w / weightSum);
    setLoading(true);
    setError(null);
    setMcResult(null);
    try {
      const data = await montecarloApi.run({
        tickers,
        weights: normalized,
        horizon_days: mcHorizon,
        simulations: mcSims,
        initial_value: initialValue,
      });
      setMcResult(data);
      addViewedTickers(tickers);
      setCompareTickers(tickers);
      setSelectedTicker(tickers[0] ?? null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  // Chart data
  // const mcChartData = mcResult
  //   ? mcResult.percentile_50.map((_, t) => ({
  //       t,
  //       p5:  mcResult.percentile_5[t],
  //       p50: mcResult.percentile_50[t],
  //       p95: mcResult.percentile_95[t],
  //     }))
  //   : [];

  const mcFinal  = mcResult?.final_values ?? [];
  const mcMedian = mcResult ? mcResult.percentile_50[mcResult.percentile_50.length - 1] : 0;
  const mcP5     = mcResult ? mcResult.percentile_5[mcResult.percentile_5.length - 1]   : 0;
  const mcP95    = mcResult ? mcResult.percentile_95[mcResult.percentile_95.length - 1] : 0;
  const mcWinProb = mcFinal.length
    ? ((mcFinal.filter((v) => v > initialValue).length / mcFinal.length) * 100).toFixed(1)
    : null;

  const horizonLabel = MC_HORIZONS.find((h) => h.days === mcHorizon)?.label ?? "";

  return (
    <div className="min-h-screen">
      <div className="nav-bar sticky top-0 z-10 flex items-center gap-4 px-6 py-3">
        <Link href="/" className="text-sm text-slate-500 transition-colors hover:text-slate-900">
          ← Laboratorio
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm font-semibold text-slate-900">Simulación</span>
      </div>

      <div className="page-shell max-w-5xl">
        <section className="mb-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="card p-7">
            <p className="eyebrow mb-3">Escenarios</p>
            <h1 className="mb-3 text-3xl font-black tracking-tight text-slate-900">Simulación</h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-500">
              Construí un portafolio simple y proyectá trayectorias futuras en una interfaz más ordenada,
              enfocada en percentiles, dispersión y lectura rápida.
            </p>
          </div>
          <div className="surface-subtle p-5">
            <p className="eyebrow mb-3">Lectura sugerida</p>
            <div className="space-y-2 text-sm text-slate-500">
              <p>1. Usá P50 como escenario base.</p>
              <p>2. P5 y P95 delimitan el rango probable.</p>
              <p>3. Mirá la probabilidad de superar el capital inicial.</p>
            </div>
          </div>
        </section>

        <div className="card mb-6 p-6">
          <div className="mb-6">
            <p className="eyebrow mb-2">Configuración</p>
            <h2 className="text-lg font-bold text-slate-900">Portafolio y parámetros</h2>
          </div>
          <p className="mb-6 max-w-2xl text-sm text-slate-500">
            Proyección estocástica usando <strong>Geometric Brownian Motion (GBM)</strong>. Estima μ y σ de los datos
            históricos del portafolio y genera N trayectorias de precio futuras. Los percentiles P5/P50/P95 delimitan
            el rango de resultados probables.
          </p>

          <AssetSelector
            tickers={tickers}
            onTickersChange={handleTickersChange}
            maxTickers={8}
            showRecent={true}
          />

          <WeightSelector
            tickers={tickers}
            weights={weights}
            onWeightsChange={setWeights}
          />

          {/* Simulation params */}
          <div className="mt-6 flex flex-wrap items-end gap-5 border-t border-slate-200/80 pt-5">
            {/* Capital inicial */}
            <div>
              <p className="eyebrow mb-2">Capital inicial ($)</p>
              <input
                type="number"
                min={1000}
                step={1000}
                value={initialValue}
                onChange={(e) => setInitialValue(parseFloat(e.target.value) || 10000)}
                className="h-11 w-32 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-[#1f4d3a] focus:ring-0"
              />
            </div>

            {/* Horizonte */}
            <div>
              <p className="eyebrow mb-2">Horizonte</p>
              <div className="flex gap-1.5">
                {MC_HORIZONS.map(({ days, label }) => (
                  <button
                    key={days}
                    onClick={() => setMcHorizon(days)}
                    className={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                      mcHorizon === days
                        ? "bg-[#1f4d3a] text-white"
                        : "bg-[#f4f6f2] text-slate-600 hover:bg-[#edf1ec]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* N simulaciones */}
            <div>
              <p className="eyebrow mb-2">Simulaciones</p>
              <div className="flex gap-1.5">
                {MC_SIMS.map((n) => (
                  <button
                    key={n}
                    onClick={() => setMcSims(n)}
                    className={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                      mcSims === n
                        ? "bg-[#1f4d3a] text-white"
                        : "bg-[#f4f6f2] text-slate-600 hover:bg-[#edf1ec]"
                    }`}
                  >
                    {n.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={resetSimulation}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              Nuevo experimento
            </button>

            <button
              onClick={handleSimulate}
              disabled={loading || tickers.length < 1 || Math.abs(weightSum - 1) > 0.05}
              className="ml-auto rounded-xl bg-[#1f4d3a] px-8 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#183b2d] disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Simulando...
                </span>
              ) : (
                "Simular →"
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <p className="text-sm font-medium text-rose-700">{error}</p>
          </div>
        )}

        {/* ══ Resultados ══════════════════════════════════════════════════════════ */}
        {mcResult && (
          <>
            {/* KPIs */}
            <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: "Capital inicial",  value: `$${initialValue.toLocaleString("en-US")}`,                                                                               color: "text-slate-900" },
                { label: "Mediana (P50)",     value: `$${mcMedian.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,                                                      color: "text-slate-900" },
                { label: "Pesimista (P5)",    value: `$${mcP5.toLocaleString("en-US",    { maximumFractionDigits: 0 })}`,                                                       color: "text-rose-500"  },
                { label: "Optimista (P95)",   value: `$${mcP95.toLocaleString("en-US",   { maximumFractionDigits: 0 })}`,                                                       color: "text-[#1f4d3a]"},
              ].map(({ label, value, color }) => (
                <div key={label} className="metric-cell p-4">
                  <p className="mb-1 text-xs uppercase tracking-wide text-slate-400">{label}</p>
                  <p className={`text-xl font-bold ${color}`}>{value}</p>
                </div>
              ))}
            </div>

            <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {[
                { label: "% supera inicial",  value: `${mcWinProb}%`,                                                                                                          color: parseFloat(mcWinProb ?? "0") > 50 ? "text-[#1f4d3a]" : "text-rose-500" },
                { label: "Retorno mediano",    value: `${mcMedian > initialValue ? "+" : ""}${(((mcMedian - initialValue) / initialValue) * 100).toFixed(1)}%`,               color: mcMedian >= initialValue ? "text-[#1f4d3a]" : "text-rose-500" },
                { label: "Horizonte",          value: horizonLabel,                                                                                                             color: "text-slate-900" },
              ].map(({ label, value, color }) => (
                <div key={label} className="metric-cell p-4">
                  <p className="mb-1 text-xs uppercase tracking-wide text-slate-400">{label}</p>
                  <p className={`text-xl font-bold ${color}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Trayectorias proyectadas */}
            <div className="card mb-6 p-6">
              <div className="mb-4">
                <p className="eyebrow mb-2">Trayectorias</p>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Trayectorias proyectadas — {mcSims.toLocaleString()} simulaciones GBM — horizonte {horizonLabel}
                </p>
              </div>
              <MonteCarloChart result={mcResult} horizonLabel={horizonLabel} />
            </div>

            {/* Interpretación */}
            <div className="card p-6">
              <div className="mb-4">
                <p className="eyebrow mb-2">Notas</p>
                <h2 className="text-lg font-bold text-slate-900">Interpretación del modelo</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 text-sm text-slate-500 sm:grid-cols-2">
                <div className="surface-subtle p-4">
                  <p className="mb-1 font-semibold text-slate-900">Geometric Brownian Motion (GBM)</p>
                  <p className="text-xs leading-relaxed text-slate-500">
                    El modelo GBM asume que los retornos siguen una distribución log-normal con deriva μ y
                    volatilidad σ constantes, estimados de los datos históricos del portafolio.
                  </p>
                </div>
                <div className="surface-subtle p-4">
                  <p className="mb-1 font-semibold text-slate-900">Limitaciones</p>
                  <p className="text-xs leading-relaxed text-slate-500">
                    GBM no captura fat tails, volatility clustering ni correlaciones cambiantes.
                    Los resultados son probabilísticos y no garantizan el futuro.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
