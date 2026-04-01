"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw, BookOpen, Clock, Sigma, Orbit, ShieldAlert, ArrowRight } from 'lucide-react';
import InfoPanel from './InfoPanel';
import { marketApi } from '@/lib/api';
import { useAssetHistoryStore, useUiStore } from '@/lib/store';
import { cn } from './utils';
import { historicalToLogReturns, mapPeriod } from './dataAdapter';
import HypothesisTab  from './tabs/HypothesisTab';
import RiskTab        from './tabs/RiskTab';
import NormalityTab   from './tabs/NormalityTab';
import VolatilityTab  from './tabs/VolatilityTab';
import CorrelationTab from './tabs/CorrelationTab';
import PerformanceTab from './tabs/PerformanceTab';
import MonteCarloTab  from './tabs/MonteCarloTab';
import HeatmapTab     from './tabs/HeatmapTab';
import AutocorrTab    from './tabs/AutocorrTab';

const TABS = [
    { id: 'risk',        label: 'VaR & CVaR',            short: 'VaR'    },
    { id: 'montecarlo',  label: 'Monte Carlo',           short: 'MC'     },
    { id: 'normality',   label: 'Normalidad',            short: 'Norm.'  },
    { id: 'hypothesis',  label: 'T-Test & Rachas',      short: 'T-Test' },
    { id: 'correlation', label: 'Correlación',           short: 'Corr.'  },
    { id: 'autocorr',    label: 'Autocorrelación (ACF)', short: 'ACF'    },
    { id: 'volatility',  label: 'Volatilidad',           short: 'Vol.'   },
    { id: 'performance', label: 'Performance',           short: 'Perf.'  },
    { id: 'heatmap',     label: 'Heatmap Mensual',       short: 'Heat.'  },
];

const PERIODS = [
    { value: '1M', label: '1 Mes'   },
    { value: '3M', label: '3 Meses' },
    { value: '6M', label: '6 Meses' },
    { value: '1Y', label: '1 Año'   },
    { value: '2Y', label: '2 Años'  },
    { value: '5Y', label: '5 Años'  },
];

// ── localStorage helpers ─────────────────────────────────────────────────────
const STORAGE_KEY = 'quantlab_recent';
const MAX_RECENT  = 6;

function loadRecent() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function pushRecent(ticker) {
    const prev    = loadRecent();
    const updated = [ticker, ...prev.filter(t => t !== ticker)].slice(0, MAX_RECENT);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
}

// ── Component ────────────────────────────────────────────────────────────────
export default function Laboratory() {
    const {
        labTicker,
        labPeriod,
        labActiveTab,
        setLabTicker,
        setLabPeriod,
        setLabActiveTab,
    } = useUiStore();
    const { upsertViewedAsset, setSelectedTicker } = useAssetHistoryStore();
    const [activeTab,   setActiveTab]   = useState(labActiveTab || 'risk');
    const [showInfo,    setShowInfo]    = useState(false);
    const [ticker,      setTicker]      = useState(labTicker || 'AAPL');
    const [period,      setPeriod]      = useState(labPeriod || '6M');
    const [returns,     setReturns]     = useState(null);
    const [dates,       setDates]       = useState(null);
    const [tickerInfo,  setTickerInfo]  = useState(null);   // { price, change_pct, name }
    const [loading,     setLoading]     = useState(false);
    const [error,       setError]       = useState(null);

    // Recent tickers
    const [recent,       setRecent]      = useState(loadRecent);
    const [showDropdown, setShowDropdown] = useState(false);
    const inputWrapRef = useRef(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (inputWrapRef.current && !inputWrapRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const fetchData = async (t = ticker, p = period) => {
        const clean = t.trim().toUpperCase();
        if (!/^[A-Z0-9.\-\^]{1,10}$/.test(clean)) {
            setError('Ticker inválido. Usá letras y números (ej: AAPL, BTC-USD, ^GSPC).');
            return;
        }
        setLoading(true);
        setError(null);
        setReturns(null);
        setTickerInfo(null);
        setShowDropdown(false);
        try {
            const apiPeriod = mapPeriod(p);
            const [historical, quote] = await Promise.all([
                marketApi.getHistorical(clean, apiPeriod),
                marketApi.getQuote(clean),
            ]);
            const data = historicalToLogReturns(historical.data);
            if (!data.returns.length) {
                throw new Error('Datos insuficientes para analizar ese ticker en el período elegido.');
            }
            setReturns(data.returns);
            setDates(data.dates || null);
            setTickerInfo({ price: quote.price, change_pct: quote.change_pct, name: quote.name });
            upsertViewedAsset({
                ticker: clean,
                name: quote.name,
                price: quote.price,
                changePct: quote.change_pct,
                updatedAt: Date.now(),
            });
            setSelectedTicker(clean);
            // Save to recent
            setRecent(pushRecent(clean));
            setTicker(clean);
            setLabTicker(clean);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLabPeriod(period);
    }, [period, setLabPeriod]);

    useEffect(() => {
        setLabActiveTab(activeTab);
    }, [activeTab, setLabActiveTab]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchData(); }, [period]);

    const handleTabChange = (id) => { setActiveTab(id); setShowInfo(false); };

    const selectRecent = (t) => { setTicker(t); fetchData(t, period); };

    const featuredModules = [
        {
            id: 'risk',
            title: 'Riesgo de cola',
            description: 'Priorizá VaR, CVaR y escenarios adversos para entender pérdidas extremas.',
            icon: ShieldAlert,
            accent: 'bg-[#fafbf8] border-slate-200 text-slate-900',
        },
        {
            id: 'montecarlo',
            title: 'Escenarios Monte Carlo',
            description: 'Explorá abanicos probabilísticos y dispersión futura del activo.',
            icon: Orbit,
            accent: 'bg-[#fafbf8] border-slate-200 text-slate-900',
        },
        {
            id: 'normality',
            title: 'Supuestos estadísticos',
            description: 'Chequeá normalidad, colas pesadas y si el modelo paramétrico subestima riesgo.',
            icon: Sigma,
            accent: 'bg-[#fafbf8] border-slate-200 text-slate-900',
        },
    ];

    // ── Loading splash ───────────────────────────────────────────────────────
    if (loading && !returns) {
        return (
            <div className="min-h-screen bg-mesh">
                <div className="page-shell flex min-h-screen flex-col items-center justify-center gap-4">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#1f4d3a] border-t-transparent" />
                    <p className="text-sm font-medium text-slate-500">Obteniendo datos de {ticker}…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-mesh">
            <div className="page-shell space-y-5 animate-in fade-in duration-700">

                {/* ── HEADER ──────────────────────────────────────────────── */}
                <section className="bg-glass rounded-[28px] p-5 md:p-6">
                    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.85fr)]">
                        <div className="flex flex-col gap-4">
                            <div className="space-y-3">
                                <p className="eyebrow">Laboratorio probabilístico</p>
                                <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-slate-900 md:text-[2rem]">
                                    Analizá un activo sin perderte entre métricas.
                                </h1>
                                <p className="max-w-2xl text-sm leading-relaxed text-slate-500 md:text-base">
                                    Elegí un ticker, abrí un módulo y leé primero el dato principal. Después profundizás en el gráfico y el detalle estadístico.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <Link href="/lab/analysis" className="inline-flex items-center gap-2 rounded-xl bg-[#1f4d3a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#183b2d]">
                                    Comparar activos <ArrowRight className="h-4 w-4" />
                                </Link>
                                <Link href="/lab/simulation" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                                    Simulación
                                </Link>
                            </div>

                            <div className="grid gap-3 md:grid-cols-3">
                                {featuredModules.map((module) => {
                                    const Icon = module.icon;
                                    return (
                                        <button
                                            key={module.id}
                                            onClick={() => handleTabChange(module.id)}
                                            className={cn(
                                                'rounded-2xl border bg-white p-4 text-left transition hover:border-[#d8e2dc]',
                                                activeTab === module.id ? 'border-[#1f4d3a]/18 shadow-sm' : 'border-slate-200'
                                            )}
                                        >
                                            <div className="mb-3 flex items-center gap-2">
                                                <div className="rounded-xl bg-[#eef4f0] p-2 text-[#1f4d3a]">
                                                    <Icon className="h-4 w-4" />
                                                </div>
                                                <h2 className="text-sm font-semibold text-slate-900">{module.title}</h2>
                                            </div>
                                            <p className="text-sm text-slate-500">{module.description}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="surface-subtle p-4 md:p-5">
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <p className="eyebrow">Contexto de análisis</p>
                                    <h2 className="text-lg font-bold text-slate-900">Elegí un activo y abrí el módulo que quieras estudiar.</h2>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_132px]">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="eyebrow">Ticker</label>
                                        <div className="relative" ref={inputWrapRef}>
                                            <input
                                                value={ticker}
                                                onChange={e => setTicker(e.target.value.toUpperCase())}
                                                onFocus={() => recent.length > 0 && setShowDropdown(true)}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') { fetchData(); }
                                                    if (e.key === 'Escape') { setShowDropdown(false); }
                                                }}
                                                placeholder="AAPL"
                                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#1f4d3a]"
                                            />

                                            {showDropdown && recent.length > 0 && (
                                                <div className="absolute left-0 top-full z-50 mt-1.5 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white/96 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-1 duration-150">
                                                    <div className="flex items-center gap-1.5 border-b border-slate-100 px-3 py-2">
                                                        <Clock className="h-3 w-3 text-slate-400" />
                                                        <span className="eyebrow">Recientes</span>
                                                    </div>
                                                    {recent.map(t => (
                                                        <button
                                                            key={t}
                                                            onMouseDown={() => selectRecent(t)}
                                                            className={cn(
                                                                'w-full px-4 py-2.5 text-left text-sm font-semibold transition-colors',
                                                                t === ticker
                                                                    ? 'bg-[#f3f7f4] text-[#1f4d3a]'
                                                                    : 'text-slate-600 hover:bg-slate-50'
                                                            )}
                                                        >
                                                            {t}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="eyebrow">Período</label>
                                        <select
                                            value={period}
                                            onChange={e => setPeriod(e.target.value)}
                                            className="w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-[#1f4d3a]"
                                        >
                                            {PERIODS.map(p => (
                                                <option key={p.value} value={p.value}>{p.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => fetchData()}
                                        aria-label="Actualizar datos"
                                        className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#1f4d3a] px-4 text-sm font-semibold text-white transition hover:bg-[#183b2d]"
                                    >
                                        <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                                        Analizar
                                    </button>

                                    {returns && (
                                        <button
                                            onClick={() => setShowInfo(v => !v)}
                                            aria-label="Guía educativa"
                                            title="Guía del módulo activo"
                                            className={cn(
                                                'inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition',
                                                showInfo
                                                    ? 'border-[#1f4d3a] bg-[#1f4d3a] text-white'
                                                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                            )}
                                        >
                                            <BookOpen className="h-4 w-4" />
                                            Guía
                                        </button>
                                    )}
                                </div>

                                {tickerInfo && (
                                    <div className="grid gap-3 sm:grid-cols-3">
                                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                            <p className="eyebrow">Activo</p>
                                            <p className="mt-1 text-lg font-extrabold text-slate-900">{ticker}</p>
                                            <p className="truncate text-sm text-slate-500">{tickerInfo.name}</p>
                                        </div>
                                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                            <p className="eyebrow">Precio spot</p>
                                            <p className="mt-1 text-lg font-extrabold text-slate-900">
                                                ${tickerInfo.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </p>
                                            <p className={cn('text-sm font-semibold', tickerInfo.change_pct >= 0 ? 'text-[#1f4d3a]' : 'text-rose-500')}>
                                                {tickerInfo.change_pct >= 0 ? '+' : ''}{tickerInfo.change_pct.toFixed(2)}% hoy
                                            </p>
                                        </div>
                                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                            <p className="eyebrow">Módulo activo</p>
                                            <p className="mt-1 text-lg font-extrabold text-slate-900">
                                                {TABS.find((tab) => tab.id === activeTab)?.label ?? 'Riesgo'}
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                Período {PERIODS.find((item) => item.value === period)?.label ?? period}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── ERROR ───────────────────────────────────────────────── */}
                {error && (
                    <div className="animate-in slide-in-from-top-2 rounded-2xl border border-rose-200 bg-rose-50 p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
                            <p className="text-sm font-semibold text-rose-700">{error}</p>
                        </div>
                    </div>
                )}

                {/* ── GUIDE PANEL ─────────────────────────────────────────── */}
                {returns && showInfo && (
                    <InfoPanel activeTab={activeTab} onClose={() => setShowInfo(false)} />
                )}

                {/* ── TAB BAR ─────────────────────────────────────────────── */}
                {returns && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-3">
                        <div className="mb-2 px-1 pt-1">
                            <p className="eyebrow">Módulos</p>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {TABS.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id)}
                                    className={cn(
                                        'whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-semibold transition-all',
                                        activeTab === tab.id
                                            ? 'bg-[#1f4d3a] text-white shadow-sm'
                                            : 'text-slate-500 hover:bg-[#f4f6f2] hover:text-slate-900'
                                    )}
                                >
                                    <span className="hidden sm:inline">{tab.label}</span>
                                    <span className="sm:hidden">{tab.short}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── TAB CONTENT ─────────────────────────────────────────── */}
                {returns && (
                    <div>
                        {activeTab === 'hypothesis'  && <HypothesisTab  returns={returns} />}
                        {activeTab === 'risk'        && <RiskTab         returns={returns} />}
                        {activeTab === 'performance' && <PerformanceTab  returns={returns} dates={dates} />}
                        {activeTab === 'normality'   && <NormalityTab    returns={returns} />}
                        {activeTab === 'volatility'  && <VolatilityTab   returns={returns} dates={dates} />}
                        {activeTab === 'autocorr'    && <AutocorrTab     returns={returns} />}
                        {activeTab === 'montecarlo'  && <MonteCarloTab   returns={returns} />}
                        {activeTab === 'heatmap'     && <HeatmapTab      returns={returns} dates={dates} />}
                        {activeTab === 'correlation' && <CorrelationTab  ticker={ticker} period={period} />}
                    </div>
                )}

            </div>
        </div>
    );
}
