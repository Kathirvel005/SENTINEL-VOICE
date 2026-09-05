"use client";

import { motion } from "framer-motion";
import { Terminal, Shield, AlertTriangle, Play, CheckCircle, Clock } from "lucide-react";
import { SentinelEvent } from "../types";

interface EventTimelineProps {
  events: SentinelEvent[];
}

export function EventTimeline({ events }: EventTimelineProps) {
  // Sort reverse chronological or scrollable
  const displayEvents = [...events].slice(-15).reverse();

  const getEventBadge = (type: string) => {
    switch (type) {
      case "USER_INTERRUPT":
        return { bg: "bg-rose-500/20 text-rose-300 border-rose-500/40", icon: AlertTriangle };
      case "AUDIO_STOPPED":
        return { bg: "bg-rose-500/15 text-rose-300 border-rose-500/30", icon: Shield };
      case "RESULT_REJECTED":
        return { bg: "bg-rose-500/25 text-rose-200 border-rose-500/50", icon: Shield };
      case "RESULT_ACCEPTED":
        return { bg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40", icon: CheckCircle };
      case "RIME_STREAM_STARTED":
      case "RIME_RESPONSE_PLAYED":
        return { bg: "bg-orange-500/20 text-orange-300 border-orange-500/40", icon: Play };
      case "TOOL_STARTED":
      case "TOOL_PROGRESS":
      case "TOOL_COMPLETED":
        return { bg: "bg-amber-500/20 text-amber-300 border-amber-500/40", icon: Clock };
      default:
        return { bg: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40", icon: Terminal };
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex flex-col h-[280px]">
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/80 mb-2">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-cyan-400" />
          <h3 className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
            EVENT TELEMETRY TIMELINE
          </h3>
        </div>
        <span className="text-[10px] font-mono text-slate-400">
          {events.length} TOTAL EVENTS
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {displayEvents.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs font-mono">
            Awaiting engine events...
          </div>
        ) : (
          displayEvents.map((evt, i) => {
            const badge = getEventBadge(evt.event_type);
            const Icon = badge.icon;
            return (
              <motion.div
                key={evt.event_id || i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 text-[11px] font-mono"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="text-slate-500 shrink-0 text-[10px]">
                    {evt.formatted_time}
                  </span>
                  <span className={`px-2 py-0.5 rounded border text-[9px] font-bold shrink-0 flex items-center gap-1 ${badge.bg}`}>
                    <Icon className="h-2.5 w-2.5" />
                    {evt.event_type}
                  </span>
                  <span className="text-slate-300 truncate">
                    {evt.description}
                  </span>
                </div>

                {evt.task_version && (
                  <span className="text-[10px] text-cyan-400 shrink-0 font-bold ml-2">
                    v{evt.task_version}
                  </span>
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
