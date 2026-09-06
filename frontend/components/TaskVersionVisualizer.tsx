"use client";

import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Clock, ArrowDown, GitBranch } from "lucide-react";
import { Task, TaskVersionRecord } from "../types";
import { Search } from "lucide-react";

interface TaskVersionVisualizerProps {
  task: Task | null;
  activeVersion?: number;
  onSelectVersion?: (version: TaskVersionRecord) => void;
}

export function TaskVersionVisualizer({ task, activeVersion: _activeVersion, onSelectVersion }: TaskVersionVisualizerProps) {
  if (!task || task.version_history.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col items-center justify-center text-center py-8">
        <GitBranch className="h-8 w-8 text-slate-600 mb-2" />
        <p className="text-xs font-mono text-slate-400">NO ACTIVE TASK RECORDED</p>
        <p className="text-[11px] text-slate-500 max-w-xs mt-1">
          Initiate a query to visualize the real-time Task Versioning and Fencing tree.
        </p>
      </div>
    );
  }

  const versions = [...task.version_history].sort((a, b) => a.version_number - b.version_number);

  return (
    <div className="glass-panel rounded-2xl p-5 border border-cyan-500/20 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-cyan-400" />
          <h3 className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
            CONVERSATION TRUTH GRAPH
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-400">
            Click card to inspect diffs
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            ACTIVE v{task.current_version}
          </span>
        </div>
      </div>

      {/* Version Progression Tree */}
      <div className="space-y-4">
        {versions.map((ver, idx) => {
          const isCurrent = ver.version_number === task.current_version;
          const isInterrupted = ver.status === "INTERRUPTED" || ver.status === "CANCELLED";
          const isCompleted = ver.status === "COMPLETED";

          return (
            <div key={ver.version_number} className="relative">
              {/* Branch Connection Line */}
              {idx > 0 && (
                <div className="flex flex-col items-center my-2">
                  <div className="flex items-center gap-2 text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30">
                    <XCircle className="h-3 w-3" />
                    <span>INVALIDATED & FENCED</span>
                  </div>
                  <ArrowDown className="h-4 w-4 text-slate-500 mt-1" />
                </div>
              )}

              {/* Version Card */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => onSelectVersion && onSelectVersion(ver)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer group hover:border-cyan-400/60 ${
                  isCurrent
                    ? "bg-slate-900/90 border-cyan-500/40 shadow-lg shadow-cyan-500/10"
                    : isInterrupted
                    ? "bg-slate-950/60 border-rose-500/30 opacity-70"
                    : "bg-slate-900/50 border-slate-800"
                }`}
              >
                {/* Title Bar */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                      isCurrent ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" : "bg-slate-800 text-slate-400"
                    }`}>
                      TASK v{ver.version_number}
                    </span>
                    <span className="text-xs font-semibold text-slate-200">
                      {ver.intent}
                    </span>
                  </div>

                  {/* Status icon & Inspect action */}
                  <div className="flex items-center gap-2">
                    {isInterrupted ? (
                      <div className="flex items-center gap-1 text-[11px] font-mono text-rose-400 font-medium">
                        <XCircle className="h-3.5 w-3.5" />
                        <span>INTERRUPTED</span>
                      </div>
                    ) : isCompleted ? (
                      <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>COMPLETED</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-[11px] font-mono text-amber-400 font-medium">
                        <Clock className="h-3.5 w-3.5 animate-spin" />
                        <span>ACTIVE</span>
                      </div>
                    )}
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono">
                      <Search className="h-3 w-3" /> INSPECT
                    </span>
                  </div>
                </div>

                {/* Constraints Breakdown */}
                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800/60 text-[11px] font-mono">
                  <div className="flex items-center justify-between px-2 py-1 rounded bg-slate-950/60 border border-slate-800/50">
                    <span className="text-slate-400">Highways:</span>
                    <span className={ver.constraints.highway_allowed === false ? "text-rose-400 font-semibold" : "text-emerald-400 font-semibold"}>
                      {ver.constraints.highway_allowed === false ? "FORBIDDEN (NO)" : "ALLOWED (YES)"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-2 py-1 rounded bg-slate-950/60 border border-slate-800/50">
                    <span className="text-slate-400">Preference:</span>
                    <span className="text-cyan-300 font-semibold uppercase">
                      {(ver.constraints.route_preference as string) || (ver.constraints.activity_type as string) || "FASTEST"}
                    </span>
                  </div>
                </div>

                {/* Spoken result indicator if completed */}
                {ver.spoken_response && (
                  <div className="mt-2.5 p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300">
                    <span className="font-mono font-bold">RIME SPOKEN TRUTH: </span>
                    <span>&ldquo;{ver.spoken_response}&rdquo;</span>
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

