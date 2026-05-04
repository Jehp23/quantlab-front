import { redirect } from "next/navigation";

/**
 * /statistics redirige al laboratorio probabilístico completo (/lab).
 * La API statisticsApi.fullAnalysis está disponible en lib/api.ts y se consume
 * desde el componente Laboratory en /lab.
 */
export default function StatisticsPage() {
  redirect("/lab");
}