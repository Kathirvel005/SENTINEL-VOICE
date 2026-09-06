"use client";

import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Clock, ArrowDown, GitBranch, Search, ShieldAlert, Sparkles } from "lucide-react";
import { Task, TaskVersionRecord } from "../types";

interface TaskVersionVisualizerProps {
  task: Task | null;
  activeVersion?: number;
  onSelectVersion?: (version: TaskVersionRecord) => void;
}

export function TaskVersionVisualizer({ task, activeVersion: _activeVersion, onSelectVersion }: TaskVersionVisualizerProps) {
  if (!task || task.version_history.length === 0) {
    return (
      <div className="studio-glass rounded-2xl p-6 border border-slate-800/80 flex flex-col items-center justify-center text-center py-10">
        <div className="w-12 h-12 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-center mb-2.5">
          <GitBranch className="h-6 w-6 text-slate-500" />
        </div>
        <p className="text-xs font-mono text-slate-300 font-bold uppercase tracking-wider">
          TASK VERSIONING GRAPH IDLE
        </p>
        <p className="text-[11px] text-slate-500 max-w-xs mt-1.5 font-mono">
          As soon as you speak, Sentinel dynamically assigns Task v1, and seamlessly fences stale computations on interruption to create v2.
        </p>
      </div>
    );
  }

  const versions = [...task.version_history].sort((a, b) => a.version_number - b.version_number);

  return (
    <div className="studio-glass rounded-2xl p-4 sm:p-5 border border-cyan-500/25 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <GitBranch className="h-3.5 w-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-mono font-bold tracking-wider text-slate-100 uppercase">
              CONVERSATION TRUTH GRAPH
            </h3>
            <span className="text-[10px] font-mono text-slate-500">
              MONOTONIC TASK FENCING ENGINE
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold">
            CURRENT: v{task.current_version}
          </span>
        </div>
      </div>

      {/* Version Progression Tree */}
      <div className="space-y-3.5">
        {versions.map((ver, idx) => {
          const isCurrent = ver.version_number === task.current_version;
          const isInterrupted = ver.status === "INTERRUPTED" || ver.status === "CANCELLED";
          const isCompleted = ver.status === "COMPLETED";

          return (
            <div key={ver.version_number} className="relative">
              {/* Branch Connection Line & Interruption Fence Pill */}
              {idx > 0 && (
                <div className="flex flex-col items-center my-2.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/40 shadow-sm animate-pulse">
                    <ShieldAlert className="h-3 w-3" />
                    <span>MUTATION FENCED (STALE OUTPUT BLOCKED)</span>
                  </div>
                  <ArrowDown className="h-4 w-4 text-cyan-400/60 mt-1 animate-bounce" />
                </div>
              )}

              {/* Version Card */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => onSelectVersion && onSelectVersion(ver)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer group hover:border-cyan-400/60 ${
                  isCurrent
                    ? "bg-gradient-to-r from-slate-900/95 to-cyan-950/30 border-cyan-500/45 shadow-lg shadow-cyan-500/10"
                    : isInterrupted
                    ? "bg-slate-950/70 border-rose-500/30 opacity-75 hover:opacity-100"
                    : "bg-slate-900/60 border-slate-800 hover:bg-slate-900/80"
                }`}
              >
                {/* Title Bar */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-extrabold ${
                      isCurrent 
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" 
                        : "bg-slate-800 text-slate-400 border border-slate-700"
                    }`}>
                      v{ver.version_number}
                    </span>
                    <span className="text-xs font-semibold text-slate-100 group-hover:text-cyan-200 transition-colors">
                      {ver.intent}
                    </span>
                  </div>

                  {/* Status Badge & Inspect action */}
                  <div className="flex items-center gap-2">
                    {isInterrupted ? (
                      <div className="flex items-center gap-1 text-[11px] font-mono text-rose-400 font-semibold px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/25">
                        <XCircle className="h-3.5 w-3.5" />
                        <span>FENCED</span>
                      </div>
                    ) : isCompleted ? (
                      <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>COMPLETED</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-[11px] font-mono text-amber-400 font-semibold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/25">
                        <Clock className="h-3.5 w-3.5 animate-spin" />
                        <span>ACTIVE</span>
                      </div>
                    )}
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-bold">
                      <Search className="h-3 w-3" /> DIFF
                    </span>
                  </div>
                </div>

                {/* Constraints Breakdown Matrix */}
                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono">
                  <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800/60">
                    <span className="text-slate-400">Highways:</span>
                    <span className={ver.constraints.highway_allowed === false ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>
                      {ver.constraints.highway_allowed === false ? "FORBIDDEN (NO)" : "ALLOWED (YES)"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800/60">
                    <span className="text-slate-400">Preference:</span>
                    <span className="text-cyan-300 font-bold uppercase">
                      {(ver.constraints.route_preference as string) || (ver.constraints.activity_type as string) || "FASTEST"}
                    </span>
                  </div>
                </div>

                {/* Spoken result indicator if completed */}
                {ver.spoken_response && (
                  <div className="mt-2.5 p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-[11px] text-emerald-300 font-mono">
                    <div className="flex items-center gap-1 text-emerald-400 font-bold mb-1">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>RIME SPOKEN VERIFIED TRUTH:</span>
                    </div>
                    <p className="text-slate-200 font-sans italic text-xs leading-relaxed">
                      &ldquo;{ver.spoken_response}&rdquo;
                    </p>
                  </div>
                )}
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
