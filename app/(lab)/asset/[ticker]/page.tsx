"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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
} from "recharts";
import Link from "next/link";
import { assetApi } from "@/lib/api";
import type { AssetAnalysisResponse } from "@/lib/types";

const PERIODS = ["1y", "2y", "5y", "max"];

const METRICS_CONFIG = [
  {
    key: "annual_return" as const,
    label: "Retorno Anual",
    format: (v: number) => `${v >= 0 ? "+" : ""}${(v * 100).toFixed(2)}%`,
    color: (v: number) => (v >= 0 ? "text-green-600" : "text-red-600"),
    tooltip: "Retorno geométrico anualizado sobre el período seleccionado. Captura el efecto compuesto real.",
  },
  {
    key: "sigma" as const,
    label: "Volatilidad (σ)",
    format: (v: number) => `${(v * 100).toFixed(2)}%`,
    color: () => "text-gray-900",
    tooltip: "Desviación estándar de retornos log, anualizada (×√252). Mide la dispersión de retornos.",
  },
  {
    key: "sharpe" as const,
    label: "Sharpe Ratio",
    format: (v: number) => v.toFixed(3),
    color: (v: number) => (v > 1 ? "text-green-600" : v > 0 ? "text-yellow-600" : "text-red-600"),
    tooltip: "Retorno excedente por unidad de riesgo total. >1 aceptable, >2 bueno, >3 excelente. Rf = 5%.",
  },
  {
    key: "sortino" as const,
    label: "Sortino Ratio",
    format: (v: number) => v.toFixed(3),
    color: (v: number) => (v > 1 ? "text-green-600" : v > 0 ? "text-yellow-600" : "text-red-600"),
    tooltip: "Como el Sharpe, pero solo penaliza la volatilidad a la baja. Sortino > Sharpe sugiere volatilidad predominantemente alcista.",
  },
  {
    key: "max_drawdown" as const,
    label: "Max Drawdown",
    format: (v: number) => `${(v * 100).toFixed(2)}%`,
    color: () => "text-red-600",
    tooltip: "Mayor caída desde un pico hasta un valle en toda la historia. ¿Cuánto perdías si comprabas en el peor momento?",
  },
  {
    key: "calmar" as const,
    label: "Calmar Ratio",
    format: (v: number) => v.toFixed(3),
    color: (v: number) => (v > 1 ? "text-green-600" : v > 0 ? "text-yellow-600" : "text-red-600"),
    tooltip: "Retorno anualizado / |Max Drawdown|. Retorno obtenido por cada unidad de riesgo máximo soportado.",
  },
  {
    key: "var_95" as const,
    label: "VaR 95% (diario)",
    format: (v: number) => `${(v * 100).toFixed(2)}%`,
    color: () => "text-gray-900",
    tooltip: "En el 95% de los días, la pérdida no superará este porcentaje. Asume distribución normal (subestima fat tails).",
  },
];

export default function AssetPage() {
  const params = useParams();
  const ticker = (params.ticker as string).toUpperCase();

  const [period, setPeriod] = useState("2y");
  const [data, setData] = useState<AssetAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setData(null);
    assetApi
      .analyze(ticker, period)
      .then(setData)
      .catch((e) => setError(e.message ?? "Error al cargar datos"))
      .finally(() => setLoading(false));
  }, [ticker, period]);

  const priceData = data?.ohlc.map((p) => ({ date: p.date, close: p.close })) ?? [];
  const volData = data?.rolling_vol ?? [];

  return (
    <div className="min-h-screen">
      {/* Nav bar */}
      <div className="nav-bar px-6 py-3 flex items-center gap-4 sticky top-0 z-10">
        <Link
          href="/"
          className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          ← Inicio
        </Link>
        <span className="text-gray-300">/</span>
        <Link
          href="/compare"
          className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          Comparar
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-semibold text-gray-800">{ticker}</span>

        <div className="ml-auto flex gap-1">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
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

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-700 font-medium">{error}</p>
            <p className="text-red-500 text-sm mt-1">
              Verificá que el ticker sea válido (ej: AAPL, SPY, MSFT).
            </p>
          </div>
        )}

        {/* Main content */}
        {data && !loading && (
          <>
            {/* Header */}
            <div className="card p-6 mb-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-3xl font-extrabold text-gray-900">{data.ticker}</h1>
                    <span
                      className={`text-base font-bold px-2 py-0.5 rounded-lg ${
                        data.quote.change_pct >= 0
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {data.quote.change_pct >= 0 ? "+" : ""}
                      {data.quote.change_pct.toFixed(2)}%
                    </span>
                  </div>
                  <p className="text-gray-500 mt-1 text-sm">{data.quote.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-extrabold text-gray-900">
                    {data.quote.currency}{" "}
                    {data.quote.price.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <p
                    className={`text-sm font-medium mt-1 ${
                      data.quote.change >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {data.quote.change >= 0 ? "+" : ""}
                    {data.quote.change.toFixed(2)} hoy
                  </p>
                </div>
              </div>

              {/* Quote metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-gray-100">
                {data.quote.fifty_two_week_high != null && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">52w Máx</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {data.quote.fifty_two_week_high.toFixed(2)}
                    </p>
                  </div>
                )}
                {data.quote.fifty_two_week_low != null && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">52w Mín</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {data.quote.fifty_two_week_low.toFixed(2)}
                    </p>
                  </div>
                )}
                {data.quote.market_cap != null && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
                      Market Cap
                    </p>
                    <p className="text-sm font-semibold text-gray-800">
                      {data.quote.market_cap >= 1e12
                        ? `${(data.quote.market_cap / 1e12).toFixed(2)}T`
                        : `${(data.quote.market_cap / 1e9).toFixed(1)}B`}
                    </p>
                  </div>
                )}
                {data.quote.dividend_yield != null && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
                      Dividendo
                    </p>
                    <p className="text-sm font-semibold text-gray-800">
                      {(data.quote.dividend_yield * 100).toFixed(2)}%
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Price AreaChart */}
              <div className="card p-6">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
                  Precio histórico — cierre
                </h2>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart
                    data={priceData}
                    margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "#9ca3af" }}
                      tickFormatter={(d) => d.slice(0, 7)}
                      interval={Math.max(1, Math.floor(priceData.length / 6))}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#9ca3af" }}
                      domain={["auto", "auto"]}
                      width={60}
                      tickFormatter={(v) => v.toFixed(0)}
                    />
                    <Tooltip
                      contentStyle={{
                        fontSize: 12,
                        borderRadius: 8,
                        border: "1px solid #e5e7eb",
                      }}
                      formatter={(value) => [
                        `${data.quote.currency} ${(value as number).toFixed(2)}`,
                        "Precio cierre",
                      ]}
                      labelFormatter={(l) => `Fecha: ${l}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="close"
                      stroke="#2563eb"
                      strokeWidth={2}
                      fill="url(#priceGrad)"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Rolling Vol LineChart */}
              <div className="card p-6">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
                  Volatilidad histórica rolling — ventana 21 días
                </h2>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart
                    data={volData}
                    margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "#9ca3af" }}
                      tickFormatter={(d) => d.slice(0, 7)}
                      interval={Math.max(1, Math.floor(volData.length / 6))}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#9ca3af" }}
                      domain={[0, "auto"]}
                      width={55}
                      tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                    />
                    <Tooltip
                      contentStyle={{
                        fontSize: 12,
                        borderRadius: 8,
                        border: "1px solid #e5e7eb",
                      }}
                      formatter={(value) => [
                        `${((value as number) * 100).toFixed(2)}%`,
                        "Vol. anualizada",
                      ]}
                      labelFormatter={(l) => `Fecha: ${l}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="volatility"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Metrics grid */}
            <div className="card p-6 mb-6">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-5">
                Métricas — período {period} · benchmark {data.benchmark} · Rf = 5%
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {METRICS_CONFIG.map(({ key, label, format, color, tooltip }) => (
                  <div key={key} className="metric-cell p-4 relative group">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                    <p className={`text-xl font-bold ${color(data.metrics[key])}`}>
                      {format(data.metrics[key])}
                    </p>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-gray-900 text-white text-xs rounded-lg p-2.5 hidden group-hover:block z-20 text-center shadow-xl pointer-events-none leading-relaxed">
                      {tooltip}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                    </div>
                  </div>
                ))}

                {/* Beta */}
                <div className="metric-cell p-4 relative group">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                    Beta vs {data.benchmark}
                  </p>
                  <p
                    className={`text-xl font-bold ${
                      data.metrics.beta != null
                        ? data.metrics.beta > 1.2
                          ? "text-red-600"
                          : data.metrics.beta < 0.8
                          ? "text-green-600"
                          : "text-gray-900"
                        : "text-gray-400"
                    }`}
                  >
                    {data.metrics.beta != null ? data.metrics.beta.toFixed(3) : "—"}
                  </p>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-gray-900 text-white text-xs rounded-lg p-2.5 hidden group-hover:block z-20 text-center shadow-xl pointer-events-none leading-relaxed">
                    β = Cov(r_activo, r_mercado) / Var(r_mercado). β=1: se mueve igual que el mercado.
                    β&gt;1: amplifica. β&lt;1: amortigua. β&lt;0: cobertura natural.
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                  </div>
                </div>

                {/* Alpha de Jensen */}
                <div className="metric-cell p-4 relative group">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                    Alpha (Jensen)
                  </p>
                  <p
                    className={`text-xl font-bold ${
                      data.metrics.alpha != null
                        ? data.metrics.alpha >= 0
                          ? "text-green-600"
                          : "text-red-600"
                        : "text-gray-400"
                    }`}
                  >
                    {data.metrics.alpha != null
                      ? `${data.metrics.alpha >= 0 ? "+" : ""}${(data.metrics.alpha * 100).toFixed(2)}%`
                      : "—"}
                  </p>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-gray-900 text-white text-xs rounded-lg p-2.5 hidden group-hover:block z-20 text-center shadow-xl pointer-events-none leading-relaxed">
                    α = r_activo − [Rf + β(r_mercado − Rf)]. Retorno excedente ajustado por riesgo sistemático.
                    α&gt;0: ganó al mercado dado su beta. La evidencia empírica sugiere que es muy difícil sostenerlo.
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-4">
                * Pasá el cursor sobre cada métrica para ver su definición financiera.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
