import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import { calculateRollingVolatility } from '../statsUtils';
import { cn } from '../utils';

export default function VolatilityTab({ returns, dates }) {
    const { chartData, annualized, avgVol, maxVol, maxDate, currentVol, regime } = useMemo(() => {
        const v10 = calculateRollingVolatility(returns, 10);
        const v20 = calculateRollingVolatility(returns, 20);
        const v30 = calculateRollingVolatility(returns, 30);

        const data = returns.map((_, i) => ({
            date: dates ? dates[i] : `Día ${i + 1}`,
            vol10: v10[i] != null ? +(v10[i] * 100).toFixed(4) : null,
            vol20: v20[i] != null ? +(v20[i] * 100).toFixed(4) : null,
            vol30: v30[i] != null ? +(v30[i] * 100).toFixed(4) : null,
        }));

        const validVol20 = v20.filter(v => v != null);
        const annualizedVol = (validVol20[validVol20.length - 1] || 0) * Math.sqrt(252) * 100;
        const avgV = validVol20.reduce((a, b) => a + b, 0) / validVol20.length * 100;
        const maxV = Math.max(...validVol20) * 100;
        let maxDateVal = '';
        const maxIdx = v20.indexOf(Math.max(...validVol20));
        if (dates && dates[maxIdx]) maxDateVal = dates[maxIdx];

        const currentV = validVol20[validVol20.length - 1] * 100;
        const regimeVal = currentV > avgV * 1.2 ? 'alta' : currentV < avgV * 0.8 ? 'baja' : 'normal';

        return {
            chartData: data,
            annualized: annualizedVol,
            avgVol: avgV,
            maxVol: maxV,
            maxDate: maxDateVal,
            currentVol: currentV,
            regime: regimeVal,
        };
    }, [returns, dates]);

    const regimeConfig = {
        alta: { label: 'Alta Volatilidad', color: 'text-rose-700 bg-rose-50 border-rose-200', dot: 'bg-rose-500' },
        baja: { label: 'Baja Volatilidad', color: 'text-[#1f4d3a] bg-[#f3f7f4] border-[#dbe7e0]', dot: 'bg-[#1f4d3a]' },
        normal: { label: 'Volatilidad Normal', color: 'text-slate-700 bg-[#fafbf8] border-slate-200', dot: 'bg-slate-400' },
    };
    const rc = regimeConfig[regime];

    const CustomTooltip = ({ active, payload, label }) => {
        if (!active || !payload || !payload.length) return null;
        return (
            <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-3 text-xs">
                <p className="font-bold text-slate-600 mb-1">{label}</p>
                {payload.map(p => p.value != null && (
                    <p key={p.dataKey} style={{ color: p.color }} className="font-mono">
                        {p.name}: {p.value.toFixed(3)}%
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
                        Volatilidad Histórica Rolling
                    </div>
                    <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
                        Volatilidad Anualizada Actual:{' '}
                        <span className="text-[#1f4d3a]">{annualized.toFixed(2)}%</span>
                    </h2>
                    <div className={cn("inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold border text-sm mt-2", rc.color)}>
                        <span className={cn("w-2.5 h-2.5 rounded-full", rc.dot)} />
                        {rc.label}
                    </div>
                </div>
            </div>

            {/* CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <VolCard label="Volatilidad Actual (20d)" value={currentVol.toFixed(3) + '%'} note="Diaria" color="blue" />
                <VolCard label="Anualizada (20d × √252)" value={annualized.toFixed(2) + '%'} note="σ_anual" color="indigo" />
                <VolCard label="Máxima del Período" value={maxVol.toFixed(3) + '%'} note={maxDate || 'Peor fecha'} color="red" />
                <VolCard label="Promedio Histórico" value={avgVol.toFixed(3) + '%'} note="Baseline" color="slate" />
            </div>

            {/* CHART */}
            <div className="bg-glass rounded-3xl border border-slate-200 p-6 shadow-sm">
                <h4 className="text-xs font-bold text-center mb-1 text-slate-400 uppercase tracking-widest">
                    Volatilidad Rolling — 10d, 20d, 30d (% diario)
                </h4>
                <p className="text-center text-xs text-slate-400 mb-6">
                    La línea punteada representa el nivel promedio del período (ventana 20d)
                </p>
                <div style={{ width: '100%', height: '340px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis
                                dataKey="date"
                                style={{ fontSize: '10px', fill: '#94a3b8' }}
                                axisLine={false} tickLine={false}
                                interval={Math.floor(chartData.length / 6)}
                                dy={8}
                            />
                            <YAxis
                                tickFormatter={(v) => v.toFixed(2) + '%'}
                                style={{ fontSize: '10px', fill: '#94a3b8' }}
                                axisLine={false} tickLine={false}
                                width={55}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
                            <ReferenceLine y={avgVol} stroke="#94a3b8" strokeDasharray="6 3" strokeWidth={1.5}
                                label={{ value: 'Promedio', fill: '#94a3b8', fontSize: 10, position: 'insideTopRight' }} />
                            <Line type="monotone" dataKey="vol10" name="10 días" stroke="#c2cfc7" strokeWidth={1.5} dot={false} connectNulls={false} />
                            <Line type="monotone" dataKey="vol20" name="20 días" stroke="#1f4d3a" strokeWidth={2.5} dot={false} connectNulls={false} />
                            <Line type="monotone" dataKey="vol30" name="30 días" stroke="#8da095" strokeWidth={2} dot={false} connectNulls={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* PEDAGOGICAL NOTE */}
            <div className="rounded-xl border border-slate-200 bg-[#fafbf8] p-4 text-sm italic text-slate-600">
                La volatilidad no es constante. Los picos suelen coincidir con eventos de mercado (earnings, crisis, datos macro). Un activo con alta volatilidad persistente implica mayor incertidumbre y, por ende, mayor riesgo potencial.
            </div>
        </div>
    );
}

function VolCard({ label, value, note, color = 'slate' }) {
    const palette = {
        slate: { bg: 'bg-white', border: 'border-slate-200', label: 'text-slate-400', value: 'text-slate-900', note: 'text-slate-500' },
        blue: { bg: 'bg-white', border: 'border-slate-200', label: 'text-slate-400', value: 'text-slate-900', note: 'text-slate-500' },
        indigo: { bg: 'bg-white', border: 'border-slate-200', label: 'text-slate-400', value: 'text-slate-900', note: 'text-slate-500' },
        red: { bg: 'bg-white', border: 'border-slate-200', label: 'text-slate-400', value: 'text-slate-900', note: 'text-slate-500' },
    };
    const c = palette[color];
    return (
        <div className={`${c.bg} p-4 rounded-xl border ${c.border} flex flex-col gap-1`}>
            <span className={`text-xs font-bold ${c.label} uppercase tracking-wider`}>{label}</span>
            <span className={`text-2xl font-bold font-mono ${c.value} mt-1`}>{value}</span>
            {note && <span className={`text-xs ${c.note}`}>{note}</span>}
        </div>
    );
}
