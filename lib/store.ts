import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PortfolioBuildResponse, PortfolioAnalyzeResponse, EquityCurveResponse, RecommendationLogEntry } from "./types";

interface InvestorProfile {
  investmentGoal: string | null;
  horizonYears: number | null;
  liquidityNeed: string | null;
  experienceLevel: string | null;
  monthlyContribution: number | null;
  emergencyBufferMonths: number | null;
}

interface PortfolioStore {
  riskScore: number | null;
  buildResult: PortfolioBuildResponse | null;
  analyzeResult: PortfolioAnalyzeResponse | null;
  equityCurveResult: EquityCurveResponse | null;
  investorProfile: InvestorProfile;
  recommendationHistory: RecommendationLogEntry[];
  setRiskScore: (score: number) => void;
  setBuildResult: (result: PortfolioBuildResponse) => void;
  setAnalyzeResult: (result: PortfolioAnalyzeResponse) => void;
  setEquityCurveResult: (result: EquityCurveResponse) => void;
  setInvestorProfile: (profile: Partial<InvestorProfile>) => void;
  reset: () => void;
}

interface AssetHistoryStore {
  viewedAssets: {
    ticker: string;
    name?: string | null;
    price?: number | null;
    changePct?: number | null;
    lastViewedAt: number;
    updatedAt?: number | null;
  }[];
  compareTickers: string[];
  selectedTicker: string | null;
  detailCache: Record<
    string,
    {
      ticker: string;
      period: string;
      updatedAt: number;
      payload: unknown;
    }
  >;
  viewedTickers: string[];
  addViewedTickers: (tickers: string[]) => void;
  upsertViewedAsset: (asset: {
    ticker: string;
    name?: string | null;
    price?: number | null;
    changePct?: number | null;
    updatedAt?: number | null;
  }) => void;
  setCompareTickers: (tickers: string[]) => void;
  setSelectedTicker: (ticker: string | null) => void;
  cacheAssetDetail: (ticker: string, period: string, payload: unknown) => void;
  getCachedAssetDetail: (ticker: string, period: string, maxAgeMs?: number) => unknown | null;
  clearViewedTickers: () => void;
  clearDetailCache: () => void;
}

interface UiStore {
  sidebarCollapsed: boolean;
  labTicker: string;
  labPeriod: string;
  labActiveTab: string;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setLabTicker: (ticker: string) => void;
  setLabPeriod: (period: string) => void;
  setLabActiveTab: (tab: string) => void;
}

export const usePortfolioStore = create<PortfolioStore>()(
  persist(
    (set) => ({
      riskScore: null,
      buildResult: null,
      analyzeResult: null,
      equityCurveResult: null,
      recommendationHistory: [],
      investorProfile: {
        investmentGoal: null,
        horizonYears: null,
        liquidityNeed: null,
        experienceLevel: null,
        monthlyContribution: null,
        emergencyBufferMonths: null,
      },
      setRiskScore: (score) => set({ riskScore: score }),
      setBuildResult: (result) =>
        set((state) => ({
          buildResult: result,
          recommendationHistory: [
            {
              id: `${Date.now()}-${result.profile_name}`,
              created_at: Date.now(),
              profile_name: result.profile_name,
              risk_score: result.investor_context.risk_score,
              investment_goal: result.investor_context.investment_goal ?? null,
              horizon_years: result.investor_context.horizon_years ?? null,
              liquidity_need: result.investor_context.liquidity_need ?? null,
              monthly_contribution: result.investor_context.monthly_contribution ?? null,
              note: `Propuesta ${result.profile_name} generada desde onboarding.`,
            },
            ...state.recommendationHistory,
          ].slice(0, 12),
        })),
      setAnalyzeResult: (result) => set({ analyzeResult: result }),
      setEquityCurveResult: (result) => set({ equityCurveResult: result }),
      setInvestorProfile: (profile) =>
        set((state) => ({
          investorProfile: {
            ...state.investorProfile,
            ...profile,
          },
        })),
      reset: () =>
        set({
          riskScore: null,
          buildResult: null,
          analyzeResult: null,
          equityCurveResult: null,
          recommendationHistory: [],
          investorProfile: {
            investmentGoal: null,
            horizonYears: null,
            liquidityNeed: null,
            experienceLevel: null,
            monthlyContribution: null,
            emergencyBufferMonths: null,
          },
        }),
    }),
    {
      name: "portfolio-advisor",
      partialize: (state) => ({
        riskScore: state.riskScore,
        buildResult: state.buildResult,
        analyzeResult: state.analyzeResult,
        equityCurveResult: state.equityCurveResult,
        investorProfile: state.investorProfile,
        recommendationHistory: state.recommendationHistory,
      }),
    }
  )
);

export const useAssetHistoryStore = create<AssetHistoryStore>()(
  persist(
    (set, get) => ({
      viewedAssets: [],
      compareTickers: [],
      selectedTicker: null,
      detailCache: {},
      viewedTickers: [],
      addViewedTickers: (tickers: string[]) => {
        const now = Date.now();
        const viewedMap = new Map(
          (get().viewedAssets ?? []).map((asset) => [asset.ticker, asset]),
        );

        tickers.map((ticker) => ticker.toUpperCase()).forEach((ticker) => {
          const existing = viewedMap.get(ticker);
          viewedMap.set(ticker, {
            ticker,
            name: existing?.name ?? null,
            price: existing?.price ?? null,
            changePct: existing?.changePct ?? null,
            updatedAt: existing?.updatedAt ?? null,
            lastViewedAt: now,
          });
        });

        const viewedAssets = Array.from(viewedMap.values())
          .sort((a, b) => b.lastViewedAt - a.lastViewedAt)
          .slice(0, 25);

        set({
          viewedAssets,
          viewedTickers: viewedAssets.map((asset) => asset.ticker),
        });
      },
      upsertViewedAsset: (asset) => {
        const ticker = asset.ticker.toUpperCase();
        const now = Date.now();
        const previous = (get().viewedAssets ?? []).find((item) => item.ticker === ticker);
        const merged = {
          ticker,
          name: asset.name ?? previous?.name ?? null,
          price: asset.price ?? previous?.price ?? null,
          changePct: asset.changePct ?? previous?.changePct ?? null,
          updatedAt: asset.updatedAt ?? previous?.updatedAt ?? now,
          lastViewedAt: now,
        };

        const viewedAssets = [merged, ...(get().viewedAssets ?? []).filter((item) => item.ticker !== ticker)].slice(0, 25);
        set({
          viewedAssets,
          viewedTickers: viewedAssets.map((item) => item.ticker),
        });
      },
      setCompareTickers: (tickers) =>
        set({
          compareTickers: Array.from(new Set(tickers.map((ticker) => ticker.toUpperCase()))).slice(0, 8),
        }),
      setSelectedTicker: (ticker) =>
        set({ selectedTicker: ticker ? ticker.toUpperCase() : null }),
      cacheAssetDetail: (ticker, period, payload) => {
        const key = `${ticker.toUpperCase()}:${period}`;
        set((state) => ({
          detailCache: {
            ...state.detailCache,
            [key]: {
              ticker: ticker.toUpperCase(),
              period,
              payload,
              updatedAt: Date.now(),
            },
          },
        }));
      },
      getCachedAssetDetail: (ticker, period, maxAgeMs = 15 * 60 * 1000) => {
        const key = `${ticker.toUpperCase()}:${period}`;
        const entry = get().detailCache[key];
        if (!entry) return null;
        return Date.now() - entry.updatedAt <= maxAgeMs ? entry.payload : null;
      },
      clearViewedTickers: () =>
        set({ viewedAssets: [], viewedTickers: [], compareTickers: [], selectedTicker: null }),
      clearDetailCache: () => set({ detailCache: {} }),
    }),
    {
      name: "asset-history",
      partialize: (state) => ({
        viewedAssets: state.viewedAssets,
        viewedTickers: state.viewedTickers,
        compareTickers: state.compareTickers,
        selectedTicker: state.selectedTicker,
        detailCache: state.detailCache,
      }),
    }
  )
);

export const useUiStore = create<UiStore>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      labTicker: "AAPL",
      labPeriod: "6M",
      labActiveTab: "risk",
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setLabTicker: (ticker) => set({ labTicker: ticker.toUpperCase() }),
      setLabPeriod: (period) => set({ labPeriod: period }),
      setLabActiveTab: (tab) => set({ labActiveTab: tab }),
    }),
    {
      name: "ui-preferences",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        labTicker: state.labTicker,
        labPeriod: state.labPeriod,
        labActiveTab: state.labActiveTab,
      }),
    }
  )
);
