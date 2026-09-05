"use client";

import { ShieldCheck, Zap, Clock, RotateCcw, Award } from "lucide-react";
import { EvaluationMetrics } from "../types";

interface MetricsBarProps {
  metrics: EvaluationMetrics;
}

export function MetricsBar({ metrics }: MetricsBarProps) {
  return (
    <div className="w-full glass-panel rounded-2xl p-4 border border-cyan-500/20 shadow-xl">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Metric 1: Stale Results Spoken (Target: 0) */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-emerald-500/30 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase">Stale Spoken</div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-mono text-emerald-400">
                {metrics.stale_results_spoken}
              </span>
              <span className="text-[10px] font-mono text-emerald-500 font-semibold">
                (0 DEFECT)
              </span>
            </div>
          </div>
        </div>

        {/* Metric 2: Interruption Stop Latency */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-cyan-500/30 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
            <Zap className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase">Stop Latency</div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-cyan-300">
                {metrics.avg_interruption_stop_latency_ms}
              </span>
              <span className="text-[10px] font-mono text-slate-400">ms (&lt;50ms)</span>
            </div>
          </div>
        </div>

        {/* Metric 3: First Audio Latency */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase">First Audio</div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-slate-200">
                {metrics.avg_first_audio_latency_ms}
              </span>
              <span className="text-[10px] font-mono text-slate-400">ms</span>
            </div>
          </div>
        </div>

        {/* Metric 4: Recovery Rate */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center shrink-0">
            <RotateCcw className="h-5 w-5 text-teal-400" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase">Recovery Rate</div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-teal-300">
                {metrics.recovery_rate}%
              </span>
            </div>
          </div>
        </div>

        {/* Metric 5: Stale Prevention Rate */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shrink-0">
            <Award className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase">Stale Prevention</div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-purple-300">
                {metrics.stale_prevention_rate}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
