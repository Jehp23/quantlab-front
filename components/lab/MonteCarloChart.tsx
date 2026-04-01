"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { MonteCarloResponse } from "@/lib/types";

interface MonteCarloChartProps {
  result: MonteCarloResponse;
  horizonLabel: string;
}

export default function MonteCarloChart({ result, horizonLabel }: MonteCarloChartProps) {
  // Chart data
  const chartData = result.percentile_50.map((_, t) => ({
    t,
    p5: result.percentile_5[t],
    p50: result.percentile_50[t],
    p95: result.percentile_95[t],
  }));

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={340}>
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="mcBandUpper" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#c5d4cc" stopOpacity={0.45} />
              <stop offset="95%" stopColor="#c5d4cc" stopOpacity={0.08} />
            </linearGradient>
            <linearGradient id="mcBandLower" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#e4ebe6" stopOpacity={0.55} />
              <stop offset="95%" stopColor="#e4ebe6" stopOpacity={0.12} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.08)" />
          <XAxis
            dataKey="t"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            tickFormatter={(t) => `${t} días`}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            tickFormatter={(v) => `$${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
          />
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 12,
              border: "1px solid rgba(15,23,42,0.08)",
              backgroundColor: "#ffffff",
              color: "#0f172a",
            }}
            formatter={(value, name) => [
              `$${Number(value).toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
              name === "p5" ? "P5 (Pesimista)" : name === "p50" ? "P50 (Mediana)" : "P95 (Optimista)",
            ]}
            labelFormatter={(l) => `Día ${l}`}
          />
          <Area
            type="monotone"
            dataKey="p95"
            stackId="1"
            stroke="#b9c8c0"
            fill="url(#mcBandUpper)"
            strokeWidth={1}
          />
          <Area
            type="monotone"
            dataKey="p5"
            stackId="2"
            stroke="#d7e2dc"
            fill="url(#mcBandLower)"
            strokeWidth={1}
          />
          <Area
            type="monotone"
            dataKey="p50"
            stackId="3"
            stroke="#1f4d3a"
            fill="none"
            strokeWidth={2.25}
          />
        </AreaChart>
      </ResponsiveContainer>
      <p className="mt-3 text-center text-xs text-slate-400">
        Banda sombreada: rango P5–P95. Línea central: mediana (P50). Horizonte: {horizonLabel}.
      </p>
    </div>
  );
}
