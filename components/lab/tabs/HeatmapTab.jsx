import React, { useMemo } from 'react';
import { calculateMonthlyReturns } from '../statsUtils';

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function getColor(ret) {
    if (ret === null || ret === undefined) return { bg: 'bg-slate-100', text: 'text-slate-300' };
    const intensity = Math.min(Math.abs(ret) / 6, 1); // cap at ±6%
    if (ret > 0) {
        return { style: { backgroundColor: `rgba(31, 77, 58, ${0.12 + intensity * 0.42})` }, text: ret > 3 ? 'text-[#16392b] font-bold' : 'text-[#1f4d3a]' };
    }
    if (ret < 0) {
        return { style: { backgroundColor: `rgba(177, 120, 120, ${0.10 + intensity * 0.34})` }, text: ret < -3 ? 'text-rose-700 font-bold' : 'text-rose-600' };
    }
    return { style: { backgroundColor: 'rgba(148, 163, 184, 0.15)' }, text: 'text-slate-500' };
}

export default function HeatmapTab({ returns, dates }) {
    const monthly = useMemo(() => calculateMonthlyReturns(returns, dates), [returns, dates]);

    if (!monthly) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="bg-glass rounded-3xl border border-slate-200 p-12 text-center">
                    <div className="text-4xl mb-4">📅</div>
                    <h3 className="text-xl font-bold text-slate-700 mb-2">Heatmap requiere fechas reales</h3>
                    <p className="text-slate-500">Cambia a modo <strong>Datos Reales</strong> y selecciona un ticker para ver el calendario de retornos.</p>
                </div>
            </div>
        );
    }

    // Build grid: { year -> { month -> ret } }
    const yearMap = {};
    monthly.forEach(({ year, month, ret }) => {
        if (!yearMap[year]) yearMap[year] = {};
        yearMap[year][month] = ret;
    });
    const years = Object.keys(yearMap).sort();

    // Monthly averages
    const monthAvg = MONTH_NAMES.map((_, mi) => {
        const vals = monthly.filter(m => m.month === mi + 1).map(m => m.ret);
        return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    });

    // Summary stats
    const sorted = [...monthly].sort((a, b) => b.ret - a.ret);
    const bestMonth = sorted[0];
    const worstMonth = sorted[sorted.length - 1];
    const posMonths = monthly.filter(m => m.ret > 0).length;
    const avgMonthly = monthly.reduce((a, m) => a + m.ret, 0) / monthly.length;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* BANNER */}
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-[#fafbf8] px-4 py-1.5 text-sm font-bold uppercase tracking-wide text-[#1f4d3a]">
                        Calendario de Retornos Mensuales
                    </div>
                    <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
                        {posMonths} de {monthly.length} meses positivos
                        <span className="ml-3 text-[#1f4d3a]">({(posMonths / monthly.length * 100).toFixed(0)}%)</span>
                    </h2>
                    <p className="text-lg text-slate-500">
                        Promedio mensual: <span className="font-bold">{avgMonthly > 0 ? '+' : ''}{avgMonthly.toFixed(2)}%</span>
                    </p>
                </div>
            </div>

            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <HeatCard label="Mejor Mes" value={'+' + bestMonth.ret.toFixed(2) + '%'}
                    note={`${MONTH_NAMES[bestMonth.month - 1]} ${bestMonth.year}`} color="green" />
                <HeatCard label="Peor Mes" value={worstMonth.ret.toFixed(2) + '%'}
                    note={`${MONTH_NAMES[worstMonth.month - 1]} ${worstMonth.year}`} color="red" />
                <HeatCard label="Meses Positivos" value={`${posMonths}/${monthly.length}`}
                    note={`${(posMonths / monthly.length * 100).toFixed(0)}% de los meses`} color="teal" />
                <HeatCard label="Promedio Mensual" value={(avgMonthly > 0 ? '+' : '') + avgMonthly.toFixed(2) + '%'}
                    note="Retorno compuesto medio" color={avgMonthly >= 0 ? 'teal' : 'red'} />
            </div>

            {/* HEATMAP GRID */}
            <div className="bg-glass rounded-3xl border border-slate-200 p-6 shadow-sm overflow-x-auto">
                <h4 className="text-xs font-bold text-center mb-6 text-slate-400 uppercase tracking-widest">
                    Retorno Mensual — Verde = Positivo · Rojo = Negativo · Intensidad = Magnitud
                </h4>
                <table className="w-full min-w-[600px] border-separate border-spacing-1">
                    <thead>
                        <tr>
                            <th className="text-xs text-slate-400 font-bold text-left pr-3 w-12">Año</th>
                            {MONTH_NAMES.map(m => (
                                <th key={m} className="text-xs text-slate-400 font-bold text-center w-14">{m}</th>
                            ))}
                            <th className="text-xs text-slate-400 font-bold text-center w-16">Anual</th>
                        </tr>
                    </thead>
                    <tbody>
                        {years.map(year => {
                            const yearTotal = Object.values(yearMap[year]).reduce((a, b) => a + b, 0);
                            const yearColor = getColor(yearTotal);
                            return (
                                <tr key={year}>
                                    <td className="text-xs font-bold text-slate-600 pr-3 py-0.5">{year}</td>
                                    {MONTH_NAMES.map((_, mi) => {
                                        const ret = yearMap[year][mi + 1];
                                        const { style, text } = getColor(ret ?? null);
                                        return (
                                            <td key={mi} className="p-0.5">
                                                <div
                                                    className={`rounded-lg h-9 flex items-center justify-center text-xs font-mono ${text}`}
                                                    style={style || { backgroundColor: 'rgba(148,163,184,0.1)' }}
                                                    title={ret != null ? `${MONTH_NAMES[mi]} ${year}: ${ret > 0 ? '+' : ''}${ret.toFixed(2)}%` : 'Sin datos'}
                                                >
                                                    {ret != null ? (ret > 0 ? '+' : '') + ret.toFixed(1) : '—'}
                                                </div>
                                            </td>
                                        );
                                    })}
                                    <td className="p-0.5">
                                        <div
                                            className={`rounded-lg h-9 flex items-center justify-center text-xs font-bold font-mono ${yearColor.text}`}
                                            style={yearColor.style || {}}
                                        >
                                            {yearTotal > 0 ? '+' : ''}{yearTotal.toFixed(1)}%
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}

                        {/* AVERAGE ROW */}
                        <tr className="border-t border-slate-200">
                            <td className="text-xs font-bold text-slate-500 pr-3 pt-2 pb-0.5">Prom.</td>
                            {monthAvg.map((avg, mi) => {
                                const { style, text } = getColor(avg);
                                return (
                                    <td key={mi} className="p-0.5 pt-2">
                                        <div
                                            className={`rounded-lg h-9 flex items-center justify-center text-xs font-bold font-mono ${text}`}
                                            style={style || { backgroundColor: 'rgba(148,163,184,0.1)' }}
                                        >
                                            {avg != null ? (avg > 0 ? '+' : '') + avg.toFixed(1) : '—'}
                                        </div>
                                    </td>
                                );
                            })}
                            <td />
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* LEGEND */}
            <div className="flex items-center justify-center gap-2 flex-wrap text-xs text-slate-500">
                <span>Escala de intensidad:</span>
                {[-5, -3, -1, 0, 1, 3, 5].map(v => {
                    const { style, text } = getColor(v);
                    return (
                        <div key={v} className={`px-2 py-1 rounded font-mono text-xs ${text}`} style={style || {}}>
                            {v > 0 ? '+' : ''}{v}%
                        </div>
                    );
                })}
                <div className="px-2 py-1 rounded font-mono text-xs text-slate-300" style={{ backgroundColor: 'rgba(148,163,184,0.1)' }}>
                    —
                </div>
                <span className="text-slate-400">= sin datos</span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-[#fafbf8] p-4 text-sm italic text-slate-600">
                Los retornos mensuales son la suma compuesta de retornos logarítmicos diarios del mes. Un patrón de meses negativos concentrados en ciertos meses puede revelar estacionalidad (ej: &quot;sell in May&quot;). La fila &quot;Prom.&quot; muestra el retorno promedio histórico de cada mes calendario.
            </div>
        </div>
    );
}

function HeatCard({ label, value, note, color }) {
    const palette = {
        teal:  { bg: 'bg-white', border: 'border-slate-200', label: 'text-slate-400', value: 'text-slate-900', note: 'text-slate-500' },
        green: { bg: 'bg-white', border: 'border-slate-200', label: 'text-slate-400', value: 'text-slate-900', note: 'text-slate-500' },
        red:   { bg: 'bg-white', border: 'border-slate-200', label: 'text-slate-400', value: 'text-slate-900', note: 'text-slate-500' },
    };
    const c = palette[color] || palette.teal;
    return (
        <div className={`${c.bg} p-4 rounded-xl border ${c.border} flex flex-col gap-1`}>
            <span className={`text-xs font-bold ${c.label} uppercase tracking-wider`}>{label}</span>
            <span className={`text-2xl font-bold font-mono ${c.value} mt-1`}>{value}</span>
            {note && <span className={`text-xs ${c.note}`}>{note}</span>}
        </div>
    );
}
