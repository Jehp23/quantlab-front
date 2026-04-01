"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { AssetCompareResponse } from "@/lib/types";

interface AssetComparisonChartProps {
  result: AssetCompareResponse;
}

const COLORS = [
  "#2563eb", // blue
  "#16a34a", // green
  "#dc2626", // red
  "#d97706", // amber
  "#7c3aed", // violet
  "#0891b2", // cyan
  "#be185d", // pink
  "#65a30d", // lime
];

export default function AssetComparisonChart({ result }: AssetComparisonChartProps) {
  // Flatten series for Recharts: { date, SPY: 100, QQQ: 98.5, ... }
  const chartData = result.series.map((pt) => ({ date: pt.date, ...pt.values }));

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={340}>
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            tickFormatter={(d) => d.slice(0, 7)}
            interval={Math.max(1, Math.floor(chartData.length / 6))}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            domain={["auto", "auto"]}
            width={55}
            tickFormatter={(v) => v.toFixed(0)}
          />
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
            }}
            formatter={(value, name) => [
              `${(value as number).toFixed(2)}`,
              name as string,
            ]}
            labelFormatter={(l) => `Fecha: ${l}`}
          />
          <Legend
            iconType="line"
            wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
          />
          {result.tickers.map((t, i) => (
            <Line
              key={t}
              type="monotone"
              dataKey={t}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}