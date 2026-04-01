import Link from "next/link";

const FLOATING_NOTES = [
  { label: "VaR", className: "left-[10%] top-[18%] rotate-[-7deg]" },
  { label: "Monte Carlo", className: "right-[11%] top-[24%] rotate-[8deg]" },
  { label: "Portfolios", className: "left-[16%] bottom-[20%] rotate-[6deg]" },
  { label: "Research", className: "right-[15%] bottom-[18%] rotate-[-8deg]" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-[var(--background)] text-slate-900">
      <main className="relative flex min-h-screen items-center justify-center px-6 py-16">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(31,77,58,0.08),transparent_36%),radial-gradient(circle_at_bottom,rgba(31,77,58,0.05),transparent_30%)]" />

          <div
            className="absolute inset-0 opacity-[0.38]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(31,77,58,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(31,77,58,0.055) 1px, transparent 1px)",
              backgroundSize: "52px 52px",
              maskImage: "radial-gradient(circle at center, black 26%, transparent 78%)",
              WebkitMaskImage: "radial-gradient(circle at center, black 26%, transparent 78%)",
            }}
          />

          <div className="absolute left-1/2 top-1/2 h-[38rem] w-[38rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#1f4d3a]/10" />
          <div className="absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#1f4d3a]/8" />
          <div className="absolute left-1/2 top-1/2 h-[18rem] w-[18rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#1f4d3a]/8" />

          <div className="absolute left-1/2 top-1/2 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1f4d3a]/[0.045] blur-3xl" />
          <div className="absolute left-[22%] top-[20%] h-48 w-48 rounded-full bg-white/60 blur-3xl" />
          <div className="absolute right-[18%] bottom-[18%] h-56 w-56 rounded-full bg-[#1f4d3a]/[0.06] blur-3xl" />

          <div
            className="absolute left-1/2 top-1/2 h-[24rem] w-[24rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-80"
            style={{
              background:
                "conic-gradient(from 180deg at 50% 50%, rgba(31,77,58,0.00) 0deg, rgba(31,77,58,0.09) 48deg, rgba(31,77,58,0.00) 92deg, rgba(31,77,58,0.00) 360deg)",
              filter: "blur(1px)",
            }}
          />

          <div className="absolute inset-x-[8%] top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-[#1f4d3a]/20 to-transparent" />
          <div className="absolute left-1/2 top-[10%] h-[80%] w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[#1f4d3a]/12 to-transparent" />

          <div className="absolute left-[22%] top-[31%] h-2.5 w-2.5 rounded-full bg-[#1f4d3a]/30 animate-pulse" style={{ animationDuration: "4.2s" }} />
          <div className="absolute right-[24%] top-[38%] h-2 w-2 rounded-full bg-slate-400/45 animate-pulse" style={{ animationDuration: "5.3s" }} />
          <div className="absolute left-[30%] bottom-[28%] h-2 w-2 rounded-full bg-slate-300/80 animate-pulse" style={{ animationDuration: "6.1s" }} />
          <div className="absolute right-[31%] bottom-[24%] h-3 w-3 rounded-sm border border-[#1f4d3a]/20 bg-white/70 animate-pulse" style={{ animationDuration: "4.8s" }} />

          {FLOATING_NOTES.map((note) => (
            <div
              key={note.label}
              className={`absolute hidden rounded-full border border-[#1f4d3a]/10 bg-white/70 px-3 py-1.5 text-[11px] font-medium tracking-[0.16em] text-[#1f4d3a]/70 shadow-[0_10px_30px_rgba(15,23,42,0.04)] backdrop-blur-md md:block ${note.className}`}
            >
              {note.label}
            </div>
          ))}
        </div>

        <section className="relative z-10 flex max-w-4xl flex-col items-center text-center">
          <div className="mb-6 flex items-center gap-4">
            <span className="h-px w-12 bg-[#1f4d3a]/20" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#1f4d3a]/65">
              Quantitative Research
            </p>
            <span className="h-px w-12 bg-[#1f4d3a]/20" />
          </div>

          <h1 className="text-6xl font-semibold tracking-[-0.07em] text-slate-900 md:text-[7.5rem]">
            <span className="text-slate-900">Quant</span>
            <span className="text-[#1f4d3a]">Lab</span>
          </h1>

          <p className="mt-4 max-w-2xl text-balance text-lg leading-8 text-slate-500 md:text-[1.15rem]">
            Research, portfolio construction and simulation in a calm, focused workspace.
          </p>

          <div className="mt-8 flex items-center gap-3 rounded-full border border-[#1f4d3a]/10 bg-white/75 px-4 py-2 shadow-[0_14px_50px_rgba(15,23,42,0.05)] backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-[#1f4d3a]/70" />
            <span className="text-[11px] font-medium uppercase tracking-[0.24em] text-slate-500">
              Robo Advisor • Simulation • Lab
            </span>
          </div>

          <Link
            href="/onboarding"
            className="mt-10 inline-flex min-h-12 items-center justify-center rounded-2xl border border-[#1f4d3a] bg-[#1f4d3a] px-8 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(31,77,58,0.18)] transition-all hover:-translate-y-0.5 hover:bg-[#183b2d]"
          >
            Empezar
          </Link>

          <p className="mt-6 text-sm tracking-[0.08em] text-slate-400">
            Análisis probabilístico, propuesta de cartera y seguimiento.
          </p>
        </section>
      </main>
    </div>
  );
}
