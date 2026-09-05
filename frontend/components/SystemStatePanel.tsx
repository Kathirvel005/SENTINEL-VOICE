"use client";

import { Cpu, Globe, ShieldAlert, Sparkles, Navigation, Layers } from "lucide-react";
import { Task } from "../types";

interface SystemStatePanelProps {
  task: Task | null;
  currentLanguage: string;
  staleAlert: { rejectedVersion: number; activeVersion: number; reason: string } | null;
  toolDelayMs?: number;
}

export function SystemStatePanel({
  task,
  currentLanguage,
  staleAlert,
  toolDelayMs = 3500,
}: SystemStatePanelProps) {
  const constraints = task?.constraints || {};

  return (
    <div className="space-y-4">
      {/* Stale Result Interception Alert Banner */}
      {staleAlert && (
        <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs animate-bounce shadow-lg shadow-rose-500/20">
          <div className="flex items-center gap-2 font-mono font-bold text-rose-300 mb-1">
            <ShieldAlert className="h-4 w-4 text-rose-400" />
            <span>STALE RESULT FENCED & DROPPED</span>
          </div>
          <p className="text-[11px] font-mono text-rose-300/90 leading-relaxed">
            Obsolete v{staleAlert.rejectedVersion} result arrived but was blocked. Active version is v{staleAlert.activeVersion}. Stale result was NOT spoken.
          </p>
        </div>
      )}

      {/* Live System State Card */}
      <div className="glass-panel rounded-2xl p-4 border border-cyan-500/20 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-cyan-400" />
            <h3 className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
              LIVE SYSTEM STATE
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            ENGINE RUNNING
          </span>
        </div>

        <div className="space-y-2.5 text-xs font-mono">
          {/* Task ID & Version */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-cyan-400" /> Task / Version:
            </span>
            <span className="text-slate-200 font-semibold">
              {task?.task_id || "None"} <span className="text-cyan-400 font-bold">(v{task?.current_version || 1})</span>
            </span>
          </div>

          {/* Active Tool */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Navigation className="h-3.5 w-3.5 text-amber-400" /> Active Tool:
            </span>
            <span className="text-amber-300 font-semibold">
              {task?.tool_name || "Idle"} <span className="text-slate-500">({toolDelayMs}ms)</span>
            </span>
          </div>

          {/* Language Routing */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-purple-400" /> Language Layer:
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
              currentLanguage.includes("Tamil") ? "bg-purple-500/20 text-purple-300 border border-purple-500/40" : "text-slate-300"
            }`}>
              {currentLanguage}
            </span>
          </div>

          {/* Rime TTS Status */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-orange-400" /> Spoken Engine:
            </span>
            <span className="text-orange-300 font-semibold">
              RIME TTS (Model: mist / amber)
            </span>
          </div>
        </div>

        {/* Accumulated Constraints */}
        <div className="mt-3 pt-3 border-t border-slate-800/80">
          <div className="text-[11px] font-mono text-slate-400 mb-2 flex items-center justify-between">
            <span>ACCUMULATED CONSTRAINTS:</span>
            <span className="text-[10px] text-slate-500">{Object.keys(constraints).length} active</span>
          </div>

          {Object.keys(constraints).length === 0 ? (
            <p className="text-[11px] font-mono text-slate-500 italic">No constraints applied yet.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(constraints).map(([k, v]) => (
                <span
                  key={k}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    k === "highway_allowed" && v === false
                      ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                      : "bg-cyan-500/10 text-cyan-300 border-cyan-500/20"
                  }`}
                >
                  {k}: <span className="font-bold">{String(v)}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
