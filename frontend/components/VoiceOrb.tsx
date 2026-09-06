"use client";

import { motion } from "framer-motion";
import { Mic, Volume2, Cpu, RefreshCw, AlertTriangle } from "lucide-react";
import { OrbState } from "../types";

interface VoiceOrbProps {
  orbState: OrbState;
  onClick?: () => void;
  taskVersion?: number;
}

export function VoiceOrb({ orbState, onClick, taskVersion = 1 }: VoiceOrbProps) {
  // State styling presets
  const stateConfigs: Record<OrbState, {
    label: string;
    colors: string[];
    ringColor: string;
    glowColor: string;
    icon: React.ComponentType<{ className?: string }>;
    textColor: string;
  }> = {
    IDLE: {
      label: "SYSTEM READY",
      colors: ["#0284c7", "#0369a1", "#082f49"],
      ringColor: "border-sky-500/30",
      glowColor: "rgba(14, 165, 233, 0.25)",
      icon: Mic,
      textColor: "text-sky-400",
    },
    LISTENING: {
      label: "LISTENING...",
      colors: ["#06b6d4", "#0891b2", "#164e63"],
      ringColor: "border-cyan-400/60",
      glowColor: "rgba(6, 182, 212, 0.5)",
      icon: Mic,
      textColor: "text-cyan-300",
    },
    THINKING: {
      label: "REASONING...",
      colors: ["#8b5cf6", "#7c3aed", "#4c1d95"],
      ringColor: "border-violet-400/60",
      glowColor: "rgba(139, 92, 246, 0.45)",
      icon: Cpu,
      textColor: "text-violet-300",
    },
    TOOL_WORKING: {
      label: "TOOL EXECUTING...",
      colors: ["#f59e0b", "#d97706", "#78350f"],
      ringColor: "border-amber-400/60",
      glowColor: "rgba(245, 158, 11, 0.45)",
      icon: RefreshCw,
      textColor: "text-amber-300",
    },
    SPEAKING: {
      label: "RIME SPEAKING",
      colors: ["#10b981", "#059669", "#064e3b"],
      ringColor: "border-emerald-400/70",
      glowColor: "rgba(16, 185, 129, 0.5)",
      icon: Volume2,
      textColor: "text-emerald-300",
    },
    INTERRUPTED: {
      label: "INTERRUPTED! HALTING",
      colors: ["#f43f5e", "#e11d48", "#881337"],
      ringColor: "border-rose-500/80",
      glowColor: "rgba(244, 63, 94, 0.65)",
      icon: AlertTriangle,
      textColor: "text-rose-300",
    },
    RECOVERING: {
      label: "RECOVERING CONTEXT",
      colors: ["#14b8a6", "#0d9488", "#134e4a"],
      ringColor: "border-teal-400/60",
      glowColor: "rgba(20, 184, 166, 0.45)",
      icon: RefreshCw,
      textColor: "text-teal-300",
    },
  };

  const config = stateConfigs[orbState] || stateConfigs.IDLE;
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center p-6 select-none">
      <div className="relative flex items-center justify-center cursor-pointer group" onClick={onClick}>
        {/* Outer expanding ripple rings */}
        <motion.div
          animate={{
            scale: orbState === "SPEAKING" || orbState === "LISTENING" ? [1, 1.45, 1] : [1, 1.12, 1],
            opacity: orbState === "INTERRUPTED" ? [0.8, 0, 0.8] : [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: orbState === "INTERRUPTED" ? 0.35 : 2.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className={`absolute w-64 h-64 rounded-full border ${config.ringColor} pointer-events-none`}
        />

        <motion.div
          animate={{
            scale: orbState === "SPEAKING" ? [1.1, 1.6, 1.1] : [1, 1.25, 1],
            opacity: [0.15, 0.4, 0.15],
          }}
          transition={{
            duration: 3.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className={`absolute w-80 h-80 rounded-full border border-dashed ${config.ringColor} pointer-events-none`}
        />

        {/* Dynamic Glowing Sphere */}
        <motion.div
          animate={{
            boxShadow: `0 0 50px ${config.glowColor}, inset 0 0 40px rgba(255,255,255,0.25)`,
            scale: orbState === "INTERRUPTED" ? [1, 0.9, 1] : [1, 1.03, 1],
          }}
          transition={{
            duration: orbState === "INTERRUPTED" ? 0.2 : 2.0,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative w-44 h-44 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 overflow-hidden"
          style={{
            background: `radial-gradient(circle at 35% 35%, ${config.colors[0]}, ${config.colors[1]} 60%, ${config.colors[2]})`,
          }}
        >
          {/* Internal rotating light streaks */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: orbState === "TOOL_WORKING" ? 3 : 15, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/30 via-transparent to-transparent pointer-events-none"
          />

          {/* Center Icon & Task Version Tag */}
          <div className="relative z-10 flex flex-col items-center justify-center text-white">
            <Icon className={`h-12 w-12 drop-shadow-md transition-transform ${orbState === "TOOL_WORKING" ? "animate-spin" : "group-hover:scale-110"}`} />
            <span className="text-[10px] font-mono tracking-widest uppercase opacity-90 mt-1">
              TASK v{taskVersion}
            </span>
          </div>
        </motion.div>
      </div>

      {/* State label badge */}
      <div className="mt-6 flex flex-col items-center">
        <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900/80 border border-slate-800 shadow-md">
          <span className={`w-2 h-2 rounded-full ${orbState === "SPEAKING" ? "bg-emerald-400 animate-ping" : orbState === "INTERRUPTED" ? "bg-rose-500" : "bg-cyan-400"}`}></span>
          <span className={`font-mono text-xs font-semibold tracking-wider uppercase ${config.textColor}`}>
            {config.label}
          </span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1.5 font-mono">
          Click orb or speak to start / interrupt
        </p>
      </div>
    </div>
  );
}
