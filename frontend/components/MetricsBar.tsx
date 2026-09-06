"use client";

import { ShieldCheck, Zap, Clock, RotateCcw, Award, Activity } from "lucide-react";
import { EvaluationMetrics } from "../types";

interface MetricsBarProps {
  metrics: EvaluationMetrics;
}

export function MetricsBar({ metrics }: MetricsBarProps) {
  return (
    <div className="w-full studio-glass rounded-2xl p-3 sm:p-4 border border-cyan-500/25 shadow-2xl">
      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-cyan-400 animate-pulse" />
          <span className="text-xs font-mono font-bold tracking-widest text-slate-200 uppercase">
            REAL-TIME TELEMETRY // FULL-DUPLEX BENCHMARKS
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>FENCING GUARD: <strong className="text-emerald-400">ACTIVE</strong></span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
        {/* Metric 1: Stale Results Spoken (Target: 0) */}
        <div className="p-3 rounded-xl bg-slate-950/70 border border-emerald-500/40 relative overflow-hidden group hover:border-emerald-400/70 transition-all">
          <div className="absolute -right-2 -bottom-2 opacity-10 group-hover:opacity-20 transition-opacity">
            <ShieldCheck className="h-16 w-16 text-emerald-400" />
          </div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-md bg-emerald-500/15 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
            </div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              STALE SPOKEN
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono text-emerald-400 drop-shadow-sm">
              {metrics.stale_results_spoken}
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
              0 DEFECT
            </span>
          </div>
          <p className="text-[10px] text-slate-500 font-mono mt-1">
            Strict version fencing
          </p>
        </div>

        {/* Metric 2: Interruption Stop Latency */}
        <div className="p-3 rounded-xl bg-slate-950/70 border border-cyan-500/40 relative overflow-hidden group hover:border-cyan-400/70 transition-all">
          <div className="absolute -right-2 -bottom-2 opacity-10 group-hover:opacity-20 transition-opacity">
            <Zap className="h-16 w-16 text-cyan-400" />
          </div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-md bg-cyan-500/15 flex items-center justify-center text-cyan-400">
              <Zap className="h-3.5 w-3.5" />
            </div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              STOP LATENCY
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold font-mono text-cyan-300 drop-shadow-sm">
              {metrics.avg_interruption_stop_latency_ms}
            </span>
            <span className="text-xs font-mono text-cyan-400/80 font-semibold">ms</span>
            <span className="text-[10px] font-mono text-slate-500 ml-auto">&lt;50ms PASS</span>
          </div>
          <p className="text-[10px] text-slate-500 font-mono mt-1">
            Audible earcon cutoff
          </p>
        </div>

        {/* Metric 3: First Audio Latency */}
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 relative overflow-hidden group hover:border-blue-500/40 transition-all">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-md bg-blue-500/15 flex items-center justify-center text-blue-400">
              <Clock className="h-3.5 w-3.5" />
            </div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              FIRST AUDIO
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold font-mono text-slate-100">
              {metrics.avg_first_audio_latency_ms}
            </span>
            <span className="text-xs font-mono text-slate-400 font-semibold">ms</span>
          </div>
          <p className="text-[10px] text-slate-500 font-mono mt-1">
            Rime chunked streaming
          </p>
        </div>

        {/* Metric 4: Recovery Rate */}
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 relative overflow-hidden group hover:border-teal-500/40 transition-all">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-md bg-teal-500/15 flex items-center justify-center text-teal-400">
              <RotateCcw className="h-3.5 w-3.5" />
            </div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              RECOVERY RATE
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold font-mono text-teal-300">
              {metrics.recovery_rate}%
            </span>
            <span className="text-[10px] font-mono text-teal-400 font-semibold ml-auto">
              {metrics.successful_recoveries} RECOV
            </span>
          </div>
          <p className="text-[10px] text-slate-500 font-mono mt-1">
            Target intent preservation
          </p>
        </div>

        {/* Metric 5: Stale Prevention Rate */}
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 relative overflow-hidden group hover:border-purple-500/40 transition-all col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-md bg-purple-500/15 flex items-center justify-center text-purple-400">
              <Award className="h-3.5 w-3.5" />
            </div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              STALE GUARD
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold font-mono text-purple-300">
              {metrics.stale_prevention_rate}%
            </span>
            <span className="text-[10px] font-mono text-purple-400 font-semibold ml-auto">
              {metrics.stale_results_prevented} BLOCKED
            </span>
          </div>
          <p className="text-[10px] text-slate-500 font-mono mt-1">
            Fenced background tasks
          </p>
        </div>
      </div>
    </div>
  );
}
