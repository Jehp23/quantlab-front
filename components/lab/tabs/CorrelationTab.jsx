"use client";

import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { marketApi } from '@/lib/api';
import { calculateCorrelation } from '../statsUtils';
import { alignByDate, mapPeriod } from '../dataAdapter';
import { cn } from '../utils';

export default function CorrelationTab({ ticker: primaryTicker, period }) {
    const [secondTicker, setSecondTicker] = useState('SPY');
    const [inputTicker, setInputTicker] = useState('SPY');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchCorrelation = useCallback(async () => {
        const clean = inputTicker.trim().toUpperCase();
        if (!/^[A-Z0-9.\-]{1,10}$/.test(clean)) {
            setError('Ticker inválido.');
            return;
        }
        setSecondTicker(clean);
        setLoading(true);
        setError(null);
        try {
            const apiPeriod = mapPeriod(period);
            const [primary, secondary] = await Promise.all([
                marketApi.getHistorical(primaryTicker, apiPeriod),
                marketApi.getHistorical(clean, apiPeriod),
            ]);
            const aligned = alignByDate(primary.data, secondary.data);
            if (!aligned.returns1.length || !aligned.returns2.length) {
                throw new Error('No hay suficientes fechas en común para calcular la correlación.');
            }
            setData(aligned);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [inputTicker, period, primaryTicker]);

    useEffect(() => {
        fetchCorrelation();
    }, [fetchCorrelation]);

    const corr = useMemo(() => {
        if (!data) return null;
        return calculateCorrelation(data.returns1, data.returns2);
    }, [data]);

    const scatterData = useMemo(() => {
        if (!data) return [];
        return data.returns1.map((r, i) => ({ x: data.returns2[i], y: r }));
    }, [data]);

    const regressionLine = useMemo(() => {
        if (!corr || !scatterData.length) return [];
        const xs = scatterData.map(d => d.x);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        // Same {x,y} format as scatterData so ScatterChart can use the same axes
        return [
            { x: minX, y: corr.alpha + corr.beta * minX },
            { x: maxX, y: corr.alpha + corr.beta * maxX },
        ];
    }, [corr, scatterData]);

    const corrLevel = !corr ? null
        : Math.abs(corr.pearson) > 0.7 ? 'alta'
        : Math.abs(corr.pearson) > 0.4 ? 'media'
        : corr.pearson < -0.4 ? 'negativa'
        : 'baja';

    const corrConfig = {
        alta: { label: 'Correlación Alta', color: 'text-[#1f4d3a] bg-[#f3f7f4] border-[#dbe7e0]' },
        media: { label: 'Correlación Media', color: 'text-slate-700 bg-[#fafbf8] border-slate-200' },
        baja: { label: 'Correlación Baja', color: 'text-slate-700 bg-[#fafbf8] border-slate-200' },
        negativa: { label: 'Correlación Negativa', color: 'text-rose-700 bg-rose-50 border-rose-200' },
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* SECOND TICKER INPUT */}
            <div className="bg-glass rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div>
                    <h3 className="font-bold text-slate-800">Correlación entre dos activos</h3>
                    <p className="text-sm text-slate-500">Compara <span className="font-bold text-[#1f4d3a]">{primaryTicker}</span> contra un segundo activo o benchmark</p>
                </div>
                <div className="flex gap-3 items-center">
                    <div className="flex flex-col gap-1">
                        <label className="text-[11px] text-slate-400 tracking-wider uppercase font-bold text-center">Segundo Ticker</label>
                        <input
                            value={inputTicker}
                            onChange={e => setInputTicker(e.target.value.toUpperCase())}
                            onKeyDown={e => e.key === 'Enter' && fetchCorrelation()}
                            className="w-24 rounded-lg border border-slate-200 bg-white py-2 px-3 text-center text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1f4d3a]/20"
                            placeholder="SPY"
                        />
                    </div>
                    <button
                        onClick={fetchCorrelation}
                        className="mt-5 flex h-10 w-10 items-center justify-center rounded-lg bg-[#1f4d3a] text-white transition hover:bg-[#183b2d]"
                    >
                        <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
                    </button>
                </div>
            </div>

            {error && (
                <div className="rounded-md border border-rose-200 bg-rose-50 p-4">
                    <div className="flex gap-3">
                        <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                        <p className="text-sm text-red-700 font-bold">Error: {error}</p>
                    </div>
                </div>
            )}

            {loading && (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
                </div>
            )}

            {corr && !loading && (
                <>
                    {/* BANNER */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                        <div className="space-y-3">
                            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-[#fafbf8] px-4 py-1.5 text-sm font-bold uppercase tracking-wide text-[#1f4d3a]">
                                {primaryTicker} vs {secondTicker}
                            </div>
                            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
                                Correlación de Pearson:{' '}
                                <span className={cn(corr.pearson > 0 ? "text-[#1f4d3a]" : "text-rose-600")}>
                                    {corr.pearson.toFixed(4)}
                                </span>
                            </h2>
                            {corrLevel && (
                                <div className={cn("inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold border text-sm", corrConfig[corrLevel].color)}>
                                    {corrConfig[corrLevel].label}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* CARDS */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <CorrCard label="Correlación (ρ)" value={corr.pearson.toFixed(4)} formula="Σ(x-μx)(y-μy)/nσxσy" color="violet" />
                        <CorrCard label="R² (Determinación)" value={(corr.r2 * 100).toFixed(2) + '%'} formula="ρ²" color="blue"
                            note={`${(corr.r2 * 100).toFixed(1)}% de varianza explicada`} />
                        <CorrCard label={`Beta (${primaryTicker}/${secondTicker})`} value={corr.beta.toFixed(4)} formula="β = Cov(x,y)/Var(y)" color="indigo"
                            note={corr.beta > 1 ? "Más volátil que benchmark" : corr.beta < 0 ? "Movimiento inverso" : "Menos volátil"} />
                        <CorrCard label="Alfa" value={(corr.alpha * 100).toFixed(4) + '%'} formula="α = μx - β·μy" color="purple"
                            note={corr.alpha > 0 ? "Retorno en exceso positivo" : "Retorno en exceso negativo"} />
                    </div>

                    {/* SCATTER PLOT */}
                    <div className="bg-glass rounded-3xl border border-slate-200 p-6 shadow-sm">
                        <h4 className="text-xs font-bold text-center mb-1 text-slate-400 uppercase tracking-widest">
                            Scatter Plot — Retornos Diarios: {primaryTicker} (eje Y) vs {secondTicker} (eje X)
                        </h4>
                        <p className="text-center text-xs text-slate-400 mb-6">
                            La línea de regresión muestra la relación lineal entre ambos activos
                        </p>
                        <div style={{ width: '100%', height: '360px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 30 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis
                                        dataKey="x"
                                        type="number"
                                        domain={['auto', 'auto']}
                                        tickFormatter={(v) => (v * 100).toFixed(1) + '%'}
                                        label={{ value: `Retornos ${secondTicker}`, position: 'insideBottom', offset: -15, fill: '#94a3b8', fontSize: 12 }}
                                        style={{ fontSize: '10px', fill: '#94a3b8' }}
                                        axisLine={false} tickLine={false}
                                    />
                                    <YAxis
                                        dataKey="y"
                                        type="number"
                                        domain={['auto', 'auto']}
                                        tickFormatter={(v) => (v * 100).toFixed(1) + '%'}
                                        label={{ value: `Retornos ${primaryTicker}`, angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 12 }}
                                        style={{ fontSize: '10px', fill: '#94a3b8' }}
                                        axisLine={false} tickLine={false}
                                        width={55}
                                    />
                                    <Tooltip
                                        cursor={{ strokeDasharray: '3 3' }}
                                        contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 8px 20px rgba(15,23,42,0.08)', padding: '12px' }}
                                        formatter={(val) => [(val * 100).toFixed(3) + '%']}
                                    />
                                    {/* Puntos del scatter */}
                                    <Scatter
                                        name={`${primaryTicker} vs ${secondTicker}`}
                                        data={scatterData}
                                        fill="#c7d5cd"
                                        fillOpacity={0.45}
                                        r={3}
                                    />
                                    {/* Línea de regresión: conecta los dos extremos */}
                                    <Scatter
                                        name="Regresión"
                                        data={regressionLine}
                                        fill="transparent"
                                        line={{ stroke: '#1f4d3a', strokeWidth: 2.5 }}
                                        shape={() => null}
                                        legendType="none"
                                    />
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* PEDAGOGICAL NOTE */}
                    <div className="rounded-xl border border-slate-200 bg-[#fafbf8] p-4 text-sm italic text-slate-600">
                        Una beta mayor a 1 indica que el activo amplifica los movimientos del benchmark. Una correlación cercana a 1 significa que ambos activos se mueven juntos — poco beneficio de diversificación. Una correlación negativa sugiere que el activo puede funcionar como cobertura.
                    </div>
                </>
            )}
        </div>
    );
}

function CorrCard({ label, value, formula, note, color = 'slate' }) {
    const palette = {
        slate: { bg: 'bg-white', border: 'border-slate-200', label: 'text-slate-400', value: 'text-slate-900', note: 'text-slate-500' },
        violet: { bg: 'bg-white', border: 'border-slate-200', label: 'text-slate-400', value: 'text-slate-900', note: 'text-slate-500' },
        blue: { bg: 'bg-white', border: 'border-slate-200', label: 'text-slate-400', value: 'text-slate-900', note: 'text-slate-500' },
        indigo: { bg: 'bg-white', border: 'border-slate-200', label: 'text-slate-400', value: 'text-slate-900', note: 'text-slate-500' },
        purple: { bg: 'bg-white', border: 'border-slate-200', label: 'text-slate-400', value: 'text-slate-900', note: 'text-slate-500' },
    };
    const c = palette[color];
    return (
        <div className={`${c.bg} p-4 rounded-xl border ${c.border} flex flex-col gap-1`}>
            <span className={`text-xs font-bold ${c.label} uppercase tracking-wider leading-tight`}>{label}</span>
            <span className={`text-2xl font-bold font-mono ${c.value} mt-1`}>{value}</span>
            <span className={`text-xs font-mono italic ${c.label}`}>{formula}</span>
            {note && <span className={`text-xs font-semibold ${c.note} mt-1`}>{note}</span>}
        </div>
    );
}
