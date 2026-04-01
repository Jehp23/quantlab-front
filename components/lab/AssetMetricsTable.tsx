"use client";

import { AssetCompareResponse } from "@/lib/types";

interface AssetMetricsTableProps {
  result: AssetCompareResponse;
}

export default function AssetMetricsTable({ result }: AssetMetricsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200/80 text-slate-500">
            <th className="px-6 py-4 text-left font-semibold">Ticker</th>
            <th className="px-4 py-4 text-right font-semibold">Retorno Anual</th>
            <th className="px-4 py-4 text-right font-semibold">Volatilidad</th>
            <th className="px-4 py-4 text-right font-semibold">Sharpe</th>
            <th className="px-4 py-4 text-right font-semibold">Sortino</th>
            <th className="px-4 py-4 text-right font-semibold">Max DD</th>
            <th className="px-4 py-4 text-right font-semibold">Calmar</th>
            <th className="px-4 py-4 text-right font-semibold">VaR 95%</th>
          </tr>
        </thead>
        <tbody>
          {result.tickers.map((ticker) => {
            const tickerMetrics = result.metrics.find(m => m.ticker === ticker);
            if (!tickerMetrics) return null;
            const metrics = tickerMetrics.metrics;
            const positiveReturn = metrics.annual_return >= 0;
            return (
              <tr key={ticker} className="border-b border-slate-100 transition hover:bg-[#fafbf8]">
                <td className="px-6 py-4 font-semibold text-slate-900">{ticker}</td>
                <td className={`px-4 py-4 text-right font-medium ${positiveReturn ? "text-[#1f4d3a]" : "text-rose-500"}`}>{(metrics.annual_return * 100).toFixed(1)}%</td>
                <td className="px-4 py-4 text-right text-slate-600">{(metrics.sigma * 100).toFixed(1)}%</td>
                <td className="px-4 py-4 text-right text-slate-600">{metrics.sharpe.toFixed(2)}</td>
                <td className="px-4 py-4 text-right text-slate-600">{metrics.sortino.toFixed(2)}</td>
                <td className="px-4 py-4 text-right text-rose-500">{(metrics.max_drawdown * 100).toFixed(1)}%</td>
                <td className="px-4 py-4 text-right text-slate-600">{metrics.calmar.toFixed(2)}</td>
                <td className="px-4 py-4 text-right text-slate-600">{(metrics.var_95 * 100).toFixed(1)}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
