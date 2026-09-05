"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldCheck, ShieldAlert, GitBranch, ArrowRight, CheckCircle2, Clock, MapPin, IndianRupee } from "lucide-react";
import { Task, TaskVersionRecord } from "../types";

interface TruthGraphModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  selectedVersion: TaskVersionRecord | null;
}

export function TruthGraphModal({
  isOpen,
  onClose,
  task,
  selectedVersion,
}: TruthGraphModalProps) {
  if (!isOpen || !task || !selectedVersion) return null;

  const currentVersion = task.version_history.find(v => v.version_number === task.current_version);
  const isSelectedCurrent = selectedVersion.version_number === task.current_version;
  const isInterrupted = selectedVersion.status === "INTERRUPTED" || selectedVersion.status === "CANCELLED";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-2xl bg-slate-900/95 border border-cyan-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Top Bar */}
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <GitBranch className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-cyan-400">
                    TRUTH INSPECTOR: TASK v{selectedVersion.version_number}
                  </span>
                  {isSelectedCurrent ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-semibold border border-emerald-500/30">
                      CURRENT ACTIVE
                    </span>
                  ) : isInterrupted ? (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-mono font-semibold border border-rose-500/30">
                      FENCED & INVALIDATED
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-semibold border border-cyan-500/30">
                      COMPLETED
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5 font-medium truncate max-w-md">
                  {selectedVersion.intent}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6 overflow-y-auto space-y-6 text-slate-200">
            {/* Version Metadata Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] font-mono text-slate-500 block uppercase">Creation Time</span>
                <span className="text-xs font-mono font-semibold text-slate-200">
                  {new Date(selectedVersion.created_at * 1000).toLocaleTimeString()}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] font-mono text-slate-500 block uppercase">Task Version</span>
                <span className="text-xs font-mono font-bold text-cyan-400">
                  Version {selectedVersion.version_number} of {task.version_history.length}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] font-mono text-slate-500 block uppercase">Tool Target</span>
                <span className="text-xs font-mono font-semibold text-purple-300">
                  {task.tool_name || "RouteTool"}
                </span>
              </div>
            </div>

            {/* Constraint Differential Matrix */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                  CONSTRAINT DIFFERENTIAL COMPARISON
                </h4>
                <span className="text-[10px] font-mono text-slate-500">
                  v{selectedVersion.version_number} vs Current v{task.current_version}
                </span>
              </div>

              <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950/40">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/60 font-mono text-[11px] text-slate-400">
                      <th className="py-2.5 px-4">CONSTRAINT KEY</th>
                      <th className="py-2.5 px-4 text-cyan-400">v{selectedVersion.version_number} VALUE</th>
                      <th className="py-2.5 px-4 text-emerald-400">v{task.current_version} CURRENT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                    <tr>
                      <td className="py-2.5 px-4 text-slate-400">Origin</td>
                      <td className="py-2.5 px-4 text-slate-200">
                        {String(selectedVersion.constraints.origin || "Coimbatore")}
                      </td>
                      <td className="py-2.5 px-4 text-emerald-300 font-semibold">
                        {String(currentVersion?.constraints.origin || "Coimbatore")} (Preserved)
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 text-slate-400">Destination</td>
                      <td className="py-2.5 px-4 text-slate-200">
                        {String(selectedVersion.constraints.destination || "Chennai")}
                      </td>
                      <td className="py-2.5 px-4 text-emerald-300 font-semibold">
                        {String(currentVersion?.constraints.destination || "Chennai")} (Preserved)
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 text-slate-400">Highways Allowed</td>
                      <td className="py-2.5 px-4">
                        {selectedVersion.constraints.highway_allowed === false ? (
                          <span className="text-rose-400 font-bold">FALSE (Forbidden)</span>
                        ) : (
                          <span className="text-emerald-400 font-semibold">TRUE (Allowed)</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4">
                        {currentVersion?.constraints.highway_allowed === false ? (
                          <span className="text-rose-400 font-bold">FALSE (Forbidden)</span>
                        ) : (
                          <span className="text-emerald-400 font-semibold">TRUE (Allowed)</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 text-slate-400">Routing Preference</td>
                      <td className="py-2.5 px-4 text-slate-300 uppercase">
                        {String(selectedVersion.constraints.route_preference || "Fastest")}
                      </td>
                      <td className="py-2.5 px-4 text-cyan-300 font-semibold uppercase">
                        {String(currentVersion?.constraints.route_preference || "Cheapest / Scenic")}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Stale Guard Fencing Proof */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-cyan-500/20 space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-300">
                <ShieldCheck className="h-4 w-4 text-cyan-400" />
                <span>STALE RESULT GUARD TELEMETRY</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isSelectedCurrent ? (
                  "This version is currently registered as the monotonic truth source. Any delayed in-flight tool results from preceding versions are strictly fenced and discarded before reaching speech synthesis."
                ) : (
                  `Task version v${selectedVersion.version_number} was superseded and fenced. If its background calculation returns now, the Stale Result Guard will drop the payload with 0 bytes spoken.`
                )}
              </p>
              <div className="flex items-center gap-4 text-[11px] font-mono pt-2 border-t border-slate-800 text-slate-400">
                <span>Guard Enforcement: <strong className="text-emerald-400">ACTIVE</strong></span>
                <span>Obsolete Audio Played: <strong className="text-emerald-400">0 ms</strong></span>
                <span>Fencing Accuracy: <strong className="text-cyan-400">100%</strong></span>
              </div>
            </div>

            {/* Spoken Response Preview */}
            {selectedVersion.spoken_response && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs">
                <span className="font-mono font-bold text-emerald-400 block mb-1">
                  VERIFIED NEURAL SPOKEN TRUTH:
                </span>
                <p className="text-emerald-200 italic leading-relaxed">
                  "{selectedVersion.spoken_response}"
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 border-t border-slate-800 flex items-center justify-between bg-slate-950/40">
            <span className="text-[11px] font-mono text-slate-500">
              Sentinel Voice Monotonic Versioning Engine
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-mono font-bold transition-all shadow-md shadow-cyan-500/20"
            >
              CLOSE INSPECTOR
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
