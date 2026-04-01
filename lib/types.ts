/**
 * Tipos TypeScript — espejo de los schemas Pydantic del backend.
 * Mantener sincronizado con backend/models/schemas.py.
 */

// ── Market ─────────────────────────────────────────────────────────────────

export interface QuoteResponse {
  ticker: string;
  name: string;
  price: number;
  currency: string;
  change: number;
  change_pct: number;
  volume?: number | null;
  market_cap?: number | null;
  fifty_two_week_high?: number | null;
  fifty_two_week_low?: number | null;
  beta?: number | null;
  dividend_yield?: number | null;
}

export interface OHLCPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number | null;
}

export interface HistoricalResponse {
  ticker: string;
  period: string;
  data: OHLCPoint[];
}

export interface ARStockItem {
  symbol: string;
  price: number;
  change_pct: number;
  bid?: number | null;
  ask?: number | null;
  volume?: number | null;
}

export interface ARStocksResponse {
  data: ARStockItem[];
  count: number;
}

export interface ARCedearsResponse {
  data: ARStockItem[];
  count: number;
}

// ── Portfolio ───────────────────────────────────────────────────────────────

export interface PortfolioMetrics {
  annual_return: number;
  sigma: number;
  sharpe: number;
  sortino: number;
  calmar: number;
  max_drawdown: number;
  var_95: number;
  correlation: Record<string, Record<string, number>>;
}

export interface PortfolioAnalyzeRequest {
  tickers: string[];
  weights: number[];
  period?: string;
}

export interface PortfolioAnalyzeResponse {
  tickers: string[];
  weights: number[];
  period: string;
  metrics: PortfolioMetrics;
}

export interface PortfolioBuildRequest {
  risk_score: number;
  investment_goal?: string;
  horizon_years?: number;
  liquidity_need?: string;
  experience_level?: string;
  monthly_contribution?: number;
  emergency_buffer_months?: number;
}

export interface PortfolioBuildResponse {
  profile_name: string;
  description: string;
  allocation: Record<string, number>;
  etf_weights: Record<string, number>;
  investor_context: {
    risk_score: number;
    investment_goal?: string | null;
    horizon_years?: number | null;
    liquidity_need?: string | null;
    experience_level?: string | null;
    monthly_contribution?: number | null;
    emergency_buffer_months?: number | null;
  };
  suitability: string[];
  rationale: string[];
  rebalance_policy: string;
  next_steps: string[];
}

export interface RecommendationLogEntry {
  id: string;
  created_at: number;
  profile_name: string;
  risk_score: number;
  investment_goal?: string | null;
  horizon_years?: number | null;
  liquidity_need?: string | null;
  monthly_contribution?: number | null;
  note: string;
}

export interface EquityCurvePoint {
  date: string;
  portfolio_value: number;
  benchmark_value: number;
}

export interface EquityCurveResponse {
  tickers: string[];
  weights: number[];
  period: string;
  initial_value: number;
  data: EquityCurvePoint[];
}

// ── Asset Analysis ──────────────────────────────────────────────────────────

export interface RollingVolPoint {
  date: string;
  volatility: number;
}

export interface AssetMetrics {
  annual_return: number;
  sigma: number;
  sharpe: number;
  sortino: number;
  calmar: number;
  max_drawdown: number;
  var_95: number;
  beta?: number | null;
  alpha?: number | null;
}

export interface AssetAnalysisResponse {
  ticker: string;
  benchmark: string;
  period: string;
  quote: QuoteResponse;
  ohlc: OHLCPoint[];
  metrics: AssetMetrics;
  rolling_vol: RollingVolPoint[];
}

export interface CompareSeriesPoint {
  date: string;
  values: Record<string, number>;
}

export interface CompareTicker {
  ticker: string;
  metrics: AssetMetrics;
}

export interface AssetCompareResponse {
  tickers: string[];
  period: string;
  series: CompareSeriesPoint[];
  metrics: CompareTicker[];
}

// ── Optimize ────────────────────────────────────────────────────────────────

export interface FrontierPoint {
  return: number;
  volatility: number;
  sharpe: number;
}

export interface OptimizeRequest {
  tickers: string[];
  period?: string;
  risk_free_rate?: number;
}

export interface OptimizeResponse {
  method: string;
  weights: Record<string, number>;
  expected_return: number;
  expected_volatility: number;
  sharpe: number;
}

// ── Backtest ────────────────────────────────────────────────────────────────

export interface BacktestRequest {
  tickers: string[];
  weights: number[];
  start: string;
  end: string;
  rebalance_freq?: "monthly" | "quarterly" | "annually";
}

export interface BacktestDataPoint {
  date: string;
  value: number;
  benchmark_value?: number | null;
}

export interface BacktestResponse {
  data: BacktestDataPoint[];
  metrics: PortfolioMetrics;
}

// ── Monte Carlo ─────────────────────────────────────────────────────────────

export interface MonteCarloRequest {
  tickers: string[];
  weights: number[];
  horizon_days?: number;
  simulations?: number;
  initial_value?: number;
  seed?: number; // undefined = aleatoriedad real; número = resultados reproducibles
}

export interface MonteCarloResponse {
  percentile_5: number[];
  percentile_50: number[];
  percentile_95: number[];
  final_values: number[];
}

// ── Statistics Lab ───────────────────────────────────────────────────────────

export interface StatCumPoint    { date: string; value: number }
export interface StatHistBar     { x: number; count: number }
export interface StatQQPoint     { theoretical: number; actual: number }
export interface StatVolPoint    { date: string; vol: number }
export interface StatACFBar      { lag: number; acf: number; significant: boolean }
export interface StatMonthlyRet  { year: string; month: number; ret: number }

export interface FullAnalysisResponse {
  ticker:  string;
  period:  string;
  n_obs:   number;
  performance: {
    annual_return: number;
    annual_vol:    number;
    sharpe:        number;
    sortino:       number;
    calmar:        number;
    max_drawdown:  number;
    var_95:        number;
    total_return:  number;
    cum_returns:    StatCumPoint[];
    drawdown_series: StatCumPoint[];
  };
  risk: {
    var_hist_95:  number;
    var_hist_99:  number;
    var_param_95: number;
    var_param_99: number;
    cvar_95:      number;
    cvar_99:      number;
    best_day:     number;
    worst_day:    number;
    mean_daily:   number;
    std_daily:    number;
    histogram:    StatHistBar[];
  };
  normality: {
    skewness:         number;
    kurtosis:         number;
    jb_stat:          number;
    jb_pvalue:        number;
    reject_normality: boolean;
    qq_plot:          StatQQPoint[];
  };
  volatility: {
    rolling_21d:     StatVolPoint[];
    rolling_63d:     StatVolPoint[];
    rolling_252d:    StatVolPoint[];
    current_vol_21d: number;
    mean_vol_21d:    number;
    vol_regime:      "alto" | "medio" | "bajo";
    arch_detected:   boolean;
    arch_corr:       number;
  };
  tests: {
    ttest: {
      n:              number;
      mean_daily:     number;
      std_daily:      number;
      t_stat:         number;
      p_value:        number;
      ci_low:         number;
      ci_high:        number;
      reject_h0:      boolean;
      evidence:       string;
      evidence_level: string;
    };
    runs_test: {
      runs:                number;
      n_pos:               number;
      n_neg:               number;
      mean_runs:           number;
      z_stat:              number;
      p_value:             number;
      reject_random_walk:  boolean;
    };
  };
  acf: {
    values:              StatACFBar[];
    ci_95:               number;
    ljung_box_q:         number;
    ljung_box_pvalue:    number;
    n_significant:       number;
    reject_independence: boolean;
  };
  monthly_returns: StatMonthlyRet[];
}

// ── Options ─────────────────────────────────────────────────────────────────

export interface OptionContract {
  symbol: string;
  underlying: string;
  expiry: string;
  strike: number;
  option_type: "call" | "put";
  price: number;
  delta?: number | null;
  gamma?: number | null;
  theta?: number | null;
  vega?: number | null;
  rho?: number | null;
  iv?: number | null;
  itm_prob?: number | null;
  fair_value?: number | null;
}

export interface OptionChainResponse {
  ticker: string;
  calls: OptionContract[];
  puts: OptionContract[];
}

export interface VolatilityData {
  ticker: string;
  iv_short?: number | null;
  iv_medium?: number | null;
  iv_long?: number | null;
  hv_short?: number | null;
  hv_medium?: number | null;
  hv_long?: number | null;
  iv_hv_ratio?: number | null;
  iv_percentile?: number | null;
}
