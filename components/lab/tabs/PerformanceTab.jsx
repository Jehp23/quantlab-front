import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { calculatePerformance } from '../statsUtils';
import { cn } from '../utils';

export default function PerformanceTab({ returns, dates }) {
    const perf = useMemo(() => calculatePerformance(returns), [returns]);

    const chartData = useMemo(() =>
        returns.map((_, i) => ({
            label: dates ? dates[i] : i + 1,
            cumReturn: perf.cumReturns[i],
            drawdown: perf.drawdowns[i],
        })),
        [returns, dates, perf]
    );

    const sharpeLevel =
        perf.sharpe > 2   ? { label: 'Excelente', color: 'text-[#1f4d3a] bg-[#f3f7f4] border-[#dbe7e0]' } :
        perf.sharpe > 1   ? { label: 'Bueno',      color: 'text-slate-700 bg-[#fafbf8] border-slate-200' } :
        perf.sharpe > 0   ? { label: 'Aceptable',  color: 'text-slate-700 bg-[#fafbf8] border-slate-200' } :
                            { label: 'Bajo tasa libre', color: 'text-rose-700 bg-rose-50 border-rose-200' };

    const tickInterval = Math.floor(chartData.length / 6);
    const summaryMetrics = [
        { label: 'Sharpe', value: perf.sharpe.toFixed(2), detail: 'retorno por unidad de riesgo' },
        { label: 'Retorno anual', value: `${(perf.annualReturn * 100).toFixed(1)}%`, detail: 'media anualizada' },
        { label: 'Máx. drawdown', value: `${perf.maxDrawdownPct.toFixed(1)}%`, detail: 'caída máxima histórica' },
    ];
    const detailMetrics = [
        { label: 'Volatilidad anual', value: `${(perf.annualVol * 100).toFixed(2)}%`, formula: 'σ × √252' },
        { label: 'Sortino', value: isFinite(perf.sortino) ? perf.sortino.toFixed(3) : '∞', formula: '(R-Rf)/σ_baja' },
        { label: 'Calmar', value: isFinite(perf.calmar) ? perf.calmar.toFixed(3) : '∞', formula: 'R_a / |MaxDD|' },
    ];

    const CustomTooltipCum = ({ active, payload, label }) => {
        if (!active || !payload?.length) return null;
        return (
            <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-3 text-xs">
                <p className="font-bold text-slate-500 mb-1">{label}</p>
                <p className={cn("font-mono font-bold", payload[0].value >= 0 ? 'text-[#1f4d3a]' : 'text-rose-600')}>
                    Retorno acumulado: {payload[0].value > 0 ? '+' : ''}{payload[0].value.toFixed(2)}%
                </p>
            </div>
        );
    };

    const CustomTooltipDD = ({ active, payload, label }) => {
        if (!active || !payload?.length) return null;
        return (
            <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-3 text-xs">
                <p className="font-bold text-slate-500 mb-1">{label}</p>
                <p className="font-mono font-bold text-rose-600">
                    Drawdown: {payload[0].value.toFixed(2)}%
                </p>
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-2xl">
                        <p className="eyebrow mb-2">Lectura principal</p>
                        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                            Sharpe {perf.sharpe.toFixed(3)}. El activo está en nivel {sharpeLevel.label.toLowerCase()} frente a su volatilidad histórica.
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            El retorno total del período fue {perf.totalReturn > 0 ? '+' : ''}{perf.totalReturn.toFixed(2)}% con tasa libre de riesgo de {(perf.rfAnnual * 100).toFixed(0)}% anual.
                        </p>
                    </div>
                    <span className={cn("inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full font-bold border text-sm", sharpeLevel.color)}>
                        {sharpeLevel.label}
                    </span>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                {summaryMetrics.map((metric) => (
                    <div key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{metric.label}</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900">{metric.value}</p>
                        <p className="mt-2 text-sm text-slate-500">{metric.detail}</p>
                    </div>
                ))}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Detalle técnico</p>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                    {detailMetrics.map((metric) => (
                        <div key={metric.label} className="rounded-xl bg-[var(--surface-subtle)] px-4 py-3">
                            <p className="text-sm font-medium text-slate-900">{metric.label}</p>
                            <p className="mt-1 text-lg font-semibold text-slate-900">{metric.value}</p>
                            <p className="text-xs text-slate-400">{metric.formula}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-5">
                        <h4 className="text-sm font-semibold text-slate-900">Retorno acumulado</h4>
                        <p className="mt-1 text-sm text-slate-500">Evolución del activo durante el período seleccionado.</p>
                    </div>
                    <div style={{ width: '100%', height: '260px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="colorCum" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#1f4d3a" stopOpacity={0.24} />
                                        <stop offset="95%" stopColor="#1f4d3a" stopOpacity={0.03} />
                                    </linearGradient>
                                    <linearGradient id="colorCumNeg" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#d8b4b4" stopOpacity={0.08} />
                                        <stop offset="95%" stopColor="#d8b4b4" stopOpacity={0.28} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis dataKey="label" style={{ fontSize: '10px', fill: '#94a3b8' }}
                                    axisLine={false} tickLine={false} interval={tickInterval} dy={8} />
                                <YAxis tickFormatter={v => v.toFixed(1) + '%'}
                                    style={{ fontSize: '10px', fill: '#94a3b8' }}
                                    axisLine={false} tickLine={false} width={50} />
                                <Tooltip content={<CustomTooltipCum />} />
                                <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" strokeWidth={1} />
                                <Area type="monotone" dataKey="cumReturn"
                                    fill={perf.totalReturn >= 0 ? "url(#colorCum)" : "url(#colorCumNeg)"}
                                    stroke={perf.totalReturn >= 0 ? "#1f4d3a" : "#d08f8f"}
                                    strokeWidth={2} dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-5">
                        <h4 className="text-sm font-semibold text-slate-900">Drawdown</h4>
                        <p className="mt-1 text-sm text-slate-500">Cuánto cayó el activo desde su máximo acumulado.</p>
                    </div>
                    <div style={{ width: '100%', height: '260px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="colorDD" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#d8b4b4" stopOpacity={0.08} />
                                        <stop offset="95%" stopColor="#d8b4b4" stopOpacity={0.35} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis dataKey="label" style={{ fontSize: '10px', fill: '#94a3b8' }}
                                    axisLine={false} tickLine={false} interval={tickInterval} dy={8} />
                                <YAxis tickFormatter={v => v.toFixed(1) + '%'}
                                    style={{ fontSize: '10px', fill: '#94a3b8' }}
                                    axisLine={false} tickLine={false} width={50} />
                                <Tooltip content={<CustomTooltipDD />} />
                                <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" strokeWidth={1} />
                                <Area type="monotone" dataKey="drawdown"
                                    fill="url(#colorDD)" stroke="#c48f8f"
                                    strokeWidth={2} dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-200 bg-[#fafbf8] p-4 text-sm leading-6 text-slate-600">
                    <strong>Sharpe vs Sortino:</strong> el Sharpe penaliza toda la volatilidad; el Sortino solo la negativa. Si Sortino {'>'} Sharpe, el perfil de retornos es relativamente más amable en caídas.
                </div>
                <div className="rounded-xl border border-slate-200 bg-[#fafbf8] p-4 text-sm leading-6 text-slate-600">
                    <strong>Calmar:</strong> compara retorno anual contra drawdown máximo. Sirve para leer si el retorno compensa la peor caída histórica observada.
                </div>
            </div>
        </div>
    );
}
