"use client";

interface WeightSelectorProps {
  tickers: string[];
  weights: number[];
  onWeightsChange: (weights: number[]) => void;
}

export default function WeightSelector({ tickers, weights, onWeightsChange }: WeightSelectorProps) {
  const weightSum = weights.reduce((a, b) => a + b, 0);

  function updateWeight(i: number, val: string) {
    const v = parseFloat(val);
    if (isNaN(v)) return;
    const newWeights = [...weights];
    newWeights[i] = v;
    onWeightsChange(newWeights);
  }

  function normalizeWeights() {
    const sum = weights.reduce((a, b) => a + b, 0);
    if (sum === 0) return;
    onWeightsChange(weights.map((w) => parseFloat((w / sum).toFixed(4))));
  }

  return (
    <div className="space-y-4">
      <p className="eyebrow">
        Pesos del portafolio
      </p>
      <div className="space-y-3">
        {tickers.map((t, i) => (
          <div key={t} className="surface-subtle flex items-center gap-3 px-4 py-3">
            <span className="w-14 text-sm font-semibold text-slate-900">{t}</span>
            <input
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={weights[i] ?? 0}
              onChange={(e) => updateWeight(i, e.target.value)}
              className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#1f4d3a] focus:ring-0"
            />
            <div className="h-2 flex-1 rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-[#1f4d3a] transition-all"
                style={{ width: `${Math.min(100, (weights[i] ?? 0) / Math.max(weightSum, 1) * 100)}%` }}
              />
            </div>
            <span className="w-12 text-right text-xs text-slate-500">
              {((weights[i] ?? 0) / weightSum * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={normalizeWeights}
          className="text-xs font-medium text-slate-600 transition hover:text-slate-900"
        >
          Normalizar pesos
        </button>
        <span className={`ml-auto text-xs font-semibold ${Math.abs(weightSum - 1) > 0.02 ? "text-rose-500" : "text-[#1f4d3a]"}`}>
          ∑ = {(weightSum * 100).toFixed(1)}%
        </span>
      </div>
    </div>
  );
}
