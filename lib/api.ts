/**
 * Cliente HTTP centralizado hacia FastAPI.
 * Todas las llamadas al backend deben pasar por este módulo.
 * Nunca hacer fetch directo desde componentes — siempre usar estas funciones.
 */

import type {
  QuoteResponse,
  HistoricalResponse,
  ARStocksResponse,
  ARCedearsResponse,
  PortfolioAnalyzeRequest,
  PortfolioAnalyzeResponse,
  PortfolioBuildRequest,
  PortfolioBuildResponse,
  EquityCurveResponse,
  AssetAnalysisResponse,
  AssetCompareResponse,
  FrontierPoint,
  OptimizeRequest,
  OptimizeResponse,
  BacktestRequest,
  BacktestResponse,
  MonteCarloRequest,
  MonteCarloResponse,
  OptionChainResponse,
  VolatilityData,
} from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail ?? `HTTP ${res.status}`);
  }
  return res.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail ?? `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Market ──────────────────────────────────────────────────────────────────

export const marketApi = {
  getQuote: (ticker: string) =>
    get<QuoteResponse>(`/market/quote?ticker=${encodeURIComponent(ticker)}`),

  getHistorical: (ticker: string, period = "1y") =>
    get<HistoricalResponse>(
      `/market/historical?ticker=${encodeURIComponent(ticker)}&period=${period}`
    ),

  getARStocks: () => get<ARStocksResponse>("/market/ar/stocks"),

  getARCedears: () => get<ARCedearsResponse>("/market/ar/cedears"),

  getARHistorical: (ticker: string, assetType: "stocks" | "cedears" | "bonds" = "stocks") =>
    get<{ ticker: string; asset_type: string; data: unknown[] }>(
      `/market/ar/historical/${encodeURIComponent(ticker)}?asset_type=${assetType}`
    ),
};

// ── Portfolio ────────────────────────────────────────────────────────────────

export const portfolioApi = {
  analyze: (body: PortfolioAnalyzeRequest) =>
    post<PortfolioAnalyzeResponse>("/portfolio/analyze", body),

  build: (body: PortfolioBuildRequest) =>
    post<PortfolioBuildResponse>("/portfolio/build", body),

  equityCurve: (body: PortfolioAnalyzeRequest) =>
    post<EquityCurveResponse>("/portfolio/equity-curve", body),
};

// ── Asset ─────────────────────────────────────────────────────────────────────

export const assetApi = {
  analyze: (ticker: string, period = "2y", benchmark = "SPY") =>
    get<AssetAnalysisResponse>(
      `/asset/analyze?ticker=${encodeURIComponent(ticker)}&period=${period}&benchmark=${encodeURIComponent(benchmark)}`
    ),

  compare: (tickers: string[], period = "2y") =>
    post<AssetCompareResponse>("/asset/compare", { tickers, period }),
};

// ── Optimize ─────────────────────────────────────────────────────────────────

export const optimizeApi = {
  maxSharpe: (body: OptimizeRequest) =>
    post<OptimizeResponse>("/optimize/max-sharpe", body),

  minVariance: (body: OptimizeRequest) =>
    post<OptimizeResponse>("/optimize/min-variance", body),

  riskParity: (body: OptimizeRequest) =>
    post<OptimizeResponse>("/optimize/risk-parity", body),

  frontier: (tickers: string[], period = "5y") =>
    get<FrontierPoint[]>(`/optimize/frontier?tickers=${tickers.join(",")}&period=${period}`),
};

// ── Backtest ──────────────────────────────────────────────────────────────────

export const backtestApi = {
  run: (body: BacktestRequest) =>
    post<BacktestResponse>("/backtest/run", body),
};

// ── Monte Carlo ───────────────────────────────────────────────────────────────

export const montecarloApi = {
  run: (body: MonteCarloRequest) =>
    post<MonteCarloResponse>("/montecarlo/run", body),
};

// ── Statistics Lab ────────────────────────────────────────────────────────────

export const statisticsApi = {
  fullAnalysis: (ticker: string, period = "2y") =>
    get<import("./types").FullAnalysisResponse>(
      `/statistics/full?ticker=${encodeURIComponent(ticker)}&period=${period}`
    ),
};

// ── Options ───────────────────────────────────────────────────────────────────

export const optionsApi = {
  getChain: (ticker: string) =>
    get<OptionChainResponse>(`/options/chain/${encodeURIComponent(ticker)}`),

  getVolatilities: (ticker: string) =>
    get<VolatilityData>(`/options/volatilities/${encodeURIComponent(ticker)}`),
};
