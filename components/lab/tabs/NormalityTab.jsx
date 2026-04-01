import React, { useMemo } from 'react';
import { Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart } from 'recharts';
import { jStat } from '@/lib/vendor/jstat-wrapper';
import { calculateNormality } from '../statsUtils';

export default function NormalityTab({ returns }) {
    const normality = useMemo(() => calculateNormality(returns), [returns]);

    // QQ-Plot data
    const qqData = useMemo(() => {
        const sorted = [...returns].sort((a, b) => a - b);
        const n = sorted.length;
        return sorted.map((val, i) => {
            const p = (i + 0.5) / n;
            const theoretical = jStat.normal.inv(p, 0, 1);
            return { theoretical, observed: val };
        });
    }, [returns]);

    // QQ line: from 1st to 3rd quartile
    const qqLine = useMemo(() => {
        const sorted = [...returns].sort((a, b) => a - b);
        const n = sorted.length;
        const q1Obs = sorted[Math.floor(0.25 * n)];
        const q3Obs = sorted[Math.floor(0.75 * n)];
        const q1Theo = jStat.normal.inv(0.25, 0, 1);
        const q3Theo = jStat.normal.inv(0.75, 0, 1);
        const slope = (q3Obs - q1Obs) / (q3Theo - q1Theo);
        const intercept = q1Obs - slope * q1Theo;

        const minT = qqData[0].theoretical;
        const maxT = qqData[qqData.length - 1].theoretical;
        return [
            { x: minT, y: slope * minT + intercept },
            { x: maxT, y: slope * maxT + intercept },
        ];
    }, [returns, qqData]);

    const { pValue, skewness, kurtosisExcess, jbStat, rejectNormality } = normality;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* BANNER */}
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-[#fafbf8] px-4 py-1.5 text-sm font-bold uppercase tracking-wide text-[#1f4d3a]">
                        Test de Normalidad — Jarque-Bera
                    </div>
                    <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
                        {rejectNormality
                            ? "Los retornos NO siguen una distribución normal"
                            : "Los retornos son consistentes con normalidad"}
                    </h2>
                    <p className="text-lg text-slate-500">
                        p-value = <span className="font-bold">{pValue < 0.0001 ? "< 0.0001" : pValue.toFixed(4)}</span>
                        {rejectNormality ? " — Se rechaza H₀ al nivel 5%" : " — No se rechaza H₀"}
                    </p>
                </div>
            </div>

            {/* CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <NormCard label="Asimetría (Skewness)" value={skewness.toFixed(4)} formula="S = E[(x-μ)³]/σ³"
                    note={Math.abs(skewness) < 0.5 ? "Simétrica" : skewness > 0 ? "Cola derecha" : "Cola izquierda"}
                    color={Math.abs(skewness) < 0.5 ? "green" : "yellow"} />
                <NormCard label="Curtosis Exceso" value={kurtosisExcess.toFixed(4)} formula="K = E[(x-μ)⁴]/σ⁴ - 3"
                    note={Math.abs(kurtosisExcess) < 1 ? "Mesocúrtica" : kurtosisExcess > 0 ? "Leptocúrtica (colas pesadas)" : "Platicúrtica"}
                    color={Math.abs(kurtosisExcess) < 1 ? "green" : "red"} />
                <NormCard label="Estadístico JB" value={jbStat.toFixed(4)} formula="(n/6)(S² + K²/4)" color="blue" />
                <NormCard label="p-value" value={pValue < 0.0001 ? "< 0.0001" : pValue.toFixed(4)} formula="1 - χ²_cdf(JB, 2)"
                    color={pValue < 0.05 ? "red" : "green"}
                    note={pValue < 0.05 ? "Rechaza normalidad (α=5%)" : "No rechaza normalidad"} />
            </div>

            {/* QQ-PLOT */}
            <div className="bg-glass rounded-3xl border border-slate-200 p-6 shadow-sm">
                <h4 className="text-xs font-bold text-center mb-1 text-slate-400 uppercase tracking-widest">QQ-Plot — Cuantiles Observados vs Teóricos Normales</h4>
                <p className="text-center text-xs text-slate-400 mb-6">
                    Si los puntos siguen la línea diagonal, los retornos son normales. Las desviaciones revelan colas pesadas o asimetría.
                </p>
                <div style={{ width: '100%', height: '350px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                                dataKey="theoretical"
                                type="number"
                                domain={['auto', 'auto']}
                                label={{ value: 'Cuantiles Teóricos N(0,1)', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 12 }}
                                tickFormatter={(v) => v.toFixed(1)}
                                style={{ fontSize: '11px', fill: '#94a3b8' }}
                                axisLine={false} tickLine={false}
                            />
                            <YAxis
                                dataKey="observed"
                                type="number"
                                domain={['auto', 'auto']}
                                tickFormatter={(v) => (v * 100).toFixed(1) + '%'}
                                style={{ fontSize: '11px', fill: '#94a3b8' }}
                                axisLine={false} tickLine={false}
                                label={{ value: 'Cuantiles Observados', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 12 }}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 8px 20px rgba(15,23,42,0.08)', padding: '12px' }}
                                formatter={(val, name) => [
                                    name === 'observed' ? (val * 100).toFixed(3) + '%' : val.toFixed(3),
                                    name === 'observed' ? 'Observado' : 'Teórico'
                                ]}
                            />
                            <Scatter name="QQ" data={qqData} dataKey="observed" xKey="theoretical" fill="#9eb6aa" fillOpacity={0.9} r={3} />
                            <Line
                                data={qqLine}
                                dataKey="y"
                                xKey="x"
                                stroke="#1f4d3a"
                                strokeWidth={2}
                                dot={false}
                                type="linear"
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* PEDAGOGICAL NOTE */}
            <div className="rounded-xl border border-slate-200 bg-[#fafbf8] p-4 text-sm italic text-slate-600">
                Si los retornos no son normales (colas pesadas), los modelos basados en normalidad como el VaR paramétrico subestiman el riesgo real. Una curtosis positiva indica que los eventos extremos son más frecuentes de lo esperado bajo normalidad.
            </div>
        </div>
    );
}

function NormCard({ label, value, formula, note, color = 'slate' }) {
    const palette = {
        slate: { bg: 'bg-white', border: 'border-slate-200', label: 'text-slate-400', value: 'text-slate-900', note: 'text-slate-500' },
        blue: { bg: 'bg-white', border: 'border-slate-200', label: 'text-slate-400', value: 'text-slate-900', note: 'text-slate-500' },
        green: { bg: 'bg-white', border: 'border-slate-200', label: 'text-slate-400', value: 'text-slate-900', note: 'text-slate-500' },
        yellow: { bg: 'bg-white', border: 'border-slate-200', label: 'text-slate-400', value: 'text-slate-900', note: 'text-slate-500' },
        red: { bg: 'bg-white', border: 'border-slate-200', label: 'text-slate-400', value: 'text-slate-900', note: 'text-slate-500' },
    };
    const c = palette[color];
    return (
        <div className={`${c.bg} p-4 rounded-xl border ${c.border} flex flex-col gap-1`}>
            <span className={`text-xs font-bold ${c.label} uppercase tracking-wider`}>{label}</span>
            <span className={`text-2xl font-bold font-mono ${c.value} mt-1`}>{value}</span>
            <span className={`text-xs font-mono italic ${c.label}`}>{formula}</span>
            {note && <span className={`text-xs font-semibold ${c.note} mt-1`}>{note}</span>}
        </div>
    );
}
