"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Zap, Sparkles, Terminal, BookOpen, BarChart3, Settings, Radio } from "lucide-react";

interface TopNavProps {
  isConnected: boolean;
  isStressMode: boolean;
  onToggleStressMode: () => void;
  rimeStatus?: string;
}

export function TopNav({
  isConnected,
  isStressMode,
  onToggleStressMode,
  rimeStatus = "CONNECTED",
}: TopNavProps) {
  const pathname = usePathname();

  const navLinks = [
    { href: "/console", label: "Studio Console", icon: Terminal },
    { href: "/demo", label: "Scenario Lab", icon: BookOpen },
    { href: "/evaluation", label: "Benchmarking", icon: BarChart3 },
    { href: "/settings", label: "DSP & Audio Config", icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-cyan-500/20 bg-[#030712]/85 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-15 flex items-center justify-between gap-4">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/console" className="flex items-center gap-3 group">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-700 shadow-md shadow-cyan-500/25 border border-cyan-400/40 group-hover:scale-105 transition-transform">
              <Shield className="h-5 w-5 text-white" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500 border border-slate-950"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-wider text-base text-white font-mono">
                  SENTINEL
                </span>
                <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono font-bold tracking-tight">
                  PRO STUDIO
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block tracking-widest font-mono uppercase">
                FULL-DUPLEX VOICE INTELLIGENCE
              </p>
            </div>
          </Link>
        </div>

        {/* Center: Pro Navigation Pills */}
        <nav className="hidden md:flex items-center gap-1.5 bg-slate-950/70 p-1 rounded-xl border border-slate-800/80 shadow-inner">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (pathname === "/" && item.href === "/console");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm shadow-cyan-500/10"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? "text-cyan-400" : "text-slate-500"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right: Studio Status & Telemetry HUD Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Audio Engine Telemetry Chip */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-slate-400">
            <Radio className="h-3 w-3 text-cyan-400 animate-pulse" />
            <span>22.05kHz / 16-BIT</span>
          </div>

          {/* Stress Injection Mode Switch */}
          <button
            onClick={onToggleStressMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all border shadow-sm ${
              isStressMode
                ? "bg-rose-500/20 border-rose-500/60 text-rose-300 animate-pulse shadow-rose-500/25"
                : "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
            }`}
            title="Inject artificial 7.5s tool latency to test stale guard"
          >
            <Zap className={`h-3.5 w-3.5 ${isStressMode ? "text-rose-400 fill-rose-400" : "text-slate-500"}`} />
            <span className="hidden sm:inline">{isStressMode ? "STRESS MODE (7.5s)" : "NORMAL MODE"}</span>
            <span className="sm:hidden">{isStressMode ? "STRESS" : "NORM"}</span>
          </button>

          {/* Rime Neural Voice Status */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-mono">
            <Sparkles className="h-3 w-3 text-amber-400" />
            <span>RIME {rimeStatus}</span>
          </div>

          {/* Realtime WebSocket Link Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-xs font-mono">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isConnected ? "bg-emerald-400" : "bg-rose-400"} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? "bg-emerald-500" : "bg-rose-500"}`}></span>
            </span>
            <span className={isConnected ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}>
              {isConnected ? "LIVE" : "OFFLINE"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
