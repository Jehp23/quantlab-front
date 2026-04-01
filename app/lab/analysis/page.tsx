"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { assetApi } from "@/lib/api";
import { useAssetHistoryStore } from "@/lib/store";
import type { AssetCompareResponse } from "@/lib/types";
import AssetSelector from "@/components/lab/AssetSelector";
import AssetComparisonChart from "@/components/lab/AssetComparisonChart";
import AssetMetricsTable from "@/components/lab/AssetMetricsTable";

const PERIODS = ["1y", "2y", "5y"];

const DEFAULT_TICKERS = ["SPY", "QQQ", "GLD"];

export default function AnalysisPage() {
  const {
    addViewedTickers,
    compareTickers,
    setCompareTickers,
    setSelectedTicker,
  } = useAssetHistoryStore();
  const [tickers, setTickers] = useState<string[]>(
    compareTickers.length ? compareTickers : DEFAULT_TICKERS,
  );
  const [period, setPeriod] = useState("2y");
  const [result, setResult] = useState<AssetCompareResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (compareTickers.length) {
      setTickers(compareTickers);
    }
  }, [compareTickers]);

  function handleTickersChange(nextTickers: string[]) {
    setTickers(nextTickers);
    setCompareTickers(nextTickers);
    setSelectedTicker(nextTickers[0] ?? null);
  }

  async function handleAnalyze() {
    if (tickers.length < 2) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await assetApi.compare(tickers, period);
      setResult(data);
      addViewedTickers(tickers);
      setCompareTickers(tickers);
      setSelectedTicker(tickers[0] ?? null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <div className="nav-bar sticky top-0 z-10 flex items-center gap-4 px-6 py-3">
        <Link
          href="/"
          className="text-sm text-slate-500 transition-colors hover:text-slate-900"
        >
          ← Laboratorio
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm font-semibold text-slate-900">Análisis de activos</span>
      </div>

      <div className="page-shell">
        <section className="mb-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="card p-7">
            <p className="eyebrow mb-3">Vista comparativa</p>
            <h1 className="mb-3 text-3xl font-black tracking-tight text-slate-900">Análisis de activos</h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-500">
              Compará series históricas y métricas clave en un entorno más limpio, pensado para leer retorno,
              volatilidad y drawdown sin distracciones.
            </p>
          </div>
          <div className="surface-subtle p-5">
            <p className="eyebrow mb-3">Lectura sugerida</p>
            <div className="space-y-2 text-sm text-slate-500">
              <p>1. Mirá performance relativa para contexto.</p>
              <p>2. Validá Sharpe y Sortino para calidad del retorno.</p>
              <p>3. Cerrá con drawdown y VaR para estrés histórico.</p>
            </div>
          </div>
        </section>

        <div className="card mb-6 p-6">
          <div className="mb-6">
            <p className="eyebrow mb-2">Selección</p>
            <h2 className="text-lg font-bold text-slate-900">Elegí los activos a comparar</h2>
          </div>

          <AssetSelector
            tickers={tickers}
            onTickersChange={handleTickersChange}
            maxTickers={8}
            showRecent={true}
          />

          {/* Controls row */}
          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-200/80 pt-5">
            <div className="flex gap-1.5">
              {PERIODS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                    period === p
                      ? "bg-[#1f4d3a] text-white"
                      : "bg-[#f4f6f2] text-slate-600 hover:bg-[#edf1ec]"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <button
              onClick={() => handleTickersChange(DEFAULT_TICKERS)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              Reiniciar selección
            </button>

            <button
              onClick={handleAnalyze}
              disabled={loading || tickers.length < 2}
              className="ml-auto rounded-xl bg-[#1f4d3a] px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#183b2d] disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analizando...
                </span>
              ) : (
                "Analizar →"
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-center">
            <p className="font-medium text-rose-700">{error}</p>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <>
            {/* Normalized chart */}
            <div className="card mb-6 p-6">
              <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="eyebrow mb-2">Serie comparada</p>
                  <h2 className="text-lg font-bold text-slate-900">Performance relativa</h2>
                </div>
                <span className="text-xs text-slate-400">
                  Un valor de 150 = +50% desde el inicio del período
                </span>
              </div>
              <AssetComparisonChart result={result} />
            </div>

            {/* Metrics table */}
            <div className="card overflow-hidden">
              <div className="border-b border-slate-200/80 px-6 py-5">
                <p className="eyebrow mb-2">Métricas</p>
                <h2 className="text-lg font-bold text-slate-900">
                  Riesgo y retorno comparado
                </h2>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Métricas de riesgo y retorno · Rf = 5% · período {result.period}
                </p>
              </div>
              <AssetMetricsTable result={result} />
              <div className="border-t border-slate-200/80 bg-[#fafbf8] px-6 py-4">
                <p className="text-xs text-slate-400">
                  Sharpe y Sortino: &gt;1 aceptable · &gt;2 bueno. Max DD siempre negativo (caída máxima).
                  Hacé click en un ticker para ver su análisis detallado.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
