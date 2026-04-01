import React, { useState, useMemo } from 'react';
import { jStat } from '@/lib/vendor/jstat-wrapper';
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Bar } from 'recharts';
import { ChevronDown, ChevronUp, Info, Settings } from 'lucide-react';
import { cn } from '../utils';
import { calculateTTest, calculateRunsTest } from '../statsUtils';

export default function HypothesisTab({ returns }) {
    const [showDetails, setShowDetails] = useState(false);
    const [showRuns,    setShowRuns]    = useState(false);
    const [confStr,     setConfStr]     = useState('0.95');
    const confidence = parseFloat(confStr);

    const stats = useMemo(() => calculateTTest(returns, confidence), [returns, confidence]);
    const runsStats = useMemo(() => calculateRunsTest(returns), [returns]);

    const chartData = useMemo(() => {
        const { mean, std } = stats;
        const min = Math.min(...returns);
        const max = Math.max(...returns);
        const binCount = 30;
        const step = (max - min) / binCount;
        return Array.from({ length: binCount }, (_, i) => {
            const binStart = min + i * step;
            const binEnd = binStart + step;
            const mid = (binStart + binEnd) / 2;
            const count = returns.filter(r => r >= binStart && r < binEnd).length;
            const density = count / (returns.length * step);
            const normalY = jStat.normal.pdf(mid, mean, std);
            return { x: mid, freq: density, pdf: normalY };
        });
    }, [returns, stats]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* CONFIDENCE SELECTOR — local to this tab */}
            <div className="flex items-center justify-end gap-3">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Nivel de significancia (α)</span>
                <div className="flex rounded-xl border border-slate-200 bg-[#f4f6f2] p-0.5 gap-0.5">
                    {['0.90', '0.95', '0.99'].map(v => (
                        <button
                            key={v}
                            onClick={() => setConfStr(v)}
                            className={cn(
                                'px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                                confStr === v ? 'bg-[#1f4d3a] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            )}
                        >
                            {(parseFloat(v) * 100).toFixed(0)}%
                        </button>
                    ))}
                </div>
            </div>

            {/* CONCLUSION BANNER */}
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                <div className="space-y-4">
                    <div className={cn("inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold tracking-wide uppercase shadow-sm border border-white/50 backdrop-blur-sm",
                        stats.rejectH0 ? "bg-[#f3f7f4] text-[#1f4d3a] border-[#dbe7e0]" : "bg-[#fafbf8] text-slate-600 border-slate-200")}>
                        {stats.rejectH0 ? "H₁ Aceptada" : "H₀ No Rechazada"}
                    </div>
                    <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900">
                        {stats.rejectH0 ? "Existe evidencia de rendimiento real" : "El rendimiento es atribuible al azar"}
                    </h2>
                    <div className="flex justify-center pt-2">
                        <span className={cn(
                            "px-5 py-2 rounded-xl text-base font-bold shadow-sm border border-white/50 backdrop-blur-md",
                            stats.evidenceLevel === 'strong' && "bg-[#f3f7f4] text-[#1f4d3a] border-[#dbe7e0]",
                            stats.evidenceLevel === 'moderate' && "bg-[#fafbf8] text-slate-700 border-slate-200",
                            stats.evidenceLevel === 'weak' && "bg-[#fafbf8] text-slate-700 border-slate-200",
                            stats.evidenceLevel === 'none' && "bg-[#fafbf8] text-slate-600 border-slate-200",
                        )}>
                            {stats.evidence} • p-value: {stats.pValue.toFixed(4)}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* INTERPRETATION */}
                <div className="bg-glass rounded-3xl border border-slate-200 p-6 lg:col-span-1 flex flex-col justify-center space-y-4">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                        <Info className="w-5 h-5 text-[#1f4d3a]" /> Interpretación
                    </h3>
                    <p className="text-slate-600 leading-relaxed text-lg">
                        Con un nivel de confianza del <span className="font-bold text-slate-900">{confidence * 100}%</span>,
                        el análisis indica que {stats.rejectH0 ? "es extremadamente improbable " : "es altamente probable "}
                        observar estos retornos si el activo no tuviera tendencia.
                    </p>
                    <div className="h-px w-full bg-slate-200" />
                    <div className="text-sm text-slate-500 italic">
                        {stats.evidence === 'Evidencia Fuerte' && "Resultado estadísticamente significativo."}
                        {stats.evidence === 'Sin evidencia' && "Los datos son indistinguibles del ruido blanco."}
                    </div>
                </div>

                {/* CHART */}
                <div className="bg-glass rounded-3xl border border-slate-200 p-6 lg:col-span-2 shadow-sm">
                    <h4 className="text-xs font-bold text-center mb-6 text-slate-400 uppercase tracking-widest">Histograma de Retornos vs Curva Normal</h4>
                    <div style={{ width: '100%', height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis dataKey="x" tickFormatter={(v) => (v * 100).toFixed(1) + '%'} style={{ fontSize: '12px', fill: '#94a3b8' }} axisLine={false} tickLine={false} dy={10} />
                                <YAxis hide />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 8px 20px rgba(15,23,42,0.08)', padding: '12px' }}
                                    formatter={(val) => val.toFixed(2)}
                                    labelFormatter={() => ''}
                                />
                                <Bar dataKey="freq" fill="url(#colorFreqH)" radius={[4, 4, 0, 0]} opacity={0.8} />
                                <Line type="monotone" dataKey="pdf" stroke="#1f4d3a" strokeWidth={3} dot={false} strokeOpacity={0.8} />
                                <defs>
                                    <linearGradient id="colorFreqH" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#cdd9d2" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#cdd9d2" stopOpacity={0.2} />
                                    </linearGradient>
                                </defs>
                                <ReferenceLine x={0} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: 'H₀', fill: '#64748b', fontSize: 12, position: 'insideTopRight' }} />
                                <ReferenceLine x={stats.mean} stroke="#1f4d3a" label={{ value: 'x̄', fill: '#1f4d3a', fontSize: 14, fontWeight: 'bold', position: 'insideTop' }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* DETAILS */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition-colors hover:bg-[#fcfcfa]">
                <button onClick={() => setShowDetails(!showDetails)} className="w-full flex items-center justify-between p-5 text-left">
                    <span className="font-bold text-slate-600 flex items-center gap-2"><Settings className="w-4 h-4" /> Detalles Matemáticos — T-Test</span>
                    {showDetails ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </button>
                {showDetails && (
                    <div className="animate-in slide-in-from-top-2 border-t border-slate-200 p-6 pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                            <StatCard label="Tamaño Muestral" formula="n" value={stats.n} />
                            <StatCard label="Media Muestral" formula="x̄ = Σx / n" value={(stats.mean * 100).toFixed(4) + '%'} />
                            <StatCard label="Desvío Estándar" formula="s" value={(stats.std * 100).toFixed(4) + '%'} />
                            <StatCard label="Error Estándar" formula="SE = s / √n" value={(stats.se * 100).toFixed(4) + '%'} color="slate" />
                            <StatCard label="Estadístico t" formula="t = x̄ / SE" value={stats.tStat.toFixed(4)} color="blue" />
                            <StatCard label="Valor-p" formula="P(|T| > |t|)" value={stats.pValue < 0.0001 ? "< 0.0001" : stats.pValue.toFixed(4)} color="blue" />
                            <div className="col-span-1 md:col-span-2 flex flex-col gap-1 rounded-xl border border-slate-200 bg-[#fafbf8] p-4">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Intervalo de Confianza ({(1 - stats.alpha) * 100}%)</span>
                                <div className="flex items-center justify-between gap-4">
                                    <span className="hidden font-serif italic text-slate-500 md:inline">IC = x̄ ± t_crit · SE</span>
                                    <span className="w-full text-right font-mono text-xl font-bold text-slate-900">
                                        [ {(stats.ciLow * 100).toFixed(4)}% ; {(stats.ciHigh * 100).toFixed(4)}% ]
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* RUNS TEST */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition-colors hover:bg-[#fcfcfa]">
                <button onClick={() => setShowRuns(!showRuns)} className="w-full flex items-center justify-between p-5 text-left">
                    <span className="font-bold text-slate-600 flex items-center gap-2">
                        <Info className="w-4 h-4" /> Test de Rachas — Eficiencia de Mercado (Random Walk)
                    </span>
                    {showRuns ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </button>
                {showRuns && (
                    <div className="animate-in slide-in-from-top-2 space-y-4 border-t border-slate-200 p-6">
                        <div className={cn(
                            "p-4 rounded-xl border text-center",
                            runsStats.rejectRandomWalk
                                ? "bg-rose-50 border-rose-200 text-rose-700"
                                : "bg-[#f3f7f4] border-[#dbe7e0] text-[#1f4d3a]"
                        )}>
                            <div className="text-lg font-bold">
                                {runsStats.rejectRandomWalk
                                    ? "Se rechaza H₀ — Los retornos NO son aleatorios"
                                    : "No se rechaza H₀ — Los retornos son consistentes con un Random Walk"}
                            </div>
                            <div className="text-sm mt-1 opacity-80">p-value = {runsStats.pValue.toFixed(4)}</div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard label="Rachas Observadas" formula="R" value={runsStats.runs} />
                            <StatCard label="Rachas Esperadas" formula="μ_R" value={runsStats.meanRuns.toFixed(2)} />
                            <StatCard label="Z-estadístico" formula="Z" value={runsStats.zStat.toFixed(4)} color="blue" />
                            <StatCard label="p-value" formula="H₀: aleatorio" value={runsStats.pValue.toFixed(4)} color="blue" />
                            <StatCard label="Retornos Positivos" formula="n₊" value={runsStats.nPos} />
                            <StatCard label="Retornos Negativos" formula="n₋" value={runsStats.nNeg} />
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-[#fafbf8] p-4 text-sm italic text-slate-600">
                            Si el mercado es eficiente, los retornos son aleatorios (sin patrones). Pocas rachas = posible momentum. Muchas rachas = posible reversión a la media.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ label, formula, value, color = 'slate' }) {
    const colors = {
        slate: { bg: 'bg-white', border: 'border-slate-200', label: 'text-slate-400', formula: 'text-slate-500', value: 'text-slate-900' },
        blue: { bg: 'bg-white', border: 'border-slate-200', label: 'text-slate-400', formula: 'text-slate-500', value: 'text-slate-900' },
    };
    const c = colors[color];
    return (
        <div className={`${c.bg} p-4 rounded-xl border ${c.border} flex flex-col gap-1`}>
            <span className={`text-xs font-bold ${c.label} uppercase tracking-wider`}>{label}</span>
            <div className="flex items-baseline justify-between">
                <span className={`font-serif italic ${c.formula}`}>{formula}</span>
                <span className={`text-xl font-bold ${c.value}`}>{value}</span>
            </div>
        </div>
    );
}
