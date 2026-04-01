"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useUiStore } from "@/lib/store";
import {
  TrendingUp,
  ClipboardList,
  Briefcase,
  FileText,
  SlidersHorizontal,
  BarChart2,
  Dices,
  FlaskConical,
  Sigma,
  Menu,
  X,
  ChevronLeft,
} from "lucide-react";

const NAV = [
  {
    group: "Laboratorio",
    items: [
      { label: "Análisis probabilísticos", href: "/lab", icon: Sigma },
      { label: "Análisis de activos", href: "/lab/analysis", icon: FlaskConical },
      { label: "Simulación", href: "/lab/simulation", icon: Dices },
    ],
  },
  {
    group: "Robo Advisor",
    items: [
      { label: "Perfil de riesgo", href: "/onboarding",    icon: ClipboardList     },
      { label: "Propuesta",        href: "/portfolio",      icon: Briefcase         },
      { label: "Propuesta formal", href: "/portfolio/proposal", icon: FileText      },
      { label: "Seguimiento",      href: "/portfolio/monitor", icon: BarChart2      },
      { label: "Optimizador",      href: "/optimizer",      icon: SlidersHorizontal },
    ],
  },
  {
    group: "Información",
    items: [
      { label: "Estadísticas", href: "/statistics", icon: BarChart2 },
      { label: "Opciones",     href: "/options",    icon: TrendingUp },
    ],
  },
];

function NavLink({
  href,
  icon: Icon,
  label,
  active,
  onClick,
  collapsed,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick?: () => void;
  collapsed?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all justify-center lg:justify-start ${
        collapsed ? "lg:justify-center" : ""
      } ${
        active
          ? "bg-[#1f4d3a] text-white shadow-sm"
          : "text-slate-500 hover:bg-[#f4f6f2] hover:text-slate-900"
      }`}
      title={collapsed ? label : undefined}
    >
      <Icon className={`w-4 h-4 shrink-0 ${active ? "text-white" : "text-slate-400"}`} />
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { sidebarCollapsed: collapsed, setSidebarCollapsed } = useUiStore();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/lab") return pathname === "/lab";
    if (href === "/portfolio") return pathname === "/portfolio";
    if (href === "/onboarding") return pathname === "/onboarding";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="border-b border-slate-200/80 px-4 py-5">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#1f4d3a] shrink-0">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <p className="text-sm font-extrabold tracking-tight text-slate-900">
                Laboratorio
              </p>
              <p className="text-[10px] font-medium text-slate-400">Robo Advisor · Finanzas</p>
            </div>
          )}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5">
        {NAV.map((section) => (
          <div key={section.group}>
            {!collapsed && (
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                {section.group}
              </p>
            )}
            <div className="space-y-1">
              {section.items.map((item) => (
                <div key={item.href} title={collapsed ? item.label : undefined}>
                  <NavLink
                    href={item.href}
                    icon={item.icon}
                    label={item.label}
                    active={isActive(item.href)}
                    onClick={() => setOpen(false)}
                    collapsed={collapsed}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="border-t border-slate-200/80 px-4 py-4">
          <p className="text-[10px] leading-relaxed text-slate-400">
            Datos: yfinance · data912.com
            <br />
            Plataforma educativa — no es asesoramiento financiero.
          </p>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center gap-3 border-b border-slate-200/80 bg-[#f8faf7]/92 px-4 py-3 backdrop-blur-xl">
        <button
          onClick={() => setOpen(true)}
          className="rounded-xl p-2 transition-colors hover:bg-slate-100"
        >
          <Menu className="w-5 h-5 text-slate-600" />
        </button>
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#1f4d3a]">
            <TrendingUp className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-extrabold text-slate-900">Laboratorio</span>
        </Link>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/12 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`lg:hidden fixed top-0 left-0 h-full w-64 z-50 bg-[#fbfcf9] shadow-2xl transform transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="absolute top-3 right-3">
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        {sidebarContent}
      </div>

      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex h-screen shrink-0 sticky top-0 flex-col border-r border-slate-200/80 bg-white/78 backdrop-blur-xl transition-all duration-300 ${
        collapsed ? "w-20" : "w-56"
      }`}>
        <div className="relative">
          {sidebarContent}
          {/* Toggle button */}
          <button
            onClick={() => setSidebarCollapsed(!collapsed)}
            className="absolute -right-3 top-5 rounded-full border border-slate-200 bg-white p-1.5 shadow-md transition-colors hover:bg-slate-50"
            title={collapsed ? "Expandir" : "Colapsar"}
          >
            <ChevronLeft className={`w-4 h-4 text-slate-600 transition-transform ${collapsed ? "rotate-180" : ""}`} />
          </button>
        </div>
      </aside>
    </>
  );
}
