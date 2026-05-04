/**
 * jStat wrapper — maneja el entorno de Next.js correctamente.
 *
 * jstat.js es un UMD bundle que en su factory usa `(this, factory)` donde
 * `this` es `undefined` en ES modules (top-level). En ese caso el branch
 * CommonJS (`typeof exports === 'object'`) actúa vía module.exports.
 * Este wrapper normaliza la exportación para evitar crashes en SSR.
 */
import jStatModule from "./jstat";

// jstat.js setea jStat.jStat = jStat al final del bundle como alias de compatibilidad.
// Si el import falla por algún motivo en SSR (window undefined), retornamos un proxy vacío
// para que el módulo no crashee — los tabs usan "use client" pero este import es estático.
export const jStat = jStatModule?.jStat ?? jStatModule ?? {};
