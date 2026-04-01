import React from 'react';
import { X, BookOpen, FlaskConical, BarChart2, TrendingUp, Lightbulb } from 'lucide-react';
import { EDUCATION } from './data/educationContent';
import { cn } from './utils';

export default function InfoPanel({ activeTab, onClose }) {
    const content = EDUCATION[activeTab];
    if (!content) return null;

    return (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/92 shadow-sm animate-in slide-in-from-top-3 duration-300">
            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-[#fafbf8]">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">{content.icon}</span>
                    <div>
                        <p className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-[#1f4d3a]">Guía del Módulo</p>
                        <h3 className="text-sm font-extrabold text-slate-900">{content.title}</h3>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* BODY */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">

                {/* 1 — OBJETIVO */}
                <Section icon={<BookOpen className="w-4 h-4" />} title="¿Qué analiza?" color="blue">
                    <p className="text-sm text-slate-600 leading-relaxed">{content.objective}</p>
                </Section>

                {/* 2 — CONCEPTOS CLAVE */}
                <Section icon={<Lightbulb className="w-4 h-4" />} title="Conceptos clave" color="amber">
                    <ul className="space-y-2">
                        {content.concepts.map((c, i) => (
                            <li key={i} className="text-sm">
                                <span className="mr-1.5 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs font-bold text-slate-700">{c.term}</span>
                                <span className="text-slate-500">{c.def}</span>
                            </li>
                        ))}
                    </ul>
                </Section>

                {/* 3 — FÓRMULAS */}
                <Section icon={<FlaskConical className="w-4 h-4" />} title="Fórmulas clave" color="violet">
                    <ul className="space-y-3">
                        {content.formulas.map((f, i) => (
                            <li key={i}>
                                <p className="mb-0.5 text-xs font-bold uppercase tracking-wider text-slate-400">{f.name}</p>
                                <p className="rounded-lg border border-slate-200 bg-[#fafbf8] px-3 py-1.5 font-mono text-sm text-slate-700">
                                    {f.expr}
                                </p>
                            </li>
                        ))}
                    </ul>
                </Section>

                {/* 4 — INTERPRETACIÓN + USO */}
                <div className="space-y-4">
                    <Section icon={<BarChart2 className="w-4 h-4" />} title="¿Cómo interpretar?" color="emerald">
                        <p className="text-sm text-slate-600 leading-relaxed">{content.interpretation}</p>
                    </Section>
                    <Section icon={<TrendingUp className="w-4 h-4" />} title="Uso práctico" color="teal">
                        <p className="text-sm text-slate-600 leading-relaxed">{content.practicalUse}</p>
                    </Section>
                </div>

            </div>
        </div>
    );
}

function Section({ icon, title, color, children }) {
    const colors = {
        blue:   { header: 'text-[#1f4d3a]', border: 'border-slate-200', bg: 'bg-[#fafbf8]' },
        amber:  { header: 'text-[#1f4d3a]', border: 'border-slate-200', bg: 'bg-[#fafbf8]' },
        violet: { header: 'text-[#1f4d3a]', border: 'border-slate-200', bg: 'bg-[#fafbf8]' },
        emerald:{ header: 'text-[#1f4d3a]', border: 'border-slate-200', bg: 'bg-[#fafbf8]' },
        teal:   { header: 'text-[#1f4d3a]', border: 'border-slate-200', bg: 'bg-[#fafbf8]' },
    };
    const c = colors[color] || colors.blue;
    return (
        <div className={cn('rounded-2xl border p-4', c.bg, c.border)}>
            <div className={cn('flex items-center gap-2 font-bold text-xs uppercase tracking-wider mb-3', c.header)}>
                {icon}
                {title}
            </div>
            {children}
        </div>
    );
}
