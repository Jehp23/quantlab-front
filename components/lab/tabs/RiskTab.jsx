import React, { useMemo } from 'react';
import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { calculateVaR } from '../statsUtils';

export default function RiskTab({ returns }) {
    const risk = useMemo(() => calculateVaR(returns), [returns]);

    const chartData = useMemo(() => {
        const min = Math.min(...returns);
        const max = Math.max(...returns);
        const binCount = 40;
        const step = (max - min) / binCount;
        return Array.from({ length: binCount }, (_, i) => {
            const binStart = min + i * step;
            const binEnd = binStart + step;
            const mid = (binStart + binEnd) / 2;
            const count = returns.filter(r => r >= binStart && r < binEnd).length;
            const density = count / (returns.length * step);
            return { x: mid, freq: density, isLoss: mid <= risk.varHistorical5 };
        });
    }, [returns, risk]);

    const varAbsValue = Math.abs(risk.varHistorical5) * 100;
    const riskLevel = varAbsValue < 1.5 ? 'bajo' : varAbsValue < 3 ? 'medio' : 'alto';
    const riskColors = { bajo: 'text-[#1f4d3a] bg-[#f3f7f4] border-[#dbe7e0]', medio: 'text-slate-700 bg-[#fafbf8] border-slate-200', alto: 'text-rose-700 bg-rose-50 border-rose-200' };
    const highlightMetrics = [
        { label: 'VaR 95%', value: (risk.varHistorical5 * 100).toFixed(2) + '%', detail: 'Pérdida diaria esperada con 95% de confianza' },
        { label: 'CVaR 95%', value: (risk.cvar5 * 100).toFixed(2) + '%', detail: 'Promedio de pérdidas cuando el VaR se rompe' },
        { label: 'Peor día', value: (risk.worstDay * 100).toFixed(2) + '%', detail: 'Mínimo observado en la muestra' },
    ];
    const detailMetrics = [
        { label: 'VaR Histórico 99%', value: (risk.varHistorical1 * 100).toFixed(3) + '%', formula: 'Percentil 1%' },
        { label: 'CVaR 99%', value: (risk.cvar1 * 100).toFixed(3) + '%', formula: 'E[r | r < VaR 1%]' },
        { label: 'VaR Paramétrico 95%', value: (risk.varParametric5 * 100).toFixed(3) + '%', formula: 'μ - 1.645σ' },
        { label: 'VaR Paramétrico 99%', value: (risk.varParametric1 * 100).toFixed(3) + '%', formula: 'μ - 2.326σ' },
        { label: 'Mejor día', value: '+' + (risk.bestDay * 100).toFixed(3) + '%', formula: 'max(retornos)' },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-2xl">
                        <p className="eyebrow mb-2">Lectura principal</p>
                        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                            Con 95% de confianza, la pérdida diaria no superaría el {(Math.abs(risk.varHistorical5) * 100).toFixed(2)}%.
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            Si ese umbral se rompe, la pérdida media esperada sería de {(Math.abs(risk.cvar5) * 100).toFixed(2)}%.
                        </p>
                    </div>
                    <span className={`inline-flex h-fit items-center rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] ${riskColors[riskLevel]}`}>
                        Riesgo {riskLevel}
                    </span>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                {highlightMetrics.map((metric) => (
                    <div key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{metric.label}</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900">{metric.value}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-500">{metric.detail}</p>
                    </div>
                ))}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5">
                    <h4 className="text-sm font-semibold text-slate-900">
                        Distribución de retornos y cola de pérdidas
                    </h4>
                    <p className="mt-1 text-sm text-slate-500">
                        La zona a la izquierda del VaR concentra los escenarios más adversos observados.
                    </p>
                </div>
                <div style={{ width: '100%', height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis dataKey="x" tickFormatter={(v) => (v * 100).toFixed(1) + '%'} style={{ fontSize: '11px', fill: '#94a3b8' }} axisLine={false} tickLine={false} dy={10} />
                            <YAxis hide />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 8px 20px rgba(15,23,42,0.08)', padding: '12px' }}
                                formatter={(val) => [val.toFixed(3), 'Densidad']}
                                labelFormatter={(v) => `Retorno: ${(v * 100).toFixed(2)}%`}
                            />
                            <Bar dataKey="freq" radius={[4, 4, 0, 0]} opacity={0.85}>
                                {chartData.map((entry, index) => (
                                    <Cell key={index} fill={entry.isLoss ? '#d4b2b2' : '#cdd9d2'} />
                                ))}
                            </Bar>
                            <ReferenceLine x={risk.varHistorical5} stroke="#1f4d3a" strokeWidth={2} strokeDasharray="6 3"
                                label={{ value: 'VaR 95%', fill: '#1f4d3a', fontSize: 11, position: 'insideTopRight' }} />
                            <ReferenceLine x={risk.varHistorical1} stroke="#94a3b8" strokeWidth={2} strokeDasharray="6 3"
                                label={{ value: 'VaR 99%', fill: '#64748b', fontSize: 11, position: 'insideTopLeft' }} />
                            <ReferenceLine x={risk.cvar5} stroke="#b45309" strokeWidth={2} strokeDasharray="4 4"
                                label={{ value: 'CVaR 95%', fill: '#b45309', fontSize: 11, position: 'insideTop' }} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-2xl border border-slate-200 bg-[#fafbf8] p-4 text-sm leading-6 text-slate-600">
                    El VaR histórico usa datos reales y no supone normalidad. El VaR paramétrico sí la supone, por eso puede subestimar riesgo cuando hay colas pesadas. El CVaR es más conservador porque mide qué pasa después de cruzar el VaR.
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Detalle técnico</p>
                    <div className="mt-3 space-y-2">
                        {detailMetrics.map((metric) => (
                            <div key={metric.label} className="flex items-center justify-between gap-4 rounded-xl bg-[var(--surface-subtle)] px-3 py-2.5">
                                <div>
                                    <p className="text-sm font-medium text-slate-900">{metric.label}</p>
                                    <p className="text-xs text-slate-400">{metric.formula}</p>
                                </div>
                                <span className="text-sm font-semibold text-slate-900">{metric.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
