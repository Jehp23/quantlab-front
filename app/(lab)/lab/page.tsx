/**
 * Laboratorio probabilístico — análisis estadístico de activos financieros.
 *
 * Laboratory se carga con dynamic import + ssr:false porque sus tabs usan
 * jstat.js (UMD bundle) que accede a `window` en su inicialización.
 * Sin ssr:false, Next.js ejecuta el bundle en Node.js donde `window` no existe
 * y el módulo crashea silenciosamente, rompiendo todos los análisis estadísticos.
 */
import dynamic from "next/dynamic";

const Laboratory = dynamic(() => import("@/components/lab/Laboratory"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#1f4d3a] border-t-transparent" />
    </div>
  ),
});

export default function LabPage() {
  return <Laboratory />;
}
