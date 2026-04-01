/**
 * Utilidades genéricas compartidas entre componentes.
 */

/**
 * Extrae un mensaje legible de cualquier valor capturado en un catch.
 * Evita repetir el patrón `e instanceof Error ? e.message : "Error desconocido"`.
 */
export function getErrorMessage(e: unknown): string {
  return e instanceof Error ? e.message : "Error desconocido";
}
