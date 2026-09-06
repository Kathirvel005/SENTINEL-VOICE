"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Zap, Sparkles, Terminal, BookOpen, BarChart3, Settings } from "lucide-react";

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
    { href: "/console", label: "Console", icon: Terminal },
    { href: "/demo", label: "Guided Demo", icon: BookOpen },
    { href: "/evaluation", label: "Evaluation", icon: BarChart3 },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-cyan-500/20 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Left: Brand & Tagline */}
        <div className="flex items-center gap-3">
          <Link href="/console" className="flex items-center gap-2 group">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-wider text-lg text-white font-mono">
                  SENTINEL
                </span>
                <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono font-medium">
                  v1.0 VOICE
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block tracking-wide">
                FULL-DUPLEX VOICE RELIABILITY
              </p>
            </div>
          </Link>
        </div>

        {/* Center: Navigation Routes */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (pathname === "/" && item.href === "/console");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Telemetry Status & Stress Mode Switch */}
        <div className="flex items-center gap-3">
          {/* Stress Mode Toggle */}
          <button
            onClick={onToggleStressMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all border ${
              isStressMode
                ? "bg-rose-500/20 border-rose-500/50 text-rose-300 animate-pulse shadow-lg shadow-rose-500/20"
                : "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <Zap className={`h-3.5 w-3.5 ${isStressMode ? "text-rose-400 fill-rose-400" : ""}`} />
            {isStressMode ? "STRESS MODE (7.5s)" : "NORMAL MODE"}
          </button>

          {/* Rime Status Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-300 text-[11px] font-mono">
            <Sparkles className="h-3 w-3 text-orange-400" />
            <span>RIME {rimeStatus}</span>
          </div>

          {/* Live indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isConnected ? "bg-emerald-400" : "bg-rose-400"} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? "bg-emerald-500" : "bg-rose-500"}`}></span>
            </span>
            <span>{isConnected ? "LIVE" : "OFFLINE"}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
