import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import { runMonteCarlo } from '../statsUtils';
import { cn } from '../utils';
import { RefreshCw } from 'lucide-react';

const HORIZONS = [
    { label: '1 Mes',   days: 21  },
    { label: '3 Meses', days: 63  },
    { label: '6 Meses', days: 126 },
    { label: '1 Año',   days: 252 },
];
const PATH_OPTIONS = [100, 300, 1000];

export default function MonteCarloTab({ returns }) {
    const [horizonIdx, setHorizonIdx] = useState(2);   // default 6M
    const [nPaths, setNPaths] = useState(300);
    const [seed, setSeed] = useState(0);               // increment to re-run

    const nDays = HORIZONS[horizonIdx].days;

    const mc = useMemo(
        () => runMonteCarlo(returns, nDays, nPaths),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [returns, nDays, nPaths, seed]
    );

    const final = mc.percentileData[nDays];

    const tickInterval = Math.floor(nDays / 6);

    const CustomTooltip = ({ active, payload, label }) => {
        if (!active || !payload?.length) return null;
        return (
            <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-3 text-xs space-y-1">
                <p className="font-bold text-slate-500">Día {label}</p>
                {payload.map(p => (
                    <p key={p.dataKey} style={{ color: p.color }} className="font-mono">
                        {p.name}: {p.value > 0 ? '+' : ''}{p.value.toFixed(2)}%
                    </p>
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* BANNER */}
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-[#fafbf8] px-4 py-1.5 text-sm font-bold uppercase tracking-wide text-[#1f4d3a]">
                        Simulación Monte Carlo — {nPaths.toLocaleString()} trayectorias
                    </div>
                    <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
                        Retorno esperado en {HORIZONS[horizonIdx].label}:{' '}
                        <span className={final.p50 >= 0 ? 'text-[#1f4d3a]' : 'text-rose-600'}>
                            {final.p50 > 0 ? '+' : ''}{final.p50.toFixed(2)}%
                        </span>
                    </h2>
                    <div className="flex justify-center gap-3 flex-wrap">
                        <span className={cn(
                            "inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full font-bold border text-sm",
                            mc.probPositive > 60 ? "bg-[#f3f7f4] text-[#1f4d3a] border-[#dbe7e0]"
                                : mc.probPositive > 40 ? "bg-[#fafbf8] text-slate-700 border-slate-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                        )}>
                            {mc.probPositive.toFixed(1)}% de probabilidad de retorno positivo
                        </span>
                    </div>
                </div>
            </div>

            {/* CONFIG */}
            <div className="bg-glass rounded-2xl border border-slate-200 p-4 flex flex-wrap gap-6 items-end justify-center">
                <div className="flex flex-col gap-1.5 items-center">
                    <span className="text-[11px] text-slate-400 tracking-wider uppercase font-bold">Horizonte</span>
                    <div className="flex rounded-lg bg-[#f4f6f2] p-1 gap-1">
                        {HORIZONS.map((h, i) => (
                            <button key={i} onClick={() => setHorizonIdx(i)}
                                className={cn("px-3 py-1.5 text-xs font-bold rounded-md transition-all",
                                    horizonIdx === i ? "bg-white text-[#1f4d3a] shadow-sm" : "text-slate-500 hover:text-slate-700")}>
                                {h.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex flex-col gap-1.5 items-center">
                    <span className="text-[11px] text-slate-400 tracking-wider uppercase font-bold">Simulaciones</span>
                    <div className="flex rounded-lg bg-[#f4f6f2] p-1 gap-1">
                        {PATH_OPTIONS.map(n => (
                            <button key={n} onClick={() => setNPaths(n)}
                                className={cn("px-3 py-1.5 text-xs font-bold rounded-md transition-all",
                                    nPaths === n ? "bg-white text-[#1f4d3a] shadow-sm" : "text-slate-500 hover:text-slate-700")}>
                                {n.toLocaleString()}
                            </button>
                        ))}
                    </div>
                </div>
                <button onClick={() => setSeed(s => s + 1)}
                    className="flex items-center gap-2 rounded-lg bg-[#1f4d3a] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#183b2d]">
                    <RefreshCw className="w-4 h-4" /> Re-simular
                </button>
            </div>

            {/* RESULT CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <MCCard label="Caso Optimista (P95)" value={final.p95 > 0 ? '+' + final.p95.toFixed(2) + '%' : final.p95.toFixed(2) + '%'} color="green" note="5% más optimista" />
                <MCCard label="Cuartil Alto (P75)"   value={final.p75 > 0 ? '+' + final.p75.toFixed(2) + '%' : final.p75.toFixed(2) + '%'} color="teal"  note="25% de trayectorias superan esto" />
                <MCCard label="Mediana (P50)"        value={final.p50 > 0 ? '+' + final.p50.toFixed(2) + '%' : final.p50.toFixed(2) + '%'} color="indigo" note="Retorno más probable" />
                <MCCard label="Cuartil Bajo (P25)"   value={final.p25.toFixed(2) + '%'} color="yellow" note="75% de trayectorias superan esto" />
                <MCCard label="Caso Pesimista (P5)"  value={final.p5.toFixed(2) + '%'}  color="red"    note="5% más pesimista" />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Prob. Retorno Positivo</p>
                    <p className="mt-1 font-mono text-3xl font-extrabold text-[#1f4d3a]">{mc.probPositive.toFixed(1)}%</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Prob. Pérdida {'>'} 10%</p>
                    <p className="mt-1 font-mono text-3xl font-extrabold text-rose-600">{mc.probLoss10.toFixed(1)}%</p>
                </div>
            </div>

            {/* FAN CHART */}
            <div className="bg-glass rounded-3xl border border-slate-200 p-6 shadow-sm">
                <h4 className="text-xs font-bold text-center mb-1 text-slate-400 uppercase tracking-widest">
                    Fan Chart — {nPaths.toLocaleString()} Trayectorias Simuladas · Horizonte {HORIZONS[horizonIdx].label}
                </h4>
                <p className="text-center text-xs text-slate-400 mb-6">
                    Cada línea es un percentil de la distribución de retornos posibles en el tiempo
                </p>
                <div style={{ width: '100%', height: '360px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={mc.percentileData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis dataKey="day" label={{ value: 'Días', position: 'insideBottomRight', offset: -5, fill: '#94a3b8', fontSize: 11 }}
                                style={{ fontSize: '10px', fill: '#94a3b8' }} axisLine={false} tickLine={false} interval={tickInterval} />
                            <YAxis tickFormatter={v => (v > 0 ? '+' : '') + v.toFixed(1) + '%'}
                                style={{ fontSize: '10px', fill: '#94a3b8' }} axisLine={false} tickLine={false} width={58} />
                            <Tooltip content={<CustomTooltip />} />
                            <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="4 3" strokeWidth={1.5} />
                            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }} />

                            <Line dataKey="p95" name="P95 (Optimista)"  stroke="#c6d4cc" strokeWidth={1.5} dot={false} strokeDasharray="5 3" legendType="line" />
                            <Line dataKey="p75" name="P75"              stroke="#7ba38d" strokeWidth={2}   dot={false} legendType="line" />
                            <Line dataKey="p50" name="Mediana (P50)"    stroke="#1f4d3a" strokeWidth={3}   dot={false} legendType="line" />
                            <Line dataKey="p25" name="P25"              stroke="#a8b5ae" strokeWidth={2}   dot={false} legendType="line" />
                            <Line dataKey="p5"  name="P5 (Pesimista)"   stroke="#d8b4b4" strokeWidth={1.5} dot={false} strokeDasharray="5 3" legendType="line" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* PEDAGOGICAL NOTE */}
            <div className="rounded-xl border border-slate-200 bg-[#fafbf8] p-4 text-sm italic text-slate-600">
                La simulación asume que los retornos futuros siguen la misma distribución normal que los históricos (mismo μ y σ). En la práctica, la volatilidad cambia con el tiempo (clustering de volatilidad). El fan chart se abre con el tiempo porque la incertidumbre se acumula: cuanto mayor el horizonte, mayor la dispersión de resultados posibles.
            </div>
        </div>
    );
}

function MCCard({ label, value, note, color = 'slate' }) {
    const palette = {
        green:  { bg: 'bg-white', border: 'border-slate-200', label: 'text-slate-400', value: 'text-slate-900', note: 'text-slate-500' },
        teal:   { bg: 'bg-white', border: 'border-slate-200', label: 'text-slate-400', value: 'text-slate-900', note: 'text-slate-500' },
        indigo: { bg: 'bg-white', border: 'border-slate-200', label: 'text-slate-400', value: 'text-slate-900', note: 'text-slate-500' },
        yellow: { bg: 'bg-white', border: 'border-slate-200', label: 'text-slate-400', value: 'text-slate-900', note: 'text-slate-500' },
        red:    { bg: 'bg-white', border: 'border-slate-200', label: 'text-slate-400', value: 'text-slate-900', note: 'text-slate-500' },
        slate:  { bg: 'bg-white', border: 'border-slate-200', label: 'text-slate-400', value: 'text-slate-900', note: 'text-slate-500' },
    };
    const c = palette[color];
    return (
        <div className={`${c.bg} p-4 rounded-xl border ${c.border} flex flex-col gap-1 text-center`}>
            <span className={`text-xs font-bold ${c.label} uppercase tracking-wider leading-tight`}>{label}</span>
            <span className={`text-2xl font-bold font-mono ${c.value} mt-1`}>{value}</span>
            {note && <span className={`text-xs ${c.note}`}>{note}</span>}
        </div>
    );
}
