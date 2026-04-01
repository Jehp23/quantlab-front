"use client";

import Link from "next/link";

export default function OptionsPage() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <div className="nav-bar px-6 py-3 flex items-center gap-4 sticky top-0 z-10">
        <Link
          href="/"
          className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          ← Inicio
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-semibold text-gray-800">Opciones</span>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="card p-8 text-center">
          <h1 className="text-2xl font-extrabold text-gray-900 mb-4">Análisis de Opciones</h1>
          <p className="text-gray-500 mb-6">
            Próximamente: cálculo de Greeks, estrategias de opciones, volatilidad implícita y modelado de precios.
          </p>
          <Link
            href="/lab/analysis"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-xl text-sm transition-colors"
          >
            Ir al análisis de activos →
          </Link>
        </div>
      </div>
    </div>
  );
}