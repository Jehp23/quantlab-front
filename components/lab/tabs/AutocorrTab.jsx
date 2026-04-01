import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { jStat } from '@/lib/vendor/jstat-wrapper';
import { calculateACF } from '../statsUtils';
import { cn } from '../utils';

export default function AutocorrTab({ returns }) {
    const { acfData, ci, q, sigLags } = useMemo(() => calculateACF(returns, 20), [returns]);

    // Ljung-Box p-value (chi-squared, df = maxLag = 20)
    const lbPValue = 1 - jStat.chisquare.cdf(q, 20);
    const rejectIndependence = lbPValue < 0.05;

    const CustomTooltip = ({ active, payload }) => {
        if (!active || !payload?.length) return null;
        const { lag, acf, significant } = payload[0].payload;
        return (
            <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-3 text-xs space-y-1">
                <p className="font-bold text-slate-600">Lag {lag}</p>
                <p className={cn("font-mono font-bold", significant ? 'text-rose-600' : 'text-[#1f4d3a]')}>
                    ACF = {acf.toFixed(4)}
                </p>
                <p className="text-slate-500">IC 95%: ±{ci.toFixed(4)}</p>
                <p className={significant ? 'text-rose-600 font-semibold' : 'text-slate-400'}>
                    {significant ? 'Significativo' : 'No significativo'}
                </p>
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* BANNER */}
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                <div className="space-y-3">
                    <div className={cn("inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-bold uppercase tracking-wide",
                        rejectIndependence ? "border-rose-200 bg-rose-50 text-rose-700" : "border-[#dbe7e0] bg-[#f3f7f4] text-[#1f4d3a]")}>
                        Autocorrelación de Retornos — Test de Ljung-Box
                    </div>
                    <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
                        {rejectIndependence
                            ? "Los retornos presentan dependencia serial"
                            : "Los retornos son serialmente independientes"}
                    </h2>
                    <p className="text-lg text-slate-500">
                        Ljung-Box Q({20}) = <span className="font-bold">{q.toFixed(3)}</span>
                        {' '}— p-value = <span className="font-bold">{lbPValue < 0.0001 ? '< 0.0001' : lbPValue.toFixed(4)}</span>
                    </p>
                </div>
            </div>

            {/* CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ACFCard label="Lags Significativos" value={`${sigLags} / 20`}
                    color={sigLags > 4 ? 'red' : sigLags > 1 ? 'yellow' : 'green'}
                    note={sigLags > 4 ? 'Fuerte dependencia' : sigLags > 1 ? 'Dependencia moderada' : 'Independencia'} />
                <ACFCard label="Ljung-Box Q(20)" value={q.toFixed(3)} formula="n(n+2)Σρ²/(n-k)"
                    color="blue" />
                <ACFCard label="p-value (LB)" value={lbPValue < 0.0001 ? '< 0.0001' : lbPValue.toFixed(4)}
                    color={rejectIndependence ? 'red' : 'green'}
                    note={rejectIndependence ? 'Rechaza H₀ (independencia)' : 'No rechaza H₀'} />
                <ACFCard label="Banda de Confianza" value={`±${ci.toFixed(4)}`} formula="±1.96/√n"
                    color="slate" note="IC 95% bajo H₀" />
            </div>

            {/* ACF CHART */}
            <div className="bg-glass rounded-3xl border border-slate-200 p-6 shadow-sm">
                <h4 className="text-xs font-bold text-center mb-1 text-slate-400 uppercase tracking-widest">
                    Función de Autocorrelación (ACF) — Lags 1 a 20
                </h4>
                <p className="text-center text-xs text-slate-400 mb-6">
                    <span className="mr-1 inline-block h-3 w-3 rounded-sm bg-[#c48f8f] align-middle" />
                    Barras rojas = autocorrelación significativa al 95% · Líneas punteadas = banda de confianza
                </p>
                <div style={{ width: '100%', height: '320px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={acfData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis dataKey="lag" label={{ value: 'Lag', position: 'insideBottomRight', offset: -5, fill: '#94a3b8', fontSize: 11 }}
                                style={{ fontSize: '11px', fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                            <YAxis domain={[-0.5, 0.5]} tickFormatter={v => v.toFixed(2)}
                                style={{ fontSize: '11px', fill: '#94a3b8' }} axisLine={false} tickLine={false} width={45} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148,163,184,0.1)' }} />
                            <ReferenceLine y={0}   stroke="#94a3b8" strokeWidth={1} />
                            <ReferenceLine y={ci}  stroke="#c48f8f" strokeDasharray="5 3" strokeWidth={1.5}
                                label={{ value: '+IC', fill: '#c48f8f', fontSize: 10, position: 'insideTopRight' }} />
                            <ReferenceLine y={-ci} stroke="#c48f8f" strokeDasharray="5 3" strokeWidth={1.5}
                                label={{ value: '-IC', fill: '#c48f8f', fontSize: 10, position: 'insideBottomRight' }} />
                            <Bar dataKey="acf" radius={[4, 4, 0, 0]} maxBarSize={28}>
                                {acfData.map((entry, index) => (
                                    <Cell key={index}
                                        fill={entry.significant ? '#c48f8f' : '#cdd9d2'}
                                        fillOpacity={0.85}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* INDIVIDUAL LAGS TABLE (top 5 most significant) */}
            {sigLags > 0 && (
                <div className="bg-glass rounded-2xl border border-slate-200 p-5">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                        Lags Más Significativos
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {[...acfData]
                            .filter(d => d.significant)
                            .sort((a, b) => Math.abs(b.acf) - Math.abs(a.acf))
                            .slice(0, 5)
                            .map(d => (
                                <div key={d.lag} className="rounded-xl border border-slate-200 bg-white p-3 text-center">
                                    <span className="text-xs font-bold uppercase text-slate-400">Lag {d.lag}</span>
                                    <p className="mt-1 font-mono text-xl font-bold text-slate-900">{d.acf.toFixed(4)}</p>
                                    <p className="text-xs text-slate-500">{d.acf > 0 ? 'Persistencia' : 'Reversión'}</p>
                                </div>
                            ))
                        }
                    </div>
                </div>
            )}

            {/* PEDAGOGICAL NOTES */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-200 bg-[#fafbf8] p-4 text-sm italic text-slate-600">
                    <strong>¿Qué mide la ACF?</strong> La autocorrelación en el lag k mide si el retorno de hoy está correlacionado con el retorno de k días atrás. Bajo la hipótesis de mercado eficiente (forma débil), todos los lags deberían ser estadísticamente cero.
                </div>
                <div className="rounded-xl border border-slate-200 bg-[#fafbf8] p-4 text-sm italic text-slate-600">
                    <strong>Persistencia vs Reversión:</strong> Una ACF positiva en el lag 1 indica momentum (retornos positivos tienden a continuar). Una ACF negativa indica reversión a la media. Ambas son explotables con estrategias de trading activo.
                </div>
            </div>
        </div>
    );
}

function ACFCard({ label, value, formula, note, color = 'slate' }) {
    const palette = {
        slate:  { bg: 'bg-white', border: 'border-slate-200', label: 'text-slate-400', value: 'text-slate-900', note: 'text-slate-500' },
        blue:   { bg: 'bg-white', border: 'border-slate-200', label: 'text-slate-400', value: 'text-slate-900', note: 'text-slate-500' },
        green:  { bg: 'bg-white', border: 'border-slate-200', label: 'text-slate-400', value: 'text-slate-900', note: 'text-slate-500' },
        yellow: { bg: 'bg-white', border: 'border-slate-200', label: 'text-slate-400', value: 'text-slate-900', note: 'text-slate-500' },
        red:    { bg: 'bg-white', border: 'border-slate-200', label: 'text-slate-400', value: 'text-slate-900', note: 'text-slate-500' },
    };
    const c = palette[color];
    return (
        <div className={`${c.bg} p-4 rounded-xl border ${c.border} flex flex-col gap-1`}>
            <span className={`text-xs font-bold ${c.label} uppercase tracking-wider leading-tight`}>{label}</span>
            <span className={`text-2xl font-bold font-mono ${c.value} mt-1`}>{value}</span>
            {formula && <span className={`text-xs font-mono italic ${c.label}`}>{formula}</span>}
            {note && <span className={`text-xs font-semibold ${c.note} mt-0.5`}>{note}</span>}
        </div>
    );
}
