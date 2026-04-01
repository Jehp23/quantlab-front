"use client";

import { useState } from "react";
import { marketApi } from "@/lib/api";
import { useAssetHistoryStore } from "@/lib/store";

interface AssetSelectorProps {
  tickers: string[];
  onTickersChange: (tickers: string[]) => void;
  maxTickers?: number;
  showRecent?: boolean;
}

export default function AssetSelector({
  tickers,
  onTickersChange,
  maxTickers = 8,
  showRecent = true,
}: AssetSelectorProps) {
  const { viewedAssets, selectedTicker, setSelectedTicker, upsertViewedAsset } = useAssetHistoryStore();
  const [tickerInput, setTickerInput] = useState("");

  async function enrichAsset(ticker: string) {
    try {
      const quote = await marketApi.getQuote(ticker);
      upsertViewedAsset({
        ticker,
        name: quote.name,
        price: quote.price,
        changePct: quote.change_pct,
        updatedAt: Date.now(),
      });
    } catch {
      upsertViewedAsset({ ticker, updatedAt: Date.now() });
    }
  }

  function addTicker() {
    const t = tickerInput.trim().toUpperCase();
    if (t && !tickers.includes(t) && tickers.length < maxTickers) {
      onTickersChange([...tickers, t]);
      setSelectedTicker(t);
      void enrichAsset(t);
    }
    setTickerInput("");
  }

  function removeTicker(t: string) {
    onTickersChange(tickers.filter((x) => x !== t));
  }

  function addFromRecent(t: string) {
    if (!tickers.includes(t) && tickers.length < maxTickers) {
      onTickersChange([...tickers, t]);
      setSelectedTicker(t);
    }
  }

  return (
    <div className="space-y-5">
      {/* Ticker chips */}
      <div className="flex min-h-[2rem] flex-wrap gap-2">
        {tickers.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm"
          >
            {t}
            <button
              onClick={() => removeTicker(t)}
              className="hover:opacity-70 leading-none text-sm font-bold"
              aria-label={`Quitar ${t}`}
            >
              ×
            </button>
          </span>
        ))}
        {tickers.length === 0 && (
          <span className="text-xs text-gray-400 self-center">
            Agregá activos para comenzar
          </span>
        )}
      </div>

      {/* Input controls */}
      <div className="surface-subtle flex flex-wrap items-center gap-3 p-3">
        <input
          type="text"
          value={tickerInput}
          onChange={(e) => setTickerInput(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && addTicker()}
          placeholder="Ticker (ej: AAPL)"
          className="h-11 w-44 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-[#1f4d3a] focus:ring-0"
          maxLength={10}
        />
        <button
          onClick={addTicker}
          disabled={tickers.length >= maxTickers || !tickerInput.trim()}
          className="h-11 rounded-xl bg-[#1f4d3a] px-4 text-sm font-semibold text-white transition hover:bg-[#183b2d] disabled:opacity-40"
        >
          + Agregar
        </button>
        <span className="ml-auto text-xs text-slate-400">
          {tickers.length}/{maxTickers} activos
        </span>
      </div>

      {/* Recent assets */}
      {showRecent && viewedAssets.length > 0 && (
        <div className="border-t border-slate-200/80 pt-3">
          <p className="eyebrow mb-3">Activos vistos recientemente</p>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {viewedAssets.slice(0, 10).map((asset) => (
              <button
                key={asset.ticker}
                onClick={() => addFromRecent(asset.ticker)}
                disabled={tickers.includes(asset.ticker) || tickers.length >= maxTickers}
                className={`rounded-2xl border px-3 py-3 text-left text-xs transition-all ${
                  selectedTicker === asset.ticker
                    ? "border-[#1f4d3a] bg-[#f3f7f4] text-[#1f4d3a]"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                } disabled:bg-slate-50 disabled:text-slate-400`}
              >
                <div className="font-semibold">{asset.ticker}</div>
                {asset.name && (
                  <div className={`max-w-[10rem] truncate text-[11px] ${selectedTicker === asset.ticker ? "text-slate-600" : "text-slate-400"}`}>{asset.name}</div>
                )}
                {typeof asset.price === "number" && (
                  <div className="mt-0.5 flex items-center gap-1">
                    <span>${asset.price.toFixed(2)}</span>
                    {typeof asset.changePct === "number" && (
                      <span className={asset.changePct >= 0 ? "text-[#1f4d3a]" : "text-rose-500"}>
                        {asset.changePct >= 0 ? "+" : ""}
                        {asset.changePct.toFixed(2)}%
                      </span>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
